import React, { useEffect, useRef, useState, useCallback } from 'react';

interface BeatVisualizerProps {
  isPlaying: boolean;
  bpm?: number;
  analyser?: AnalyserNode | null;
  color: string;
  intensity?: number;
  position?: 'left' | 'right' | 'center';
}

export function BeatVisualizer({ 
  isPlaying, 
  bpm = 120, 
  analyser, 
  color, 
  intensity = 1,
  position = 'center'
}: BeatVisualizerProps) {
  const [beatPulse, setBeatPulse] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const animationFrameRef = useRef<number>();
  const lastBeatTime = useRef<number>(0);
  const beatInterval = useRef<number>();

  // Calculate beat timing
  const beatDuration = (60 / bpm) * 1000; // milliseconds per beat

  // Audio analysis for real-time beat detection
  const analyzeAudio = useCallback(() => {
    if (!analyser || !isPlaying) {
      setAudioLevel(0);
      return;
    }

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    // Focus on bass frequencies (20-200Hz range)
    const bassRange = Math.floor(dataArray.length * 0.1);
    let bassSum = 0;
    for (let i = 0; i < bassRange; i++) {
      bassSum += dataArray[i];
    }
    
    const bassLevel = bassSum / (bassRange * 255);
    setAudioLevel(bassLevel * intensity);

    animationFrameRef.current = requestAnimationFrame(analyzeAudio);
  }, [analyser, isPlaying, intensity]);

  // Beat timing simulation when no real-time audio analysis
  useEffect(() => {
    if (isPlaying && bpm) {
      const startBeat = () => {
        const now = Date.now();
        if (now - lastBeatTime.current >= beatDuration) {
          setBeatPulse(1);
          lastBeatTime.current = now;
          
          // Fade out the pulse
          setTimeout(() => setBeatPulse(0.7), 50);
          setTimeout(() => setBeatPulse(0.4), 100);
          setTimeout(() => setBeatPulse(0.1), 150);
          setTimeout(() => setBeatPulse(0), 200);
        }
      };

      beatInterval.current = window.setInterval(startBeat, beatDuration / 8);
      
      return () => {
        if (beatInterval.current) {
          clearInterval(beatInterval.current);
        }
      };
    } else {
      setBeatPulse(0);
      if (beatInterval.current) {
        clearInterval(beatInterval.current);
      }
    }
  }, [isPlaying, bpm, beatDuration]);

  // Start audio analysis
  useEffect(() => {
    if (isPlaying && analyser) {
      analyzeAudio();
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, analyser, analyzeAudio]);

  if (!isPlaying) return null;

  const pulseIntensity = Math.max(beatPulse, audioLevel);
  const opacity = 0.1 + (pulseIntensity * 0.4);
  const scale = 1 + (pulseIntensity * 0.3);

  // Position-based gradient direction
  const gradientDirection = position === 'left' ? 'to right' : 
                           position === 'right' ? 'to left' : 
                           'radial';

  return (
    <div 
      className={`fixed inset-0 pointer-events-none transition-all duration-100 ${
        position === 'left' ? 'z-0' : position === 'right' ? 'z-0' : 'z-10'
      }`}
      style={{
        background: gradientDirection === 'radial' 
          ? `radial-gradient(circle at center, ${color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')} 0%, transparent 70%)`
          : `linear-gradient(${gradientDirection}, ${color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')} 0%, transparent 50%)`,
        transform: `scale(${scale})`,
        opacity: pulseIntensity,
        mixBlendMode: 'screen'
      }}
    />
  );
}

// Global background visualizer that combines all deck effects
interface GlobalBeatVisualizerProps {
  deckAPlaying: boolean;
  deckBPlaying: boolean;
  deckABpm?: number;
  deckBBpm?: number;
  deckAAnalyser?: AnalyserNode | null;
  deckBAnalyser?: AnalyserNode | null;
}

export function GlobalBeatVisualizer({
  deckAPlaying,
  deckBPlaying,
  deckABpm,
  deckBBpm,
  deckAAnalyser,
  deckBAnalyser
}: GlobalBeatVisualizerProps) {
  return (
    <>
      {/* Deck A (Left) - Cyan pulses */}
      <BeatVisualizer
        isPlaying={deckAPlaying}
        bpm={deckABpm}
        analyser={deckAAnalyser}
        color="#00d4ff"
        intensity={1.2}
        position="left"
      />
      
      {/* Deck B (Right) - Orange pulses */}
      <BeatVisualizer
        isPlaying={deckBPlaying}
        bpm={deckBBpm}
        analyser={deckBAnalyser}
        color="#ff6b00"
        intensity={1.2}
        position="right"
      />
      
      {/* Center combined effect when both playing */}
      {deckAPlaying && deckBPlaying && (
        <BeatVisualizer
          isPlaying={true}
          bpm={Math.max(deckABpm || 120, deckBBpm || 120)}
          analyser={deckAAnalyser || deckBAnalyser}
          color="#9d4edd"
          intensity={0.8}
          position="center"
        />
      )}
    </>
  );
}