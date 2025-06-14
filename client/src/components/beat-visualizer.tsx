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

  // Futuristic color palette
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

  const beatDuration = 60000 / bpm;

  // Real-time audio analysis and wave animation
  useEffect(() => {
    if (!isPlaying) return;

    // Audio analysis
    if (analyser) {
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);
      
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      const normalizedLevel = average / 255;
      setAudioLevel(normalizedLevel);
    }

    // Smooth wave animation with audio response
    const waveAnimation = setInterval(() => {
      setWaveOffset(prev => prev + 0.4 + (audioLevel * 0.3));
    }, 16); // 60fps

    return () => clearInterval(waveAnimation);
  }, [isPlaying, analyser, audioLevel]);

  // Beat timing for pulse effects
  useEffect(() => {
    if (isPlaying && bpm) {
      const startBeat = () => {
        const now = Date.now();
        if (now - lastBeatTime.current >= beatDuration) {
          setBeatPulse(1);
          setColorCycle(prev => (prev + 1) % colorPalette.length);
          lastBeatTime.current = now;
          
          // Quick pulse fade
          setTimeout(() => setBeatPulse(0.6), 50);
          setTimeout(() => setBeatPulse(0.2), 100);
          setTimeout(() => setBeatPulse(0), 150);
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
  const opacity = 0.3 + (pulseIntensity * 0.7);
  const scale = 1 + (pulseIntensity * 0.4);
  
  // Dynamic color based on cycle and audio level
  const dynamicColor = colorPalette[colorCycle];
  const audioColorShift = Math.floor(audioLevel * 3) % colorPalette.length;
  const finalColor = audioLevel > 0.3 ? colorPalette[audioColorShift] : dynamicColor;

  // Wave parameters for futuristic appearance
  const waveAmplitude = 40 + (pulseIntensity * 60);
  const waveSpeed = waveOffset + (beatPulse * 4);

  // Create futuristic wave paths
  const createFuturisticWavePath = (baseY: number, waveIndex: number, direction: number) => {
    const points: string[] = [];
    const steps = 100;
    const phaseShift = waveIndex * 1.2;
    
    let startX, endX;
    if (position === 'left') {
      startX = 0;
      endX = window.innerWidth * 0.7;
    } else if (position === 'right') {
      startX = window.innerWidth * 0.3;
      endX = window.innerWidth;
    } else {
      startX = window.innerWidth * 0.2;
      endX = window.innerWidth * 0.8;
    }
    
    const waveWidth = endX - startX;
    
    for (let i = 0; i <= steps; i++) {
      const x = startX + (waveWidth / steps) * i;
      const normalizedX = (x - startX) / waveWidth;
      
      // Multiple wave components for complex patterns
      const primaryWave = Math.sin((normalizedX * Math.PI * 3) + (waveSpeed * direction * 0.2) + phaseShift) * waveAmplitude;
      const secondaryWave = Math.sin((normalizedX * Math.PI * 8) + (waveSpeed * direction * 0.3)) * (waveAmplitude * 0.3);
      const tertiaryWave = Math.cos((normalizedX * Math.PI * 12) + (waveSpeed * direction * 0.15)) * (waveAmplitude * 0.15);
      
      // Audio-reactive distortion
      const audioDistortion = Math.sin(normalizedX * Math.PI * 6 + waveSpeed * 0.5) * (audioLevel * 30);
      
      const waveY = baseY + primaryWave + secondaryWave + tertiaryWave + audioDistortion;
      points.push(`${Math.round(x)},${Math.round(waveY)}`);
    }
    
    return `M ${points.join(' L ')}`;
  };

  // Create multiple layered waves
  const waveCount = 16; // More waves for dense effect
  const waves = Array.from({ length: waveCount }, (_, i) => {
    const layerY = window.innerHeight * (0.1 + (i / waveCount) * 0.8);
    const direction = position === 'left' ? 1 : position === 'right' ? -1 : (i % 2 === 0 ? 1 : -1);
    
    return (
      <path
        key={i}
        d={createFuturisticWavePath(layerY, i, direction)}
        stroke={finalColor}
        strokeWidth={1.5 + pulseIntensity * 3}
        fill="none"
        opacity={opacity * (1 - (i / waveCount) * 0.5)}
        strokeLinecap="round"
        style={{
          filter: `drop-shadow(0 0 ${8 + pulseIntensity * 15}px ${finalColor}) blur(0.2px)`,
          transform: `scale(${scale})`,
          transformOrigin: position === 'left' ? 'left center' : position === 'right' ? 'right center' : 'center'
        }}
      />
    );
  });

  return (
    <div 
      className={`fixed inset-0 pointer-events-none ${
        position === 'left' ? 'z-0' : position === 'right' ? 'z-0' : 'z-10'
      }`}
      style={{
        mixBlendMode: 'screen',
        filter: `saturate(${2.5 + pulseIntensity}) brightness(${1.8 + pulseIntensity * 0.7})`
      }}
    >
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id={`waveGradient-${position}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={finalColor} stopOpacity={opacity} />
            <stop offset="50%" stopColor={finalColor} stopOpacity={opacity * 0.7} />
            <stop offset="100%" stopColor={finalColor} stopOpacity={position === 'center' ? opacity * 0.7 : 0.1} />
          </linearGradient>
        </defs>
        
        {waves}
        
        {/* Additional glow layer */}
        {Array.from({ length: 6 }, (_, i) => (
          <path
            key={`glow-${i}`}
            d={createFuturisticWavePath(window.innerHeight * (0.2 + i * 0.12), i, position === 'left' ? 1 : position === 'right' ? -1 : 1)}
            stroke={finalColor}
            strokeWidth={3 + pulseIntensity * 5}
            fill="none"
            opacity={opacity * 0.4 * (1 - i * 0.1)}
            strokeLinecap="round"
            style={{
              filter: `blur(${2 + pulseIntensity * 3}px)`,
              transform: `scale(${scale})`,
              transformOrigin: position === 'left' ? 'left center' : position === 'right' ? 'right center' : 'center'
            }}
          />
        ))}
      </svg>
    </div>
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
          intensity={0.9}
          position="left"
        />
      )}
      {deckBPlaying && !deckAPlaying && (
        <BeatVisualizer
          isPlaying={deckBPlaying}
          bpm={deckBBpm}
          analyser={deckBAnalyser}
          color="#FF0040"
          intensity={0.9}
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
            intensity={0.7}
            position="left"
          />
          <BeatVisualizer
            isPlaying={deckBPlaying}
            bpm={deckBBpm}
            analyser={deckBAnalyser}
            color="#FF0040"
            intensity={0.7}
            position="right"
          />
          <BeatVisualizer
            isPlaying={true}
            bpm={Math.max(deckABpm || 120, deckBBpm || 120)}
            analyser={deckAAnalyser || deckBAnalyser}
            color="#8000FF"
            intensity={0.5}
            position="center"
          />
        </>
      )}
    </>
  );
}