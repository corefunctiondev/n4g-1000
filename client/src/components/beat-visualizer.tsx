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
  const [colorCycle, setColorCycle] = useState(0);
  const animationFrameRef = useRef<number>();
  const lastBeatTime = useRef<number>(0);
  const beatInterval = useRef<number>();

  // Calculate beat timing
  const beatDuration = (60 / bpm) * 1000; // milliseconds per beat
  
  // Dynamic color palette for variety (no pink)
  const colorPalette = [
    '#00ff80', // Bright green
    '#8000ff', // Electric purple
    '#ff8000', // Vivid orange
    '#0080ff', // Electric blue
    '#ff4000', // Red-orange
    '#40ff00', // Lime green
    '#00ffff', // Cyan
    '#ffff00', // Yellow
    '#ff2000', // Bright red
    '#4000ff', // Deep blue
  ];

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
          setColorCycle(prev => (prev + 1) % colorPalette.length);
          lastBeatTime.current = now;
          
          // Fade out the pulse with enhanced intensity
          setTimeout(() => setBeatPulse(0.8), 50);
          setTimeout(() => setBeatPulse(0.5), 100);
          setTimeout(() => setBeatPulse(0.2), 150);
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
  const opacity = 0.15 + (pulseIntensity * 0.7); // Enhanced opacity range
  const scale = 1 + (pulseIntensity * 0.5); // More dramatic scaling
  
  // Dynamic color based on cycle and audio level
  const dynamicColor = colorPalette[colorCycle];
  const audioColorShift = Math.floor(audioLevel * 3) % colorPalette.length;
  const finalColor = audioLevel > 0.3 ? colorPalette[audioColorShift] : dynamicColor;

  // Position-based gradient direction
  const gradientDirection = position === 'left' ? 'to right' : 
                           position === 'right' ? 'to left' : 
                           'radial';

  // Multiple color layers for more vivid effect
  const primaryColor = finalColor;
  const secondaryColor = colorPalette[(colorCycle + 3) % colorPalette.length];

  return (
    <div 
      className={`fixed inset-0 pointer-events-none transition-all duration-75 ${
        position === 'left' ? 'z-0' : position === 'right' ? 'z-0' : 'z-10'
      }`}
      style={{
        background: gradientDirection === 'radial' 
          ? `radial-gradient(circle at center, 
              ${primaryColor}${Math.floor(opacity * 255).toString(16).padStart(2, '0')} 0%, 
              ${secondaryColor}${Math.floor(opacity * 0.3 * 255).toString(16).padStart(2, '0')} 40%, 
              transparent 80%)`
          : `linear-gradient(${gradientDirection}, 
              ${primaryColor}${Math.floor(opacity * 255).toString(16).padStart(2, '0')} 0%, 
              ${secondaryColor}${Math.floor(opacity * 0.4 * 255).toString(16).padStart(2, '0')} 30%, 
              transparent 60%)`,
        transform: `scale(${scale})`,
        opacity: pulseIntensity * 0.9,
        mixBlendMode: 'screen',
        filter: `saturate(${1.5 + pulseIntensity}) brightness(${1.2 + pulseIntensity * 0.5})`
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
      {/* Deck A (Left) - Vivid electric blue/purple pulses */}
      <BeatVisualizer
        isPlaying={deckAPlaying}
        bpm={deckABpm}
        analyser={deckAAnalyser}
        color="#0080ff"
        intensity={1.5}
        position="left"
      />
      
      {/* Deck B (Right) - Vivid orange/red pulses */}
      <BeatVisualizer
        isPlaying={deckBPlaying}
        bpm={deckBBpm}
        analyser={deckBAnalyser}
        color="#ff4000"
        intensity={1.5}
        position="right"
      />
      
      {/* Center combined effect when both playing - Rainbow spectrum */}
      {deckAPlaying && deckBPlaying && (
        <BeatVisualizer
          isPlaying={true}
          bpm={Math.max(deckABpm || 120, deckBBpm || 120)}
          analyser={deckAAnalyser || deckBAnalyser}
          color="#8000ff"
          intensity={1.0}
          position="center"
        />
      )}
    </>
  );
}