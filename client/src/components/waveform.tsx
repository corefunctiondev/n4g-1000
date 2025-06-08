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

  // Real-time scrolling waveform visualization
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

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

    // Draw live frequency analysis overlay if playing
    if (isPlaying && analyser) {
      const freqData = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(freqData);
      
      const centerY = height / 2;
      const samplesPerBar = Math.floor(freqData.length / width);
      
      // Overlay live frequency data with CDJ-3000 style
      for (let i = 0; i < width; i++) {
        const startIdx = i * samplesPerBar;
        let avgAmplitude = 0;
        
        // Average frequency data for this bar
        for (let j = 0; j < samplesPerBar && startIdx + j < freqData.length; j++) {
          avgAmplitude += freqData[startIdx + j];
        }
        avgAmplitude = (avgAmplitude / samplesPerBar) / 255;
        
        if (avgAmplitude > 0.02) { // Only show significant activity
          const liveHeight = (avgAmplitude * height) / 2;
          const topY = centerY - liveHeight;
          const bottomY = centerY + liveHeight;
          
          // Live overlay with bright highlight
          ctx.fillStyle = `rgba(0, 255, 255, ${avgAmplitude * 0.6})`;
          ctx.fillRect(i, topY, 1, bottomY - topY);
          
          // Add bright peaks for strong signals
          if (avgAmplitude > 0.7) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(i, topY, 1, 2);
            ctx.fillRect(i, bottomY - 2, 1, 2);
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
