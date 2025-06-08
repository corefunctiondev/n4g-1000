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

  // Real-time frequency visualization
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Clear canvas with dark background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);
    
    // Draw center line for debugging
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Draw static waveform if available
    if (waveformDataRef.current) {
      const waveformData = waveformDataRef.current;
      const barWidth = width / waveformData.length;
      
      // Draw three frequency bands (high, mid, low) like CDJ-3000
      for (let i = 0; i < waveformData.length; i++) {
        const amplitude = waveformData[i];
        const x = i * barWidth;
        
        // Symmetric waveform display from center outward
        const maxWaveHeight = height * 0.49; // Use 98% of height (49% each side)
        const minHeight = 3; // Minimum bar height for visibility
        const waveHeight = Math.max(amplitude * maxWaveHeight, minHeight);
        const centerY = height / 2;
        
        // Create gradient effect for better visual
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, color || '#00ffff');
        gradient.addColorStop(0.5, color || '#00ffff');
        gradient.addColorStop(1, color || '#00ffff');
        
        // Top half (extending upward from center)
        ctx.fillStyle = gradient;
        ctx.fillRect(x, centerY - waveHeight, barWidth - 0.5, waveHeight);
        
        // Bottom half (extending downward from center)
        ctx.fillStyle = gradient;
        ctx.fillRect(x, centerY + 0.5, barWidth - 0.5, waveHeight);
      }
    }

    // Draw live frequency analysis if playing
    if (isPlaying && analyser) {
      const freqData = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(freqData);
      
      // Overlay live frequency bars
      const barWidth = width / freqData.length * 4; // Scale down for better visual
      
      for (let i = 0; i < freqData.length / 4; i++) {
        const amplitude = freqData[i] / 255;
        const x = i * barWidth;
        
        // Live frequency overlay with transparency
        ctx.fillStyle = `rgba(255, 255, 255, ${amplitude * 0.3})`;
        ctx.fillRect(x, 0, barWidth - 1, height * amplitude);
      }
    }

    // Draw playhead position
    if (track && track.duration > 0) {
      const playheadX = (currentTime / track.duration) * width;
      
      // Playhead line
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();
      
      // Playhead triangle
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(playheadX - 5, 0);
      ctx.lineTo(playheadX + 5, 0);
      ctx.lineTo(playheadX, 10);
      ctx.closePath();
      ctx.fill();
    }

    // Beat grid overlay
    if (track && track.bpm > 0) {
      const beatInterval = 60 / track.bpm; // seconds per beat
      const pixelsPerSecond = width / (track.duration || 1);
      const beatWidth = beatInterval * pixelsPerSecond;
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      
      for (let beat = 0; beat * beatWidth < width; beat++) {
        const x = beat * beatWidth;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
    }

    // Continue animation if playing
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(drawWaveform);
    }
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
