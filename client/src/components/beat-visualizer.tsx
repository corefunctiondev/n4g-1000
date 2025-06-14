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
  const [waveOffset, setWaveOffset] = useState(0);
  
  const lastBeatTime = useRef(0);
  const beatInterval = useRef<number | null>(null);

  // Vivid color palette (no pink per user preference)
  const colorPalette = [
    '#00FFFF', // Cyan
    '#FF0040', // Red
    '#00FF80', // Green
    '#4080FF', // Blue
    '#FF8000', // Orange
    '#8000FF', // Purple
    '#40FF00', // Lime
    '#FF0080', // Magenta
    '#0080FF', // Light Blue
    '#FF4000'  // Red-Orange
  ];

  const beatDuration = 60000 / bpm; // Beat duration in milliseconds

  // Real-time audio analysis
  useEffect(() => {
    if (!isPlaying) return;

    // Audio analysis for real-time beat detection
    if (analyser) {
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);
      
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      const normalizedLevel = average / 255;
      setAudioLevel(normalizedLevel);
    }

    // Continuous wave animation
    const waveAnimation = setInterval(() => {
      setWaveOffset(prev => prev + 0.15);
    }, 16); // 60fps

    return () => clearInterval(waveAnimation);
  }, [isPlaying, analyser]);

  // Beat timing for pulse effects
  useEffect(() => {
    if (isPlaying && bpm) {
      const startBeat = () => {
        const now = Date.now();
        if (now - lastBeatTime.current >= beatDuration) {
          setBeatPulse(1);
          setColorCycle(prev => (prev + 1) % colorPalette.length);
          lastBeatTime.current = now;
          
          // Fade out the pulse
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
        beatInterval.current = null;
      }
    }
  }, [isPlaying, bpm, intensity, audioLevel, position]);

  if (!isPlaying) return null;

  const pulseIntensity = Math.max(beatPulse, audioLevel);
  const opacity = 0.2 + (pulseIntensity * 0.8);
  const scale = 1 + (pulseIntensity * 0.6);
  
  // Dynamic color based on cycle and audio level
  const dynamicColor = colorPalette[colorCycle];
  const audioColorShift = Math.floor(audioLevel * 3) % colorPalette.length;
  const finalColor = audioLevel > 0.3 ? colorPalette[audioColorShift] : dynamicColor;

  // Wave parameters for flexible light movement
  const waveAmplitude = 60 + (pulseIntensity * 80); // How much the wave curves
  const waveFrequency = 0.01 + (audioLevel * 0.005); // Wave ripple density
  const waveSpeed = waveOffset + (beatPulse * 3); // Wave movement speed

  // Create multiple wave paths with smoother curves
  const createWavePath = (baseY: number, direction: number, waveIndex: number) => {
    const points: string[] = [];
    const steps = 60; // Reduced for smoother performance
    const phaseShift = waveIndex * 0.8; // Better wave separation
    
    for (let i = 0; i <= steps; i++) {
      const x = (window.innerWidth / steps) * i;
      const normalizedX = x / window.innerWidth;
      const waveY = baseY + Math.sin((normalizedX * Math.PI * 3) + (waveSpeed * direction * 0.1) + phaseShift) * waveAmplitude;
      points.push(`${Math.round(x)},${Math.round(waveY)}`);
    }
    
    return `M ${points.join(' L ')}`;
  };

  // Position-based wave configuration
  let waveElements;
  
  if (position === 'left') {
    // Flowing waves from left to right
    waveElements = (
      <svg className="absolute inset-0 w-full h-full" style={{ filter: 'blur(2px)' }}>
        <defs>
          <linearGradient id="leftWaveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={finalColor} stopOpacity={opacity} />
            <stop offset="70%" stopColor={finalColor} stopOpacity={opacity * 0.3} />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4, 5].map(i => (
          <path
            key={i}
            d={createWavePath(window.innerHeight * (0.15 + i * 0.14), 1, i)}
            stroke={finalColor}
            strokeWidth={8 + pulseIntensity * 12}
            fill="none"
            opacity={opacity * (1 - i * 0.1)}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 ${15 + pulseIntensity * 20}px ${finalColor})`,
              transform: `scale(${scale})`,
              transformOrigin: 'left center'
            }}
          />
        ))}
      </svg>
    );
  } else if (position === 'right') {
    // Flowing waves from right to left
    waveElements = (
      <svg className="absolute inset-0 w-full h-full" style={{ filter: 'blur(2px)' }}>
        <defs>
          <linearGradient id="rightWaveGradient" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor={finalColor} stopOpacity={opacity} />
            <stop offset="70%" stopColor={finalColor} stopOpacity={opacity * 0.3} />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4, 5].map(i => (
          <path
            key={i}
            d={createWavePath(window.innerHeight * (0.15 + i * 0.14), -1, i)}
            stroke={finalColor}
            strokeWidth={8 + pulseIntensity * 12}
            fill="none"
            opacity={opacity * (1 - i * 0.1)}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 ${15 + pulseIntensity * 20}px ${finalColor})`,
              transform: `scale(${scale})`,
              transformOrigin: 'right center'
            }}
          />
        ))}
      </svg>
    );
  } else {
    // Center: expanding circular waves
    waveElements = (
      <svg className="absolute inset-0 w-full h-full" style={{ filter: 'blur(2px)' }}>
        {[0, 1, 2, 3, 4, 5].map(i => {
          const radius = 60 + i * 90 + waveSpeed * 8;
          const radiusVariation = Math.sin(waveSpeed * 0.1 + i) * 20;
          return (
            <circle
              key={i}
              cx={window.innerWidth / 2}
              cy={window.innerHeight / 2}
              r={radius + radiusVariation}
              stroke={finalColor}
              strokeWidth={6 + pulseIntensity * 10}
              fill="none"
              opacity={opacity * (1 - i * 0.12)}
              style={{
                filter: `drop-shadow(0 0 ${20 + pulseIntensity * 25}px ${finalColor})`,
                transform: `scale(${scale})`
              }}
            />
          );
        })}
      </svg>
    );
  }

  return (
    <div 
      className={`fixed inset-0 pointer-events-none ${
        position === 'left' ? 'z-0' : position === 'right' ? 'z-0' : 'z-10'
      }`}
      style={{
        mixBlendMode: 'screen',
        filter: `saturate(${1.8 + pulseIntensity}) brightness(${1.4 + pulseIntensity * 0.6})`
      }}
    >
      {waveElements}
    </div>
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
  // Only show waves for the deck that's actually playing
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