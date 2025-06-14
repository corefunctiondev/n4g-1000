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

    // Faster wave animation synced to beat
    const waveAnimation = setInterval(() => {
      setWaveOffset(prev => prev + 0.3 + (audioLevel * 0.2));
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
    // Lightning-style jagged waves from left
    const createLeftLightningPath = (baseY: number, waveIndex: number) => {
      const points: string[] = [];
      const steps = 40;
      const phaseShift = waveIndex * 1.2;
      const maxWidth = window.innerWidth * 0.6;
      
      for (let i = 0; i <= steps; i++) {
        const x = (maxWidth / steps) * i;
        const normalizedX = x / maxWidth;
        
        // Create jagged lightning effect
        const primaryWave = Math.sin((normalizedX * Math.PI * 2) + (waveSpeed * 0.2) + phaseShift) * waveAmplitude;
        const secondaryWave = Math.sin((normalizedX * Math.PI * 6) + (waveSpeed * 0.3)) * (waveAmplitude * 0.3);
        const randomJitter = (Math.random() - 0.5) * (pulseIntensity * 20);
        
        const waveY = baseY + primaryWave + secondaryWave + randomJitter;
        points.push(`${Math.round(x)},${Math.round(waveY)}`);
      }
      
      return `M ${points.join(' L ')}`;
    };

    waveElements = (
      <svg className="absolute inset-0 w-full h-full" style={{ filter: 'blur(0.3px)' }}>
        {Array.from({ length: 12 }, (_, i) => (
          <path
            key={i}
            d={createLeftLightningPath(window.innerHeight * (0.1 + i * 0.07), i)}
            stroke={finalColor}
            strokeWidth={2 + pulseIntensity * 4}
            fill="none"
            opacity={opacity * (1 - i * 0.06)}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 ${8 + pulseIntensity * 12}px ${finalColor})`,
              transform: `scale(${scale})`,
              transformOrigin: 'left center'
            }}
          />
        ))}
      </svg>
    );
  } else if (position === 'right') {
    // Spiral energy waves from right
    const createRightSpiralPath = (baseY: number, waveIndex: number) => {
      const points: string[] = [];
      const steps = 50;
      const phaseShift = waveIndex * 0.6;
      const startX = window.innerWidth * 0.4;
      const maxWidth = window.innerWidth * 0.6;
      
      for (let i = 0; i <= steps; i++) {
        const x = startX + (maxWidth / steps) * i;
        const normalizedX = (x - startX) / maxWidth;
        
        // Create spiral/helix effect
        const spiralWave = Math.sin((normalizedX * Math.PI * 4) + (waveSpeed * -0.25) + phaseShift) * waveAmplitude;
        const helixWave = Math.cos((normalizedX * Math.PI * 8) + (waveSpeed * -0.15)) * (waveAmplitude * 0.4);
        const pulseEffect = Math.sin(waveSpeed * 0.5 + phaseShift) * (pulseIntensity * 30);
        
        const waveY = baseY + spiralWave + helixWave + pulseEffect;
        points.push(`${Math.round(x)},${Math.round(waveY)}`);
      }
      
      return `M ${points.join(' L ')}`;
    };

    waveElements = (
      <svg className="absolute inset-0 w-full h-full" style={{ filter: 'blur(0.3px)' }}>
        {Array.from({ length: 12 }, (_, i) => (
          <path
            key={i}
            d={createRightSpiralPath(window.innerHeight * (0.1 + i * 0.07), i)}
            stroke={finalColor}
            strokeWidth={2 + pulseIntensity * 4}
            fill="none"
            opacity={opacity * (1 - i * 0.06)}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 ${8 + pulseIntensity * 12}px ${finalColor})`,
              transform: `scale(${scale})`,
              transformOrigin: 'right center'
            }}
          />
        ))}
      </svg>
    );
  } else {
    // Center: DNA double helix connecting waves
    const createHelixPath = (baseY: number, waveIndex: number, isTopHelix: boolean) => {
      const points: string[] = [];
      const steps = 80;
      const phaseShift = waveIndex * 1.0 + (isTopHelix ? 0 : Math.PI);
      const centerStart = window.innerWidth * 0.25;
      const centerWidth = window.innerWidth * 0.5;
      
      for (let i = 0; i <= steps; i++) {
        const x = centerStart + (centerWidth / steps) * i;
        const normalizedX = (x - centerStart) / centerWidth;
        
        // DNA helix pattern
        const helixWave = Math.sin((normalizedX * Math.PI * 6) + (waveSpeed * 0.3) + phaseShift) * (waveAmplitude * 0.6);
        const twistEffect = Math.cos((normalizedX * Math.PI * 12) + (waveSpeed * 0.2)) * (waveAmplitude * 0.2);
        const convergence = Math.sin(normalizedX * Math.PI) * (pulseIntensity * 15);
        
        const waveY = baseY + helixWave + twistEffect + convergence;
        points.push(`${Math.round(x)},${Math.round(waveY)}`);
      }
      
      return `M ${points.join(' L ')}`;
    };

    waveElements = (
      <svg className="absolute inset-0 w-full h-full" style={{ filter: 'blur(0.3px)' }}>
        {Array.from({ length: 8 }, (_, i) => (
          <g key={i}>
            <path
              d={createHelixPath(window.innerHeight * (0.15 + i * 0.1), i, true)}
              stroke={finalColor}
              strokeWidth={2 + pulseIntensity * 3}
              fill="none"
              opacity={opacity * (1 - i * 0.08)}
              strokeLinecap="round"
              style={{
                filter: `drop-shadow(0 0 ${6 + pulseIntensity * 10}px ${finalColor})`,
                transform: `scale(${scale})`,
                transformOrigin: 'center'
              }}
            />
            <path
              d={createHelixPath(window.innerHeight * (0.15 + i * 0.1), i, false)}
              stroke={finalColor}
              strokeWidth={2 + pulseIntensity * 3}
              fill="none"
              opacity={opacity * (1 - i * 0.08) * 0.7}
              strokeLinecap="round"
              style={{
                filter: `drop-shadow(0 0 ${6 + pulseIntensity * 10}px ${finalColor})`,
                transform: `scale(${scale})`,
                transformOrigin: 'center'
              }}
            />
          </g>
        ))}
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