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

    // Draw 3-band waveform exactly like CDJ-3000
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

      // Draw bass (orange like CDJ-3000) - full amplitude
      if (bassMax > 0.01) {
        ctx.fillStyle = '#ff9500'; // CDJ orange
        const bassHeight = bassMax * amp * 1.1;
        ctx.fillRect(x, centerY, 1, bassHeight);
        ctx.fillRect(x, centerY - bassHeight, 1, bassHeight);
      }

      // Draw mids (blue like CDJ-3000) - overlaid on bass
      if (midMax > 0.01) {
        ctx.fillStyle = '#0099ff'; // CDJ blue
        const midHeight = midMax * amp * 0.9;
        ctx.fillRect(x, centerY, 1, midHeight);
        ctx.fillRect(x, centerY - midHeight, 1, midHeight);
      }

      // Draw highs (white/light blue) - top layer
      if (highMax > 0.01) {
        ctx.fillStyle = '#ffffff'; // White like CDJ highs
        const highHeight = highMax * amp * 0.7;
        ctx.fillRect(x, centerY, 1, highHeight);
        ctx.fillRect(x, centerY - highHeight, 1, highHeight);
      }
    }

    // Draw beat grid exactly like CDJ-3000
    if (track.bpm > 0 && duration > 0) {
      const beatDuration = 60 / track.bpm;
      const firstBeat = Math.floor(startTime / beatDuration) * beatDuration;
      
      for (let beatTime = firstBeat; beatTime <= endTime; beatTime += beatDuration) {
        if (beatTime >= startTime && beatTime <= endTime) {
          const x = ((beatTime - startTime) / (endTime - startTime)) * width;
          const beatNumber = Math.round(beatTime / beatDuration);
          
          // Draw different beat markers like CDJ-3000
          if (beatNumber % 16 === 0) {
            // 16-beat marker (phrase) - thick white line
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.8;
          } else if (beatNumber % 4 === 0) {
            // 4-beat marker (measure) - medium red line
            ctx.strokeStyle = '#ff4444';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.6;
          } else {
            // Regular beat - thin white line
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.3;
          }
          
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
      }
      
      // Reset alpha
      ctx.globalAlpha = 1.0;
    }

    // Draw CDJ-3000 style playhead with triangle needle
    const playheadX = width / 2;
    
    // Main playhead line
    ctx.strokeStyle = '#ff3366';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ff3366';
    ctx.shadowBlur = 6;
    
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();
    
    // Draw triangle needle at top (like CDJ-3000)
    ctx.fillStyle = '#ff3366';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX - 8, 16);
    ctx.lineTo(playheadX + 8, 16);
    ctx.closePath();
    ctx.fill();
    
    // Reset shadow
    ctx.shadowBlur = 0;

    // Draw hot cue points with colored markers (like CDJ-3000)
    const cueColors = ['#ff0000', '#00ff00', '#0066ff', '#ffff00', '#ff8800', '#ff00ff', '#00ffff', '#ffffff'];
    for (let i = 1; i <= 8; i++) {
      const cueTime = duration * (i / 20); // Spread cues across track
      if (cueTime >= startTime && cueTime <= endTime) {
        const cueX = ((cueTime - startTime) / (endTime - startTime)) * width;
        
        // Draw cue marker
        ctx.fillStyle = cueColors[i - 1] || '#ffffff';
        ctx.fillRect(cueX - 2, height - 8, 4, 8);
        
        // Add cue number
        ctx.fillStyle = '#000000';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(i.toString(), cueX, height - 1);
      }
    }
    
    // Add time markers like CDJ-3000
    ctx.fillStyle = '#888888';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    
    // Show time markers every 30 seconds in zoomed view
    const timeInterval = 30; // seconds
    const firstTimeMarker = Math.floor(startTime / timeInterval) * timeInterval;
    
    for (let time = firstTimeMarker; time <= endTime; time += timeInterval) {
      if (time >= startTime && time <= endTime && time > 0) {
        const x = ((time - startTime) / (endTime - startTime)) * width;
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Draw time marker
        ctx.fillStyle = '#666666';
        ctx.fillRect(x - 1, height - 20, 2, 12);
        
        // Draw time text
        ctx.fillStyle = '#cccccc';
        ctx.fillText(timeText, x, height - 22);
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
