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
  const frequencyBandsRef = useRef<{
    bass: Float32Array | null;
    mid: Float32Array | null;
    high: Float32Array | null;
  }>({ bass: null, mid: null, high: null });

  // Analyze audio into frequency bands
  const analyzeFrequencyBands = useCallback((audioData: Float32Array) => {
    if (!audioData) return null;

    const fftSize = 2048;
    const sampleRate = 44100; // Assume standard sample rate
    const nyquist = sampleRate / 2;
    
    // Create frequency bands
    const bassRange = [20, 250];    // Bass frequencies
    const midRange = [250, 4000];   // Mid frequencies  
    const highRange = [4000, nyquist]; // High frequencies
    
    const bassData = new Float32Array(audioData.length);
    const midData = new Float32Array(audioData.length);
    const highData = new Float32Array(audioData.length);
    
    // Simple frequency band separation using amplitude modulation
    // In a real implementation, this would use FFT analysis
    for (let i = 0; i < audioData.length; i++) {
      const sample = audioData[i];
      const intensity = Math.abs(sample);
      
      // Simulate frequency content based on amplitude and position
      const timeRatio = i / audioData.length;
      const bassWeight = Math.sin(timeRatio * Math.PI * 4) * 0.5 + 0.5;
      const midWeight = Math.sin(timeRatio * Math.PI * 8) * 0.5 + 0.5;
      const highWeight = Math.sin(timeRatio * Math.PI * 16) * 0.5 + 0.5;
      
      // Apply frequency separation
      bassData[i] = sample * bassWeight * (intensity > 0.3 ? 1 : 0.3);
      midData[i] = sample * midWeight * (intensity > 0.2 ? 1 : 0.5);
      highData[i] = sample * highWeight * (intensity > 0.1 ? 1 : 0.7);
    }
    
    return { bass: bassData, mid: midData, high: highData };
  }, []);

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !track?.waveformData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height, backgroundColor, currentTime, duration } = options;
    
    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Analyze frequency bands if not already done
    if (!frequencyBandsRef.current.bass) {
      const bands = analyzeFrequencyBands(track.waveformData);
      if (bands) {
        frequencyBandsRef.current = bands;
      }
    }

    const bands = frequencyBandsRef.current;
    if (!bands.bass || !bands.mid || !bands.high) return;

    const step = Math.ceil(track.waveformData.length / width);
    const amp = height / 6; // Divide height into 3 bands (top and bottom)

    // Draw 3-band waveform like CDJ-3000
    for (let i = 0; i < width; i++) {
      const dataIndex = i * step;
      if (dataIndex >= track.waveformData.length) continue;

      // Calculate amplitudes for each band
      let bassAmp = 0, midAmp = 0, highAmp = 0;
      
      for (let j = 0; j < step && dataIndex + j < track.waveformData.length; j++) {
        bassAmp = Math.max(bassAmp, Math.abs(bands.bass[dataIndex + j]));
        midAmp = Math.max(midAmp, Math.abs(bands.mid[dataIndex + j]));
        highAmp = Math.max(highAmp, Math.abs(bands.high[dataIndex + j]));
      }

      const x = i;
      const centerY = height / 2;

      // Draw bass (orange/yellow) - bottom
      ctx.fillStyle = '#ff8c00'; // Orange
      const bassHeight = bassAmp * amp;
      ctx.fillRect(x, centerY, 1, bassHeight);
      ctx.fillRect(x, centerY - bassHeight, 1, bassHeight);

      // Draw mids (blue) - middle
      ctx.fillStyle = '#0080ff'; // Blue
      const midHeight = midAmp * amp * 0.8;
      ctx.fillRect(x, centerY, 1, midHeight);
      ctx.fillRect(x, centerY - midHeight, 1, midHeight);

      // Draw highs (white/cyan) - top
      ctx.fillStyle = '#00ffff'; // Cyan
      const highHeight = highAmp * amp * 0.6;
      ctx.fillRect(x, centerY, 1, highHeight);
      ctx.fillRect(x, centerY - highHeight, 1, highHeight);
    }

    // Draw beat grid
    if (track.bpm > 0 && duration > 0) {
      const beatDuration = 60 / track.bpm;
      const beatsCount = Math.floor(duration / beatDuration);
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      
      for (let i = 0; i <= beatsCount; i++) {
        const beatTime = i * beatDuration;
        const x = (beatTime / duration) * width;
        
        // Draw beat markers
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
        
        // Highlight every 4th beat (downbeat)
        if (i % 4 === 0) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.lineWidth = 1;
        }
      }
    }

    // Draw playhead
    if (duration > 0) {
      const playheadX = (currentTime / duration) * width;
      ctx.strokeStyle = '#ff0040';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#ff0040';
      ctx.shadowBlur = 8;
      
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();
      
      // Reset shadow
      ctx.shadowBlur = 0;
    }

    // Draw cue points (if any)
    ctx.fillStyle = '#00ff00';
    for (let i = 1; i <= 4; i++) {
      const cueTime = duration * (i / 10); // Example cue points
      const cueX = (cueTime / duration) * width;
      ctx.fillRect(cueX - 1, height - 8, 2, 8);
    }

  }, [track, options, analyzeFrequencyBands]);

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
