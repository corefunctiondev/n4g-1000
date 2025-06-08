import { useEffect, useRef, useCallback } from 'react';
import { AudioTrack } from '@/types/audio';
import { WaveformAnalyzer } from '@/lib/waveform-analyzer';

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
  const waveformDataRef = useRef<{
    low: Float32Array;
    mid: Float32Array;
    high: Float32Array;
    combined: Float32Array;
  } | null>(null);
  const waveformAnalyzerRef = useRef<WaveformAnalyzer | null>(null);

  // Generate FFT-based frequency band waveform data when track loads
  useEffect(() => {
    if (track?.audioBuffer && analyser) {
      const initializeAnalyzer = async () => {
        const context = analyser.context as AudioContext;
        if (!waveformAnalyzerRef.current) {
          waveformAnalyzerRef.current = new WaveformAnalyzer(context);
        }
        
        // Analyze audio buffer to generate frequency band data like Rekordbox
        const pixelsPerSecond = 200; // High resolution for detailed waveform
        if (track.audioBuffer) {
          const waveformData = await waveformAnalyzerRef.current.analyzeAudioBuffer(
            track.audioBuffer, 
            pixelsPerSecond
          );
          
          waveformDataRef.current = waveformData;
        }
      };
      
      initializeAnalyzer();
    }
  }, [track, analyser]);

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

    // Draw CDJ-3000 style waveform with real FFT frequency bands
    if (waveformDataRef.current && track) {
      const { low, mid, high } = waveformDataRef.current;
      const totalDuration = track.duration;
      
      // Calculate visible time window (4 seconds before and after current position)
      const windowStart = Math.max(0, currentTime - 4);
      const windowEnd = Math.min(totalDuration, currentTime + 4);
      const windowDuration = windowEnd - windowStart;
      
      // Single waveform strip with stacked frequency bands
      const stripHeight = height * 0.4; // Main waveform strip takes 40% of height
      const stripY = height * 0.3; // Center the strip vertically
      const bandHeight = stripHeight / 3; // Each frequency band is 1/3 of strip
      
      // Calculate data indices for this time window based on high-resolution analysis
      const pixelsPerSecond = 200; // Match the analysis resolution
      const samplesPerSecond = pixelsPerSecond;
      const startIndex = Math.floor(windowStart * samplesPerSecond);
      const endIndex = Math.floor(windowEnd * samplesPerSecond);
      
      // Draw frequency-separated waveform strip
      const visibleSamples = endIndex - startIndex;
      const barWidth = Math.max(1, width / visibleSamples);
      
      for (let i = 0; i < visibleSamples; i++) {
        const dataIndex = startIndex + i;
        if (dataIndex >= high.length) break;
        
        const timePosition = windowStart + (i / visibleSamples) * windowDuration;
        const x = ((timePosition - windowStart) / windowDuration) * width;
        
        // Calculate distance from playhead for brightness effect
        const distanceFromPlayhead = Math.abs(timePosition - currentTime);
        const brightness = distanceFromPlayhead < 1 ? 1 : Math.max(0.3, 1 - distanceFromPlayhead / 4);
        
        // Get real FFT energy values for each frequency band
        const highEnergy = high[dataIndex] || 0;
        const midEnergy = mid[dataIndex] || 0;
        const lowEnergy = low[dataIndex] || 0;
        
        // HIGH frequencies (top of strip) - Cyan/Blue like authentic CDJ
        if (highEnergy > 0.01) {
          const barHeight = Math.min(highEnergy * bandHeight * 1.2, bandHeight);
          const y = stripY;
          const intensity = Math.min(highEnergy * 1.5, 1);
          
          ctx.fillStyle = `rgba(0, 255, 255, ${brightness * intensity})`;
          ctx.fillRect(x, y, barWidth, barHeight);
          
          // Peak highlights for strong highs
          if (highEnergy > 0.7) {
            ctx.fillStyle = `rgba(255, 255, 255, ${brightness * 0.6})`;
            ctx.fillRect(x, y, barWidth, 2);
          }
        }
        
        // MID frequencies (middle of strip) - Orange like authentic CDJ
        if (midEnergy > 0.01) {
          const barHeight = Math.min(midEnergy * bandHeight * 1.2, bandHeight);
          const y = stripY + bandHeight;
          const intensity = Math.min(midEnergy * 1.5, 1);
          
          ctx.fillStyle = `rgba(255, 140, 0, ${brightness * intensity})`;
          ctx.fillRect(x, y, barWidth, barHeight);
          
          if (midEnergy > 0.7) {
            ctx.fillStyle = `rgba(255, 255, 255, ${brightness * 0.6})`;
            ctx.fillRect(x, y, barWidth, 2);
          }
        }
        
        // LOW frequencies (bottom of strip) - Green like authentic CDJ
        if (lowEnergy > 0.01) {
          const barHeight = Math.min(lowEnergy * bandHeight * 1.2, bandHeight);
          const y = stripY + bandHeight * 2;
          const intensity = Math.min(lowEnergy * 1.5, 1);
          
          ctx.fillStyle = `rgba(0, 255, 100, ${brightness * intensity})`;
          ctx.fillRect(x, y, barWidth, barHeight);
          
          if (lowEnergy > 0.7) {
            ctx.fillStyle = `rgba(255, 255, 255, ${brightness * 0.6})`;
            ctx.fillRect(x, y, barWidth, 2);
          }
        }
      }
      
      // Draw waveform strip border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, stripY, width, stripHeight);
      
      // Draw frequency band labels on the left
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = '10px Arial, sans-serif';
      ctx.fillText('HIGH', 4, stripY + 12);
      ctx.fillText('MID', 4, stripY + bandHeight + 12);
      ctx.fillText('LOW', 4, stripY + bandHeight * 2 + 12);
    }

    // Draw real-time frequency analysis overlay for the waveform strip
    if (isPlaying && analyser) {
      const freqData = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(freqData);
      
      const stripHeight = height * 0.4;
      const stripY = height * 0.3;
      const bandHeight = stripHeight / 3;
      
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
      
      // Add live overlay effects within the waveform strip at playhead position
      const playheadX = width / 2;
      const overlayWidth = 30;
      
      // HIGH band live overlay - Cyan
      if (highRMS > 0.01) {
        const highIntensity = Math.min(highRMS * 5, 1);
        const overlayHeight = highIntensity * bandHeight;
        
        ctx.fillStyle = `rgba(0, 255, 255, ${highIntensity * 0.8})`;
        ctx.fillRect(playheadX - overlayWidth/2, stripY, overlayWidth, overlayHeight);
        
        if (highRMS > 0.7) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.fillRect(playheadX - 2, stripY, 4, overlayHeight);
        }
      }
      
      // MID band live overlay - Orange
      if (midRMS > 0.01) {
        const midIntensity = Math.min(midRMS * 5, 1);
        const overlayHeight = midIntensity * bandHeight;
        
        ctx.fillStyle = `rgba(255, 140, 0, ${midIntensity * 0.8})`;
        ctx.fillRect(playheadX - overlayWidth/2, stripY + bandHeight, overlayWidth, overlayHeight);
        
        if (midRMS > 0.7) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.fillRect(playheadX - 2, stripY + bandHeight, 4, overlayHeight);
        }
      }
      
      // LOW band live overlay - Green
      if (bassRMS > 0.01) {
        const bassIntensity = Math.min(bassRMS * 5, 1);
        const overlayHeight = bassIntensity * bandHeight;
        
        ctx.fillStyle = `rgba(0, 255, 100, ${bassIntensity * 0.8})`;
        ctx.fillRect(playheadX - overlayWidth/2, stripY + bandHeight * 2, overlayWidth, overlayHeight);
        
        if (bassRMS > 0.7) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.fillRect(playheadX - 2, stripY + bandHeight * 2, 4, overlayHeight);
        }
      }
    }

    // Draw fixed center playhead (CDJ-3000 style) - only through waveform strip
    const playheadX = width / 2;
    const stripHeight = height * 0.4;
    const stripY = height * 0.3;
    
    // Main playhead line through waveform strip only
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(playheadX, stripY);
    ctx.lineTo(playheadX, stripY + stripHeight);
    ctx.stroke();
    
    // Playhead triangle at top of strip
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(playheadX - 8, stripY);
    ctx.lineTo(playheadX + 8, stripY);
    ctx.lineTo(playheadX, stripY - 12);
    ctx.closePath();
    ctx.fill();
    
    // Playhead triangle at bottom of strip
    ctx.beginPath();
    ctx.moveTo(playheadX - 8, stripY + stripHeight);
    ctx.lineTo(playheadX + 8, stripY + stripHeight);
    ctx.lineTo(playheadX, stripY + stripHeight + 12);
    ctx.closePath();
    ctx.fill();

    // Draw cue points and markers on the waveform strip
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
          
          // Cue point marker line through waveform strip
          ctx.strokeStyle = cue.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x, stripY);
          ctx.lineTo(x, stripY + stripHeight);
          ctx.stroke();
          
          // Cue point circle above strip
          ctx.fillStyle = cue.color;
          ctx.beginPath();
          ctx.arc(x, stripY - 15, 6, 0, Math.PI * 2);
          ctx.fill();
          
          // Cue number label
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 8px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(cue.label, x, stripY - 11);
        }
      });
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
