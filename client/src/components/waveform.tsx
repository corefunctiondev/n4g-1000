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

    // Clear canvas with CDJ-style background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);
    
    // Add subtle grid lines for professional look
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < width; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }

    // Draw 3-lane CDJ-3000 style frequency band waveform
    if (waveformDataRef.current && track) {
      const waveformData = waveformDataRef.current;
      const totalDuration = track.duration;
      
      // Calculate visible time window (4 seconds before and after current position)
      const windowStart = Math.max(0, currentTime - 4);
      const windowEnd = Math.min(totalDuration, currentTime + 4);
      const windowDuration = windowEnd - windowStart;
      
      // Define the 3 horizontal lanes like CDJ-3000
      const laneHeight = height / 3;
      const highLane = { y: 0, height: laneHeight, color: '#00ffff', label: 'HIGH' };
      const midLane = { y: laneHeight, height: laneHeight, color: '#ffaa00', label: 'MID' };
      const lowLane = { y: laneHeight * 2, height: laneHeight, color: '#00ff80', label: 'LOW' };
      
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
        
        // HIGH lane (top) - more responsive to higher frequencies
        const highAmp = scaledAmp * (0.6 + Math.sin(i * 0.1) * 0.2);
        if (highAmp > 0.05) {
          const barHeight = Math.min(highAmp * laneHeight * 0.9, laneHeight * 0.9);
          const laneCenter = highLane.y + laneHeight / 2;
          
          ctx.fillStyle = `rgba(0, 255, 255, ${brightness * Math.min(highAmp * 1.5, 1)})`;
          ctx.fillRect(x, laneCenter - barHeight/2, barWidth, barHeight);
        }
        
        // MID lane (middle) - balanced response
        const midAmp = scaledAmp * (0.8 + Math.cos(i * 0.15) * 0.15);
        if (midAmp > 0.05) {
          const barHeight = Math.min(midAmp * laneHeight * 0.9, laneHeight * 0.9);
          const laneCenter = midLane.y + laneHeight / 2;
          
          ctx.fillStyle = `rgba(255, 170, 0, ${brightness * Math.min(midAmp * 1.5, 1)})`;
          ctx.fillRect(x, laneCenter - barHeight/2, barWidth, barHeight);
        }
        
        // LOW lane (bottom) - more responsive to bass
        const lowAmp = scaledAmp * (0.9 + Math.sin(i * 0.05) * 0.1);
        if (lowAmp > 0.05) {
          const barHeight = Math.min(lowAmp * laneHeight * 0.9, laneHeight * 0.9);
          const laneCenter = lowLane.y + laneHeight / 2;
          
          ctx.fillStyle = `rgba(0, 255, 128, ${brightness * Math.min(lowAmp * 1.5, 1)})`;
          ctx.fillRect(x, laneCenter - barHeight/2, barWidth, barHeight);
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
      
      // HIGH lane live overlay
      if (highRMS > 0.01) {
        const highIntensity = Math.min(highRMS * 3, 1);
        const overlayHeight = highIntensity * laneHeight * 0.8;
        const laneCenter = laneHeight / 2;
        
        ctx.fillStyle = `rgba(0, 255, 255, ${highIntensity * 0.7})`;
        ctx.fillRect(playheadX - overlayWidth/2, laneCenter - overlayHeight/2, overlayWidth, overlayHeight);
        
        // Peak flash effect
        if (highRMS > 0.5) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.fillRect(playheadX - 2, 0, 4, laneHeight);
        }
      }
      
      // MID lane live overlay
      if (midRMS > 0.01) {
        const midIntensity = Math.min(midRMS * 3, 1);
        const overlayHeight = midIntensity * laneHeight * 0.8;
        const laneCenter = laneHeight + laneHeight / 2;
        
        ctx.fillStyle = `rgba(255, 170, 0, ${midIntensity * 0.7})`;
        ctx.fillRect(playheadX - overlayWidth/2, laneCenter - overlayHeight/2, overlayWidth, overlayHeight);
        
        if (midRMS > 0.5) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.fillRect(playheadX - 2, laneHeight, 4, laneHeight);
        }
      }
      
      // LOW lane live overlay
      if (bassRMS > 0.01) {
        const bassIntensity = Math.min(bassRMS * 3, 1);
        const overlayHeight = bassIntensity * laneHeight * 0.8;
        const laneCenter = laneHeight * 2 + laneHeight / 2;
        
        ctx.fillStyle = `rgba(0, 255, 128, ${bassIntensity * 0.7})`;
        ctx.fillRect(playheadX - overlayWidth/2, laneCenter - overlayHeight/2, overlayWidth, overlayHeight);
        
        if (bassRMS > 0.5) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.fillRect(playheadX - 2, laneHeight * 2, 4, laneHeight);
        }
      }
    }

    // Draw fixed center playhead (CDJ-3000 style)
    const playheadX = width / 2;
    
    // Playhead line - bright white and prominent
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();
    
    // Playhead triangle at top
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(playheadX - 6, 0);
    ctx.lineTo(playheadX + 6, 0);
    ctx.lineTo(playheadX, 12);
    ctx.closePath();
    ctx.fill();
    
    // Playhead triangle at bottom
    ctx.beginPath();
    ctx.moveTo(playheadX - 6, height);
    ctx.lineTo(playheadX + 6, height);
    ctx.lineTo(playheadX, height - 12);
    ctx.closePath();
    ctx.fill();

    // Scrolling beat grid overlay
    if (track && track.bpm > 0) {
      const beatInterval = 60 / track.bpm; // seconds per beat
      const windowStart = Math.max(0, currentTime - 4);
      const windowEnd = Math.min(track.duration, currentTime + 4);
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      
      // Draw beat lines within the visible window
      const firstBeat = Math.floor(windowStart / beatInterval);
      const lastBeat = Math.ceil(windowEnd / beatInterval);
      
      for (let beat = firstBeat; beat <= lastBeat; beat++) {
        const beatTime = beat * beatInterval;
        if (beatTime >= windowStart && beatTime <= windowEnd) {
          const x = ((beatTime - windowStart) / (windowEnd - windowStart)) * width;
          
          // Highlight beats closer to playhead
          const distanceFromPlayhead = Math.abs(beatTime - currentTime);
          if (distanceFromPlayhead < 0.1) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 2;
          } else {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 1;
          }
          
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
      }
    }

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
