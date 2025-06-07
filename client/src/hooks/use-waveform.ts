import { useEffect, useRef, useCallback } from 'react';
import { AudioTrack } from '@/types/audio';

interface WaveformOptions {
  width: number;
  height: number;
  color: string;
  backgroundColor: string;
  currentTime: number;
  duration: number;
}

export function useWaveform(
  track: AudioTrack | null,
  options: WaveformOptions
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !track?.waveformData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height, color, backgroundColor, currentTime, duration } = options;
    
    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Draw waveform
    const data = track.waveformData;
    const step = Math.ceil(data.length / width);
    const amp = height / 2;

    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.8;

    ctx.beginPath();
    for (let i = 0; i < width; i++) {
      const dataIndex = i * step;
      if (dataIndex < data.length) {
        let min = 1.0;
        let max = -1.0;
        
        // Find min/max in this segment
        for (let j = 0; j < step && dataIndex + j < data.length; j++) {
          const value = data[dataIndex + j];
          if (value < min) min = value;
          if (value > max) max = value;
        }
        
        const y1 = (1 + min) * amp;
        const y2 = (1 + max) * amp;
        
        ctx.moveTo(i, y1);
        ctx.lineTo(i, y2);
      }
    }
    ctx.stroke();

    // Draw playhead
    if (duration > 0) {
      const playheadX = (currentTime / duration) * width;
      ctx.strokeStyle = '#ff0040';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 1;
      
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();
    }

    // Draw beat grid
    if (track.bpm > 0 && duration > 0) {
      const beatDuration = 60 / track.bpm;
      const beatsCount = Math.floor(duration / beatDuration);
      
      ctx.strokeStyle = '#3a3a3a';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.5;
      
      for (let i = 0; i <= beatsCount; i++) {
        const beatTime = i * beatDuration;
        const x = (beatTime / duration) * width;
        
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
    }
  }, [track, options]);

  useEffect(() => {
    drawWaveform();
  }, [drawWaveform]);

  const handleCanvasClick = useCallback((event: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || !track) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const clickRatio = x / canvas.width;
    const seekTime = clickRatio * track.duration;
    
    return seekTime;
  }, [track]);

  return {
    canvasRef,
    handleCanvasClick,
  };
}
