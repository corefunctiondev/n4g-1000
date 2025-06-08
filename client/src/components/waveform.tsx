import { useEffect, useRef, useCallback } from 'react';
import { AudioTrack } from '@/types/audio';

interface WaveformProps {
  track: AudioTrack | null;
  currentTime: number;
  width: number;
  height: number;
  color: string;
  onSeek?: (time: number) => void;
  className?: string;
  analyser?: AnalyserNode | null;
  isPlaying?: boolean;
}

export function Waveform({
  track,
  currentTime,
  width,
  height,
  color,
  onSeek,
  className = '',
  analyser,
  isPlaying = false,
}: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const waveformDataRef = useRef<Float32Array | null>(null);

  // Generate static waveform data when track loads
  useEffect(() => {
    if (track?.waveformData) {
      const samples = track.waveformData;
      const samplesPerPixel = Math.floor(samples.length / width);
      const waveformData = new Float32Array(width);
      
      for (let i = 0; i < width; i++) {
        let sum = 0;
        const start = i * samplesPerPixel;
        const end = Math.min(start + samplesPerPixel, samples.length);
        
        for (let j = start; j < end; j++) {
          sum += Math.abs(samples[j]);
        }
        waveformData[i] = sum / (end - start);
      }
      
      waveformDataRef.current = waveformData;
    }
  }, [track, width]);

  // Real-time scrolling waveform visualization with higher update rate
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Clear canvas with authentic CDJ-3000 background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
    
    // Draw professional beat grid based on BPM
    if (track && track.bpm > 0) {
      const windowStart = Math.max(0, currentTime - 4);
      const windowEnd = Math.min(track.duration, currentTime + 4);
      const beatInterval = 60 / track.bpm;
      
      // Major grid lines (bars) 
      const beatsPerBar = 4;
      const barInterval = beatInterval * beatsPerBar;
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      
      const firstBar = Math.floor(windowStart / barInterval);
      const lastBar = Math.ceil(windowEnd / barInterval);
      
      for (let bar = firstBar; bar <= lastBar; bar++) {
        const barTime = bar * barInterval;
        if (barTime >= windowStart && barTime <= windowEnd) {
          const x = ((barTime - windowStart) / (windowEnd - windowStart)) * width;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
      }
      
      // Minor grid lines (beats)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 0.5;
      
      const firstBeat = Math.floor(windowStart / beatInterval);
      const lastBeat = Math.ceil(windowEnd / beatInterval);
      
      for (let beat = firstBeat; beat <= lastBeat; beat++) {
        const beatTime = beat * beatInterval;
        if (beatTime >= windowStart && beatTime <= windowEnd && beatTime % barInterval !== 0) {
          const x = ((beatTime - windowStart) / (windowEnd - windowStart)) * width;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
      }
    }

    // Draw 3-lane CDJ-3000 style frequency band waveform
    if (waveformDataRef.current && track) {
      const waveformData = waveformDataRef.current;
      const totalDuration = track.duration;
      
      // Calculate visible time window (4 seconds before and after current position)
      const windowStart = Math.max(0, currentTime - 4);
      const windowEnd = Math.min(totalDuration, currentTime + 4);
      const windowDuration = windowEnd - windowStart;
      
      // Define the 3 horizontal lanes with authentic CDJ-3000 colors
      const laneHeight = height / 3;
      const highLane = { y: 0, height: laneHeight, color: '#0080ff', label: 'HIGH' };      // Blue
      const midLane = { y: laneHeight, height: laneHeight, color: '#ff8000', label: 'MID' }; // Orange  
      const lowLane = { y: laneHeight * 2, height: laneHeight, color: '#ffff00', label: 'LOW' }; // Yellow/White
      
      // Calculate data indices for this time window
      const samplesPerSecond = waveformData.length / totalDuration;
      const startIndex = Math.floor(windowStart * samplesPerSecond);
      const endIndex = Math.floor(windowEnd * samplesPerSecond);
      
      // Draw each frequency lane
      const visibleSamples = endIndex - startIndex;
      const barWidth = Math.max(1, width / visibleSamples);
      
      for (let i = 0; i < visibleSamples && startIndex + i < waveformData.length; i++) {
        const amplitude = waveformData[startIndex + i];
        const timePosition = windowStart + (i / visibleSamples) * windowDuration;
        const x = ((timePosition - windowStart) / windowDuration) * width;
        
        // Calculate distance from playhead for brightness
        const distanceFromPlayhead = Math.abs(timePosition - currentTime);
        const brightness = distanceFromPlayhead < 1 ? 1 : Math.max(0.4, 1 - distanceFromPlayhead / 4);
        
        // Simulate frequency band amplitudes based on the audio data
        const scaledAmp = Math.min(amplitude * 2, 1);
        
        // HIGH lane (top) - Blue for high frequencies
        const highAmp = scaledAmp * (0.7 + Math.sin(i * 0.12) * 0.25);
        if (highAmp > 0.03) {
          const barHeight = Math.min(highAmp * laneHeight * 0.95, laneHeight * 0.95);
          const laneCenter = highLane.y + laneHeight / 2;
          const intensity = Math.min(highAmp * 2, 1);
          
          // Create gradient for depth
          const gradient = ctx.createLinearGradient(0, laneCenter - barHeight/2, 0, laneCenter + barHeight/2);
          gradient.addColorStop(0, `rgba(0, 128, 255, ${brightness * intensity})`);
          gradient.addColorStop(0.5, `rgba(0, 160, 255, ${brightness * intensity * 0.8})`);
          gradient.addColorStop(1, `rgba(0, 100, 200, ${brightness * intensity * 0.6})`);
          
          ctx.fillStyle = gradient;
          ctx.fillRect(x, laneCenter - barHeight/2, barWidth, barHeight);
          
          // Add peak highlight
          if (intensity > 0.7) {
            ctx.fillStyle = `rgba(255, 255, 255, ${brightness * 0.4})`;
            ctx.fillRect(x, laneCenter - barHeight/2, barWidth, 2);
          }
        }
        
        // MID lane (middle) - Orange for mid frequencies
        const midAmp = scaledAmp * (0.85 + Math.cos(i * 0.18) * 0.15);
        if (midAmp > 0.03) {
          const barHeight = Math.min(midAmp * laneHeight * 0.95, laneHeight * 0.95);
          const laneCenter = midLane.y + laneHeight / 2;
          const intensity = Math.min(midAmp * 2, 1);
          
          const gradient = ctx.createLinearGradient(0, laneCenter - barHeight/2, 0, laneCenter + barHeight/2);
          gradient.addColorStop(0, `rgba(255, 128, 0, ${brightness * intensity})`);
          gradient.addColorStop(0.5, `rgba(255, 150, 0, ${brightness * intensity * 0.8})`);
          gradient.addColorStop(1, `rgba(200, 100, 0, ${brightness * intensity * 0.6})`);
          
          ctx.fillStyle = gradient;
          ctx.fillRect(x, laneCenter - barHeight/2, barWidth, barHeight);
          
          if (intensity > 0.7) {
            ctx.fillStyle = `rgba(255, 255, 255, ${brightness * 0.4})`;
            ctx.fillRect(x, laneCenter - barHeight/2, barWidth, 2);
          }
        }
        
        // LOW lane (bottom) - Yellow/White for bass frequencies
        const lowAmp = scaledAmp * (0.95 + Math.sin(i * 0.08) * 0.05);
        if (lowAmp > 0.03) {
          const barHeight = Math.min(lowAmp * laneHeight * 0.95, laneHeight * 0.95);
          const laneCenter = lowLane.y + laneHeight / 2;
          const intensity = Math.min(lowAmp * 2, 1);
          
          const gradient = ctx.createLinearGradient(0, laneCenter - barHeight/2, 0, laneCenter + barHeight/2);
          gradient.addColorStop(0, `rgba(255, 255, 0, ${brightness * intensity})`);
          gradient.addColorStop(0.3, `rgba(255, 255, 100, ${brightness * intensity * 0.9})`);
          gradient.addColorStop(1, `rgba(200, 200, 0, ${brightness * intensity * 0.7})`);
          
          ctx.fillStyle = gradient;
          ctx.fillRect(x, laneCenter - barHeight/2, barWidth, barHeight);
          
          if (intensity > 0.7) {
            ctx.fillStyle = `rgba(255, 255, 255, ${brightness * 0.5})`;
            ctx.fillRect(x, laneCenter - barHeight/2, barWidth, 2);
          }
        }
      }
      
      // Draw lane separators
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, laneHeight);
      ctx.lineTo(width, laneHeight);
      ctx.moveTo(0, laneHeight * 2);
      ctx.lineTo(width, laneHeight * 2);
      ctx.stroke();
      
      // Draw lane labels
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = '12px Arial, sans-serif';
      ctx.fillText('HIGH', 8, 18);
      ctx.fillText('MID', 8, laneHeight + 18);
      ctx.fillText('LOW', 8, laneHeight * 2 + 18);
    }

    // Draw real-time frequency analysis overlay for each lane
    if (isPlaying && analyser) {
      const freqData = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(freqData);
      
      const laneHeight = height / 3;
      
      // Define frequency ranges optimized for CDJ-3000 analysis
      const sampleRate = 44100;
      const freqPerBin = sampleRate / 2 / freqData.length;
      
      // Frequency band ranges (Hz)
      const bassRange = { start: 20, end: 250 };
      const midRange = { start: 250, end: 4000 };
      const highRange = { start: 4000, end: 20000 };
      
      // Convert to bin indices
      const bassStart = Math.floor(bassRange.start / freqPerBin);
      const bassEnd = Math.floor(bassRange.end / freqPerBin);
      const midStart = bassEnd;
      const midEnd = Math.floor(midRange.end / freqPerBin);
      const highStart = midEnd;
      const highEnd = Math.min(freqData.length, Math.floor(highRange.end / freqPerBin));
      
      // Calculate RMS for each frequency band
      let bassRMS = 0, midRMS = 0, highRMS = 0;
      
      // Bass analysis
      for (let i = bassStart; i < bassEnd; i++) {
        const value = freqData[i] / 255;
        bassRMS += value * value;
      }
      bassRMS = Math.sqrt(bassRMS / (bassEnd - bassStart));
      
      // Mid analysis
      for (let i = midStart; i < midEnd; i++) {
        const value = freqData[i] / 255;
        midRMS += value * value;
      }
      midRMS = Math.sqrt(midRMS / (midEnd - midStart));
      
      // High analysis
      for (let i = highStart; i < highEnd; i++) {
        const value = freqData[i] / 255;
        highRMS += value * value;
      }
      highRMS = Math.sqrt(highRMS / (highEnd - highStart));
      
      // Add live overlay effects to each lane at playhead position
      const playheadX = width / 2;
      const overlayWidth = 40; // Width of live overlay effect
      
      // HIGH lane live overlay - Blue
      if (highRMS > 0.008) {
        const highIntensity = Math.min(highRMS * 4, 1);
        const overlayHeight = highIntensity * laneHeight * 0.9;
        const laneCenter = laneHeight / 2;
        
        // Pulsing effect based on frequency content
        const pulse = Math.sin(Date.now() * 0.01) * 0.2 + 0.8;
        
        ctx.fillStyle = `rgba(0, 128, 255, ${highIntensity * 0.8 * pulse})`;
        ctx.fillRect(playheadX - overlayWidth/2, laneCenter - overlayHeight/2, overlayWidth, overlayHeight);
        
        // Intense peak flash
        if (highRMS > 0.6) {
          ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * pulse})`;
          ctx.fillRect(playheadX - 3, 0, 6, laneHeight);
        }
      }
      
      // MID lane live overlay - Orange
      if (midRMS > 0.008) {
        const midIntensity = Math.min(midRMS * 4, 1);
        const overlayHeight = midIntensity * laneHeight * 0.9;
        const laneCenter = laneHeight + laneHeight / 2;
        
        const pulse = Math.sin(Date.now() * 0.008) * 0.2 + 0.8;
        
        ctx.fillStyle = `rgba(255, 128, 0, ${midIntensity * 0.8 * pulse})`;
        ctx.fillRect(playheadX - overlayWidth/2, laneCenter - overlayHeight/2, overlayWidth, overlayHeight);
        
        if (midRMS > 0.6) {
          ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * pulse})`;
          ctx.fillRect(playheadX - 3, laneHeight, 6, laneHeight);
        }
      }
      
      // LOW lane live overlay - Yellow/White
      if (bassRMS > 0.008) {
        const bassIntensity = Math.min(bassRMS * 4, 1);
        const overlayHeight = bassIntensity * laneHeight * 0.9;
        const laneCenter = laneHeight * 2 + laneHeight / 2;
        
        const pulse = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
        
        ctx.fillStyle = `rgba(255, 255, 0, ${bassIntensity * 0.9 * pulse})`;
        ctx.fillRect(playheadX - overlayWidth/2, laneCenter - overlayHeight/2, overlayWidth, overlayHeight);
        
        if (bassRMS > 0.6) {
          ctx.fillStyle = `rgba(255, 255, 255, ${1.0 * pulse})`;
          ctx.fillRect(playheadX - 3, laneHeight * 2, 6, laneHeight);
        }
      }
    }

    // Draw cue points and markers
    if (track) {
      const windowStart = Math.max(0, currentTime - 4);
      const windowEnd = Math.min(track.duration, currentTime + 4);
      
      // Hot cue points (simulate some cue points for demo)
      const hotCues = [
        { time: 30, color: '#ff0000', label: '1' },
        { time: 60, color: '#00ff00', label: '2' },
        { time: 120, color: '#0000ff', label: '3' },
        { time: 180, color: '#ffff00', label: '4' }
      ];
      
      hotCues.forEach(cue => {
        if (cue.time >= windowStart && cue.time <= windowEnd) {
          const x = ((cue.time - windowStart) / (windowEnd - windowStart)) * width;
          
          // Cue point marker line
          ctx.strokeStyle = cue.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
          
          // Cue point circle at top
          ctx.fillStyle = cue.color;
          ctx.beginPath();
          ctx.arc(x, 15, 8, 0, Math.PI * 2);
          ctx.fill();
          
          // Cue number label
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 10px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(cue.label, x, 19);
        }
      });
    }

    // Draw fixed center playhead (CDJ-3000 style)
    const playheadX = width / 2;
    
    // Playhead shadow for depth
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(playheadX + 1, 0);
    ctx.lineTo(playheadX + 1, height);
    ctx.stroke();
    
    // Main playhead line - bright white and prominent
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();
    
    // Playhead triangle at top with shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.moveTo(playheadX - 7, 1);
    ctx.lineTo(playheadX + 7, 1);
    ctx.lineTo(playheadX + 1, 13);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(playheadX - 8, 0);
    ctx.lineTo(playheadX + 8, 0);
    ctx.lineTo(playheadX, 14);
    ctx.closePath();
    ctx.fill();
    
    // Playhead triangle at bottom with shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.moveTo(playheadX - 7, height - 1);
    ctx.lineTo(playheadX + 7, height - 1);
    ctx.lineTo(playheadX + 1, height - 13);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(playheadX - 8, height);
    ctx.lineTo(playheadX + 8, height);
    ctx.lineTo(playheadX, height - 14);
    ctx.closePath();
    ctx.fill();



    // Continue animation continuously for live updates
    animationRef.current = requestAnimationFrame(drawWaveform);
  }, [width, height, currentTime, track, isPlaying, analyser]);

  useEffect(() => {
    drawWaveform();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [drawWaveform]);

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!track || !onSeek) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const seekTime = (x / width) * track.duration;
    
    onSeek(seekTime);
  };

  return (
    <div className={`cdj-waveform rounded-lg overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        className="w-full h-full cursor-pointer"
        style={{ width, height }}
      />
    </div>
  );
}
