import React, { useState, useEffect, useRef } from 'react';

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
  intensity = 0.5,
  position = 'center'
}: BeatVisualizerProps) {
  const [beatPulse, setBeatPulse] = useState(0);
  const [colorCycle, setColorCycle] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const lastBeatTime = useRef(0);
  const beatInterval = useRef<number | null>(null);

  // Minimal color palette
  const colorPalette = [
    '#00FFFF', // Cyan
    '#FF0040', // Red
    '#00FF80', // Green
    '#4080FF', // Blue
    '#FF8000', // Orange
    '#8000FF', // Purple
  ];

  const beatDuration = 60000 / bpm;

  // Real-time audio analysis
  useEffect(() => {
    if (!isPlaying) return;

    if (analyser) {
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);
      
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      const normalizedLevel = average / 255;
      setAudioLevel(normalizedLevel);
    }
  }, [isPlaying, analyser]);

  // Beat timing
  useEffect(() => {
    if (isPlaying && bpm) {
      const startBeat = () => {
        const now = Date.now();
        if (now - lastBeatTime.current >= beatDuration) {
          setBeatPulse(1);
          setColorCycle(prev => (prev + 1) % colorPalette.length);
          lastBeatTime.current = now;
          
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
        beatInterval.current = null;
      }
    }
  }, [isPlaying, bpm, intensity, audioLevel, position]);

  if (!isPlaying) return null;

  const pulseIntensity = Math.max(beatPulse, audioLevel);
  const opacity = 0.15 + (pulseIntensity * 0.4);
  
  const dynamicColor = colorPalette[colorCycle];
  const finalColor = audioLevel > 0.3 ? colorPalette[Math.floor(audioLevel * 3) % colorPalette.length] : dynamicColor;

  // Create simple gradient overlay
  let gradientDirection = 'to right';
  if (position === 'right') gradientDirection = 'to left';
  if (position === 'center') gradientDirection = 'radial';

  return (
    <div 
      className={`fixed inset-0 pointer-events-none transition-all duration-200 ${
        position === 'left' ? 'z-0' : position === 'right' ? 'z-0' : 'z-10'
      }`}
      style={{
        background: position === 'center' 
          ? `radial-gradient(circle at center, ${finalColor}${Math.floor(opacity * 255).toString(16).padStart(2, '0')} 0%, transparent 60%)`
          : `linear-gradient(${gradientDirection}, ${finalColor}${Math.floor(opacity * 255).toString(16).padStart(2, '0')} 0%, transparent 50%)`,
        mixBlendMode: 'screen',
        transform: `scale(${1 + pulseIntensity * 0.05})`,
        filter: `blur(${pulseIntensity * 2}px)`
      }}
    />
  );
}

// Global background visualizer
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
      {deckAPlaying && !deckBPlaying && (
        <BeatVisualizer
          isPlaying={deckAPlaying}
          bpm={deckABpm}
          analyser={deckAAnalyser}
          color="#00FFFF"
          intensity={0.8}
          position="left"
        />
      )}
      {deckBPlaying && !deckAPlaying && (
        <BeatVisualizer
          isPlaying={deckBPlaying}
          bpm={deckBBpm}
          analyser={deckBAnalyser}
          color="#FF0040"
          intensity={0.8}
          position="right"
        />
      )}
      {deckAPlaying && deckBPlaying && (
        <>
          <BeatVisualizer
            isPlaying={deckAPlaying}
            bpm={deckABpm}
            analyser={deckAAnalyser}
            color="#00FFFF"
            intensity={0.6}
            position="left"
          />
          <BeatVisualizer
            isPlaying={deckBPlaying}
            bpm={deckBBpm}
            analyser={deckBAnalyser}
            color="#FF0040"
            intensity={0.6}
            position="right"
          />
          <BeatVisualizer
            isPlaying={true}
            bpm={Math.max(deckABpm || 120, deckBBpm || 120)}
            analyser={deckAAnalyser || deckBAnalyser}
            color="#8000FF"
            intensity={0.4}
            position="center"
          />
        </>
      )}
    </>
  );
}