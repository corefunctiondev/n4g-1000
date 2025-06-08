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
  const currentTimeRef = useRef(currentTime);
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
          // Connect the analyzer to the existing analyser node for live data
          waveformAnalyzerRef.current.connectToSource(analyser);
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
  const drawWaveform = useCallback((forceRedraw = false) => {
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

    // Draw main CDJ-3000 style waveform with separated frequency rows
    if (waveformDataRef.current && track) {
      const { low, mid, high, combined } = waveformDataRef.current;
      const totalDuration = track.duration;
      
      // Calculate visible time window (4 seconds before and after current position)  
      const windowStart = Math.max(0, currentTime - 4);
      const windowEnd = Math.min(totalDuration, currentTime + 4);
      const windowDuration = windowEnd - windowStart;
      
      // Main waveform area with 3 distinct frequency rows
      const mainWaveformHeight = height * 0.65; // 65% for main waveform
      const rowHeight = mainWaveformHeight / 3; // Each frequency band gets its own row
      const mainWaveformY = height * 0.1; // Start 10% from top
      
      // Calculate data indices for this time window
      const pixelsPerSecond = 200; // High resolution analysis
      const startIndex = Math.floor(windowStart * pixelsPerSecond);
      const endIndex = Math.floor(windowEnd * pixelsPerSecond);
      
      // Draw frequency-separated rows
      const visibleSamples = endIndex - startIndex;
      const barWidth = Math.max(1, width / visibleSamples);
      
      for (let i = 0; i < visibleSamples; i++) {
        const dataIndex = startIndex + i;
        if (dataIndex >= high.length) break;
        
        const timePosition = windowStart + (i / visibleSamples) * windowDuration;
        const x = ((timePosition - windowStart) / windowDuration) * width;
        
        // Calculate distance from playhead for brightness effect
        const distanceFromPlayhead = Math.abs(timePosition - currentTime);
        const brightness = distanceFromPlayhead < 1 ? 1 : Math.max(0.4, 1 - distanceFromPlayhead / 4);
        
        // Get real FFT energy values for each frequency band
        const highEnergy = high[dataIndex] || 0;
        const midEnergy = mid[dataIndex] || 0;
        const lowEnergy = low[dataIndex] || 0;
        
        // HIGH frequencies row (top) - Blue like Rekordbox
        if (highEnergy > 0.008) {
          const barHeight = Math.min(highEnergy * rowHeight * 0.9, rowHeight * 0.9);
          const rowCenter = mainWaveformY + rowHeight / 2;
          const y = rowCenter - barHeight / 2;
          const intensity = Math.min(highEnergy * 2, 1);
          
          // Authentic Rekordbox blue gradient
          const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
          gradient.addColorStop(0, `rgba(0, 150, 255, ${brightness * intensity})`);
          gradient.addColorStop(0.5, `rgba(0, 120, 255, ${brightness * intensity * 0.8})`);
          gradient.addColorStop(1, `rgba(0, 80, 200, ${brightness * intensity * 0.6})`);
          
          ctx.fillStyle = gradient;
          ctx.fillRect(x, y, barWidth, barHeight);
          
          // Peak highlights
          if (highEnergy > 0.7) {
            ctx.fillStyle = `rgba(255, 255, 255, ${brightness * 0.7})`;
            ctx.fillRect(x, y, barWidth, 1);
          }
        }
        
        // MID frequencies row (middle) - Orange like Rekordbox
        if (midEnergy > 0.008) {
          const barHeight = Math.min(midEnergy * rowHeight * 0.9, rowHeight * 0.9);
          const rowCenter = mainWaveformY + rowHeight + rowHeight / 2;
          const y = rowCenter - barHeight / 2;
          const intensity = Math.min(midEnergy * 2, 1);
          
          const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
          gradient.addColorStop(0, `rgba(255, 140, 0, ${brightness * intensity})`);
          gradient.addColorStop(0.5, `rgba(255, 120, 0, ${brightness * intensity * 0.8})`);
          gradient.addColorStop(1, `rgba(200, 90, 0, ${brightness * intensity * 0.6})`);
          
          ctx.fillStyle = gradient;
          ctx.fillRect(x, y, barWidth, barHeight);
          
          if (midEnergy > 0.7) {
            ctx.fillStyle = `rgba(255, 255, 255, ${brightness * 0.7})`;
            ctx.fillRect(x, y, barWidth, 1);
          }
        }
        
        // LOW frequencies row (bottom) - Yellow/White like Rekordbox
        if (lowEnergy > 0.008) {
          const barHeight = Math.min(lowEnergy * rowHeight * 0.9, rowHeight * 0.9);
          const rowCenter = mainWaveformY + rowHeight * 2 + rowHeight / 2;
          const y = rowCenter - barHeight / 2;
          const intensity = Math.min(lowEnergy * 2, 1);
          
          const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
          gradient.addColorStop(0, `rgba(255, 255, 100, ${brightness * intensity})`);
          gradient.addColorStop(0.5, `rgba(255, 255, 200, ${brightness * intensity * 0.9})`);
          gradient.addColorStop(1, `rgba(255, 255, 255, ${brightness * intensity * 0.8})`);
          
          ctx.fillStyle = gradient;
          ctx.fillRect(x, y, barWidth, barHeight);
          
          if (lowEnergy > 0.7) {
            ctx.fillStyle = `rgba(255, 255, 255, ${brightness * 0.8})`;
            ctx.fillRect(x, y, barWidth, 1);
          }
        }
      }
      
      // Draw row separators
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 3; i++) {
        const y = mainWaveformY + i * rowHeight;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      
      // Draw frequency band labels
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = '11px Arial, sans-serif';
      ctx.fillText('HIGH', 8, mainWaveformY + 16);
      ctx.fillText('MID', 8, mainWaveformY + rowHeight + 16);
      ctx.fillText('LOW', 8, mainWaveformY + rowHeight * 2 + 16);
    }
    
    // Draw mini waveform overview at bottom
    if (waveformDataRef.current && track) {
      const { combined } = waveformDataRef.current;
      const miniHeight = height * 0.15; // 15% for mini waveform
      const miniY = height * 0.8; // Start at 80% from top
      
      const totalSamples = combined.length;
      const samplesPerPixel = totalSamples / width;
      
      // Draw complete track overview
      for (let x = 0; x < width; x++) {
        const sampleIndex = Math.floor(x * samplesPerPixel);
        if (sampleIndex >= combined.length) break;
        
        const amplitude = combined[sampleIndex] || 0;
        const barHeight = Math.min(amplitude * miniHeight * 0.8, miniHeight * 0.8);
        const y = miniY + (miniHeight - barHeight) / 2;
        
        // Simple white waveform for overview
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(amplitude * 2, 0.8)})`;
        ctx.fillRect(x, y, 1, barHeight);
      }
      
      // Draw playback position indicator on mini waveform
      const progressX = (currentTime / track.duration) * width;
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(progressX, miniY);
      ctx.lineTo(progressX, miniY + miniHeight);
      ctx.stroke();
      
      // Mini waveform border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, miniY, width, miniHeight);
    }

    // Draw real-time frequency analysis overlay using the FFT analyzer
    if (isPlaying && analyser && waveformAnalyzerRef.current) {
      const mainWaveformHeight = height * 0.65;
      const rowHeight = mainWaveformHeight / 3;
      const mainWaveformY = height * 0.1;
      
      // Get live frequency data from the analyzer
      const liveData = waveformAnalyzerRef.current.getLiveFrequencyData();
      const { lowEnergy, midEnergy, highEnergy } = liveData;
      
      // Add live overlay effects in each frequency row at playhead position
      const playheadX = width / 2;
      const overlayWidth = 25;
      
      // HIGH band live overlay - Enhanced blue glow
      if (highEnergy > 0.01) {
        const highIntensity = Math.min(highEnergy * 6, 1);
        const overlayHeight = highIntensity * rowHeight * 0.8;
        const rowCenter = mainWaveformY + rowHeight / 2;
        const y = rowCenter - overlayHeight / 2;
        
        // Pulsing glow effect
        const pulse = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
        
        ctx.fillStyle = `rgba(0, 200, 255, ${highIntensity * 0.8 * pulse})`;
        ctx.fillRect(playheadX - overlayWidth/2, y, overlayWidth, overlayHeight);
        
        if (highEnergy > 0.7) {
          ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * pulse})`;
          ctx.fillRect(playheadX - 1, y, 2, overlayHeight);
        }
      }
      
      // MID band live overlay - Enhanced orange glow
      if (midEnergy > 0.01) {
        const midIntensity = Math.min(midEnergy * 6, 1);
        const overlayHeight = midIntensity * rowHeight * 0.8;
        const rowCenter = mainWaveformY + rowHeight + rowHeight / 2;
        const y = rowCenter - overlayHeight / 2;
        
        const pulse = Math.sin(Date.now() * 0.008) * 0.3 + 0.7;
        
        ctx.fillStyle = `rgba(255, 160, 0, ${midIntensity * 0.8 * pulse})`;
        ctx.fillRect(playheadX - overlayWidth/2, y, overlayWidth, overlayHeight);
        
        if (midEnergy > 0.7) {
          ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * pulse})`;
          ctx.fillRect(playheadX - 1, y, 2, overlayHeight);
        }
      }
      
      // LOW band live overlay - Enhanced yellow/white glow
      if (lowEnergy > 0.01) {
        const bassIntensity = Math.min(lowEnergy * 6, 1);
        const overlayHeight = bassIntensity * rowHeight * 0.8;
        const rowCenter = mainWaveformY + rowHeight * 2 + rowHeight / 2;
        const y = rowCenter - overlayHeight / 2;
        
        const pulse = Math.sin(Date.now() * 0.005) * 0.4 + 0.6;
        
        ctx.fillStyle = `rgba(255, 255, 150, ${bassIntensity * 0.9 * pulse})`;
        ctx.fillRect(playheadX - overlayWidth/2, y, overlayWidth, overlayHeight);
        
        if (lowEnergy > 0.7) {
          ctx.fillStyle = `rgba(255, 255, 255, ${1.0 * pulse})`;
          ctx.fillRect(playheadX - 1, y, 2, overlayHeight);
        }
      }
    }

    // Draw fixed center playhead (Rekordbox style) - through main waveform area
    const playheadX = width / 2;
    const mainWaveformHeight = height * 0.65;
    const mainWaveformY = height * 0.1;
    
    // Main playhead line with shadow for depth
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(playheadX + 1, mainWaveformY);
    ctx.lineTo(playheadX + 1, mainWaveformY + mainWaveformHeight);
    ctx.stroke();
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(playheadX, mainWaveformY);
    ctx.lineTo(playheadX, mainWaveformY + mainWaveformHeight);
    ctx.stroke();
    
    // Rekordbox-style playhead triangle at top
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.moveTo(playheadX - 9, mainWaveformY + 1);
    ctx.lineTo(playheadX + 9, mainWaveformY + 1);
    ctx.lineTo(playheadX + 1, mainWaveformY - 15);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(playheadX - 10, mainWaveformY);
    ctx.lineTo(playheadX + 10, mainWaveformY);
    ctx.lineTo(playheadX, mainWaveformY - 16);
    ctx.closePath();
    ctx.fill();
    
    // Playhead triangle at bottom
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.moveTo(playheadX - 9, mainWaveformY + mainWaveformHeight - 1);
    ctx.lineTo(playheadX + 9, mainWaveformY + mainWaveformHeight - 1);
    ctx.lineTo(playheadX + 1, mainWaveformY + mainWaveformHeight + 15);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(playheadX - 10, mainWaveformY + mainWaveformHeight);
    ctx.lineTo(playheadX + 10, mainWaveformY + mainWaveformHeight);
    ctx.lineTo(playheadX, mainWaveformY + mainWaveformHeight + 16);
    ctx.closePath();
    ctx.fill();

    // Draw cue points and loop markers
    if (track) {
      const windowStart = Math.max(0, currentTime - 4);
      const windowEnd = Math.min(track.duration, currentTime + 4);
      
      // Hot cue points with Rekordbox colors
      const hotCues = [
        { time: 30, color: '#ff4444', label: 'A' },
        { time: 60, color: '#44ff44', label: 'B' },
        { time: 120, color: '#4444ff', label: 'C' },
        { time: 180, color: '#ffff44', label: 'D' }
      ];
      
      hotCues.forEach(cue => {
        if (cue.time >= windowStart && cue.time <= windowEnd) {
          const x = ((cue.time - windowStart) / (windowEnd - windowStart)) * width;
          
          // Cue point marker line through all frequency bands
          ctx.strokeStyle = cue.color;
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.7;
          ctx.beginPath();
          ctx.moveTo(x, mainWaveformY);
          ctx.lineTo(x, mainWaveformY + mainWaveformHeight);
          ctx.stroke();
          ctx.globalAlpha = 1;
          
          // Cue point flag above waveform
          ctx.fillStyle = cue.color;
          ctx.fillRect(x - 1, mainWaveformY - 20, 15, 12);
          
          // Cue label on flag
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 9px Arial';
          ctx.textAlign = 'left';
          ctx.fillText(cue.label, x + 2, mainWaveformY - 11);
        }
      });
    }



    // Continue animation loop when playing
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(() => drawWaveform(false));
    }
  }, [width, height, track, isPlaying, analyser, waveformAnalyzerRef, currentTime]);

  // Initial render and when track changes
  useEffect(() => {
    drawWaveform(false);
  }, [track, width, height]);

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
