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

    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // Draw CDJ-3000 style horizontal waveform
    if (waveformDataRef.current) {
      const waveformData = waveformDataRef.current;
      const barWidth = Math.max(1, width / waveformData.length);
      const centerY = height / 2;
      
      // Create the characteristic CDJ-3000 waveform appearance
      for (let i = 0; i < waveformData.length; i++) {
        const amplitude = waveformData[i];
        const x = i * barWidth;
        
        // Scale amplitude for better visibility
        const scaledAmplitude = Math.min(amplitude * 3, 1);
        const waveHeight = (scaledAmplitude * height) / 2;
        
        // Draw waveform bars extending from center
        const topY = centerY - waveHeight;
        const bottomY = centerY + waveHeight;
        
        // Create gradient effect for depth
        const gradient = ctx.createLinearGradient(0, topY, 0, bottomY);
        gradient.addColorStop(0, '#00d4ff'); // Bright cyan at peaks
        gradient.addColorStop(0.3, '#0099cc'); // Mid blue
        gradient.addColorStop(0.7, '#006699'); // Darker blue
        gradient.addColorStop(1, '#003366'); // Deep blue at center
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, topY, Math.max(1, barWidth - 0.5), bottomY - topY);
        
        // Add highlight for extra definition
        if (scaledAmplitude > 0.1) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.fillRect(x, topY, Math.max(1, barWidth - 0.5), 2);
        }
      }
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
