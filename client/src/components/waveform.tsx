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

    // Draw scrolling CDJ-3000 style waveform
    if (waveformDataRef.current && track) {
      const waveformData = waveformDataRef.current;
      const centerY = height / 2;
      const totalDuration = track.duration;
      const pixelsPerSecond = width / 8; // Show 8 seconds worth of waveform
      
      // Calculate visible time window (4 seconds before and after current position)
      const windowStart = Math.max(0, currentTime - 4);
      const windowEnd = Math.min(totalDuration, currentTime + 4);
      const windowDuration = windowEnd - windowStart;
      
      // Calculate data indices for this time window
      const samplesPerSecond = waveformData.length / totalDuration;
      const startIndex = Math.floor(windowStart * samplesPerSecond);
      const endIndex = Math.floor(windowEnd * samplesPerSecond);
      
      // Draw waveform for visible window
      const visibleSamples = endIndex - startIndex;
      const barWidth = Math.max(0.5, width / visibleSamples);
      
      for (let i = 0; i < visibleSamples && startIndex + i < waveformData.length; i++) {
        const amplitude = waveformData[startIndex + i];
        const timePosition = windowStart + (i / visibleSamples) * windowDuration;
        const x = ((timePosition - windowStart) / windowDuration) * width;
        
        // Scale amplitude for better visibility
        const scaledAmplitude = Math.min(amplitude * 4, 1);
        const waveHeight = (scaledAmplitude * height) / 2.5;
        
        // Color based on proximity to playhead
        const distanceFromPlayhead = Math.abs(timePosition - currentTime);
        let opacity = 1;
        let color = '#006699';
        
        if (distanceFromPlayhead < 0.5) {
          // Bright area around playhead
          color = '#00d4ff';
          opacity = 1;
        } else if (distanceFromPlayhead < 2) {
          // Medium brightness
          color = '#0099cc';
          opacity = 0.8;
        } else {
          // Dimmer for distant areas
          color = '#006699';
          opacity = 0.6;
        }
        
        // Draw waveform bars extending from center
        const topY = centerY - waveHeight;
        const bottomY = centerY + waveHeight;
        
        ctx.fillStyle = color;
        ctx.globalAlpha = opacity;
        ctx.fillRect(x, topY, Math.max(1, barWidth), bottomY - topY);
        
        // Add highlight for peaks
        if (scaledAmplitude > 0.3 && distanceFromPlayhead < 1) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.fillRect(x, topY, Math.max(1, barWidth), 2);
        }
      }
      
      ctx.globalAlpha = 1; // Reset alpha
    }

    // Draw real-time frequency bands with RMS amplitude calculation
    if (isPlaying && analyser) {
      const freqData = new Uint8Array(analyser.frequencyBinCount);
      const timeData = new Uint8Array(analyser.fftSize);
      
      analyser.getByteFrequencyData(freqData);
      analyser.getByteTimeDomainData(timeData);
      
      const centerY = height / 2;
      
      // Calculate RMS amplitude for overall energy
      let rmsSum = 0;
      for (let i = 0; i < timeData.length; i++) {
        const sample = (timeData[i] - 128) / 128;
        rmsSum += sample * sample;
      }
      const rmsAmplitude = Math.sqrt(rmsSum / timeData.length);
      
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
      
      // Calculate peak and RMS for each frequency band
      let bassRMS = 0, midRMS = 0, highRMS = 0;
      let bassPeak = 0, midPeak = 0, highPeak = 0;
      
      // Bass analysis
      for (let i = bassStart; i < bassEnd; i++) {
        const value = freqData[i] / 255;
        bassRMS += value * value;
        bassPeak = Math.max(bassPeak, value);
      }
      bassRMS = Math.sqrt(bassRMS / (bassEnd - bassStart));
      
      // Mid analysis
      for (let i = midStart; i < midEnd; i++) {
        const value = freqData[i] / 255;
        midRMS += value * value;
        midPeak = Math.max(midPeak, value);
      }
      midRMS = Math.sqrt(midRMS / (midEnd - midStart));
      
      // High analysis
      for (let i = highStart; i < highEnd; i++) {
        const value = freqData[i] / 255;
        highRMS += value * value;
        highPeak = Math.max(highPeak, value);
      }
      highRMS = Math.sqrt(highRMS / (highEnd - highStart));
      
      // Draw frequency bands with enhanced visual separation
      const bandSpacing = 4;
      const barWidth = 1;
      
      for (let x = 0; x < width; x += barWidth) {
        // Bass (LOW) - Orange/Red
        if (bassRMS > 0.005) {
          const bassHeight = Math.min(bassRMS * height * 3, height / 3);
          const bassIntensity = Math.min(bassPeak * 2, 1);
          
          ctx.fillStyle = `rgba(255, ${Math.floor(100 + bassIntensity * 100)}, 0, ${bassIntensity})`;
          ctx.fillRect(x, centerY + bandSpacing, barWidth, bassHeight);
          ctx.fillRect(x, centerY - bandSpacing - bassHeight, barWidth, bassHeight);
          
          // Peak indicators
          if (bassPeak > 0.8) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fillRect(x, centerY + bandSpacing, barWidth, 2);
            ctx.fillRect(x, centerY - bandSpacing - 2, barWidth, 2);
          }
        }
        
        // Mids (MID) - Blue
        if (midRMS > 0.005) {
          const midHeight = Math.min(midRMS * height * 2.5, height / 3);
          const midIntensity = Math.min(midPeak * 2, 1);
          
          ctx.fillStyle = `rgba(0, ${Math.floor(150 + midIntensity * 100)}, 255, ${midIntensity})`;
          ctx.fillRect(x, centerY + bandSpacing * 2, barWidth, midHeight);
          ctx.fillRect(x, centerY - bandSpacing * 2 - midHeight, barWidth, midHeight);
          
          if (midPeak > 0.8) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(x, centerY + bandSpacing * 2, barWidth, 2);
            ctx.fillRect(x, centerY - bandSpacing * 2 - 2, barWidth, 2);
          }
        }
        
        // Highs (HIGH) - Cyan/Bright Blue
        if (highRMS > 0.005) {
          const highHeight = Math.min(highRMS * height * 2, height / 3);
          const highIntensity = Math.min(highPeak * 2, 1);
          
          ctx.fillStyle = `rgba(0, 255, ${Math.floor(200 + highIntensity * 55)}, ${highIntensity})`;
          ctx.fillRect(x, centerY + bandSpacing * 3, barWidth, highHeight);
          ctx.fillRect(x, centerY - bandSpacing * 3 - highHeight, barWidth, highHeight);
          
          if (highPeak > 0.8) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.fillRect(x, centerY + bandSpacing * 3, barWidth, 2);
            ctx.fillRect(x, centerY - bandSpacing * 3 - 2, barWidth, 2);
          }
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
