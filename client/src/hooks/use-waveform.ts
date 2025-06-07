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

    // Clear canvas with black background
    ctx.fillStyle = '#000000';
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

    // Calculate zoom window around current position (like CDJ zoomed view)
    const zoomSeconds = 30; // Show 30 seconds of waveform
    const startTime = Math.max(0, currentTime - zoomSeconds / 2);
    const endTime = Math.min(duration, currentTime + zoomSeconds / 2);
    
    const startSample = Math.floor((startTime / duration) * track.waveformData.length);
    const endSample = Math.floor((endTime / duration) * track.waveformData.length);
    const samplesPerPixel = Math.max(1, Math.floor((endSample - startSample) / width));

    const centerY = height / 2;
    const amp = height / 4; // Amplitude scaling

    // Draw 3-band waveform like CDJ-3000
    for (let x = 0; x < width; x++) {
      const sampleStart = startSample + Math.floor(x * samplesPerPixel);
      const sampleEnd = Math.min(sampleStart + samplesPerPixel, track.waveformData.length);
      
      if (sampleStart >= track.waveformData.length) continue;

      // Calculate max amplitudes for each band in this pixel
      let bassMax = 0, midMax = 0, highMax = 0;
      
      for (let i = sampleStart; i < sampleEnd; i++) {
        if (i < bands.bass.length) {
          bassMax = Math.max(bassMax, Math.abs(bands.bass[i]));
          midMax = Math.max(midMax, Math.abs(bands.mid[i]));
          highMax = Math.max(highMax, Math.abs(bands.high[i]));
        }
      }

      // Draw bass (orange) - bottom layer
      if (bassMax > 0) {
        ctx.fillStyle = '#ff8c00';
        const bassHeight = bassMax * amp * 1.2;
        ctx.fillRect(x, centerY, 1, bassHeight);
        ctx.fillRect(x, centerY - bassHeight, 1, bassHeight);
      }

      // Draw mids (blue) - middle layer
      if (midMax > 0) {
        ctx.fillStyle = '#4080ff';
        const midHeight = midMax * amp;
        ctx.fillRect(x, centerY, 1, midHeight);
        ctx.fillRect(x, centerY - midHeight, 1, midHeight);
      }

      // Draw highs (cyan) - top layer
      if (highMax > 0) {
        ctx.fillStyle = '#00ffff';
        const highHeight = highMax * amp * 0.8;
        ctx.fillRect(x, centerY, 1, highHeight);
        ctx.fillRect(x, centerY - highHeight, 1, highHeight);
      }
    }

    // Draw beat grid in zoomed view
    if (track.bpm > 0 && duration > 0) {
      const beatDuration = 60 / track.bpm;
      const firstBeat = Math.floor(startTime / beatDuration) * beatDuration;
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      
      for (let beatTime = firstBeat; beatTime <= endTime; beatTime += beatDuration) {
        if (beatTime >= startTime && beatTime <= endTime) {
          const x = ((beatTime - startTime) / (endTime - startTime)) * width;
          
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
          
          // Highlight every 4th beat (downbeat)
          const beatNumber = Math.round(beatTime / beatDuration);
          if (beatNumber % 4 === 0) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
          }
        }
      }
    }

    // Draw playhead in center (CDJ style)
    const playheadX = width / 2;
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

    // Draw cue points relative to zoomed view
    ctx.fillStyle = '#00ff00';
    for (let i = 1; i <= 4; i++) {
      const cueTime = duration * (i / 10);
      if (cueTime >= startTime && cueTime <= endTime) {
        const cueX = ((cueTime - startTime) / (endTime - startTime)) * width;
        ctx.fillRect(cueX - 1, height - 6, 2, 6);
      }
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
