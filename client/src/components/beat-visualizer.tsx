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
  const [pulseRings, setPulseRings] = useState<Array<{
    id: number;
    x: number;
    y: number;
    radius: number;
    opacity: number;
    life: number;
  }>>([]);
  const [energyBeams, setEnergyBeams] = useState<Array<{
    id: number;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    opacity: number;
    life: number;
    intensity: number;
  }>>([]);
  
  const lastBeatTime = useRef(0);
  const beatInterval = useRef<number | null>(null);
  const pulseId = useRef(0);
  const beamId = useRef(0);

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

  // Real-time audio analysis and animation updates
  useEffect(() => {
    if (!isPlaying) {
      setPulseRings([]);
      setEnergyBeams([]);
      return;
    }

    // Audio analysis
    if (analyser) {
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);
      
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      const normalizedLevel = average / 255;
      setAudioLevel(normalizedLevel);
    }

    // Update pulse rings
    setPulseRings(prev => prev.map(ring => ({
      ...ring,
      radius: ring.radius + 8,
      life: ring.life - 0.02,
      opacity: ring.opacity * ring.life
    })).filter(ring => ring.life > 0 && ring.radius < 500));

    // Update energy beams
    setEnergyBeams(prev => prev.map(beam => ({
      ...beam,
      life: beam.life - 0.015,
      opacity: beam.opacity * beam.life,
      intensity: beam.intensity * beam.life
    })).filter(beam => beam.life > 0));

  }, [isPlaying, analyser]);

  // Beat timing for effects
  useEffect(() => {
    if (isPlaying && bpm) {
      const startBeat = () => {
        const now = Date.now();
        if (now - lastBeatTime.current >= beatDuration) {
          setBeatPulse(1);
          setColorCycle(prev => (prev + 1) % colorPalette.length);
          lastBeatTime.current = now;
          
          // Create pulse effects
          createPulseRings();
          createEnergyBeams();
          
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
        beatInterval.current = null;
      }
    }
  }, [isPlaying, bpm, intensity, audioLevel, position]);

  const createPulseRings = () => {
    const pulseIntensity = Math.max(beatPulse, audioLevel);
    const ringCount = Math.floor(3 + pulseIntensity * 5);
    
    for (let i = 0; i < ringCount; i++) {
      let centerX, centerY;
      
      if (position === 'left') {
        centerX = Math.random() * (window.innerWidth * 0.4);
        centerY = Math.random() * window.innerHeight;
      } else if (position === 'right') {
        centerX = window.innerWidth * 0.6 + Math.random() * (window.innerWidth * 0.4);
        centerY = Math.random() * window.innerHeight;
      } else {
        centerX = window.innerWidth * 0.3 + Math.random() * (window.innerWidth * 0.4);
        centerY = Math.random() * window.innerHeight;
      }

      setPulseRings(prev => [...prev, {
        id: pulseId.current++,
        x: centerX,
        y: centerY,
        radius: 20,
        opacity: 0.8 + Math.random() * 0.2,
        life: 1.0
      }]);
    }
  };

  const createEnergyBeams = () => {
    const pulseIntensity = Math.max(beatPulse, audioLevel);
    const beamCount = Math.floor(8 + pulseIntensity * 12);
    
    for (let i = 0; i < beamCount; i++) {
      let startX, startY, endX, endY;
      
      if (position === 'left') {
        // Beams emanate from left side
        startX = Math.random() * 100;
        startY = Math.random() * window.innerHeight;
        endX = Math.random() * (window.innerWidth * 0.6);
        endY = Math.random() * window.innerHeight;
      } else if (position === 'right') {
        // Beams emanate from right side  
        startX = window.innerWidth - Math.random() * 100;
        startY = Math.random() * window.innerHeight;
        endX = window.innerWidth * 0.4 + Math.random() * (window.innerWidth * 0.6);
        endY = Math.random() * window.innerHeight;
      } else {
        // Center beams connect across
        startX = window.innerWidth * 0.2 + Math.random() * (window.innerWidth * 0.2);
        startY = Math.random() * window.innerHeight;
        endX = window.innerWidth * 0.6 + Math.random() * (window.innerWidth * 0.2);
        endY = Math.random() * window.innerHeight;
      }

      setEnergyBeams(prev => [...prev, {
        id: beamId.current++,
        startX,
        startY,
        endX,
        endY,
        opacity: 0.6 + Math.random() * 0.4,
        life: 1.0,
        intensity: pulseIntensity
      }]);
    }
  };

  if (!isPlaying) return null;

  const pulseIntensity = Math.max(beatPulse, audioLevel);
  const dynamicColor = colorPalette[colorCycle];
  const audioColorShift = Math.floor(audioLevel * 3) % colorPalette.length;
  const finalColor = audioLevel > 0.3 ? colorPalette[audioColorShift] : dynamicColor;

  return (
    <div 
      className={`fixed inset-0 pointer-events-none ${
        position === 'left' ? 'z-0' : position === 'right' ? 'z-0' : 'z-10'
      }`}
      style={{
        mixBlendMode: 'screen',
        filter: `saturate(${2 + pulseIntensity}) brightness(${1.5 + pulseIntensity * 0.5})`
      }}
    >
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <radialGradient id={`pulse-${position}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={finalColor} stopOpacity="0.8" />
            <stop offset="70%" stopColor={finalColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id={`beam-${position}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={finalColor} stopOpacity="0.8" />
            <stop offset="50%" stopColor={finalColor} stopOpacity="0.6" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
        
        {/* Pulse Rings */}
        {pulseRings.map(ring => (
          <circle
            key={ring.id}
            cx={ring.x}
            cy={ring.y}
            r={ring.radius}
            fill={`url(#pulse-${position})`}
            stroke={finalColor}
            strokeWidth={2 + pulseIntensity * 3}
            fillOpacity={ring.opacity * 0.3}
            strokeOpacity={ring.opacity}
            style={{
              filter: `drop-shadow(0 0 ${10 + ring.opacity * 15}px ${finalColor})`
            }}
          />
        ))}
        
        {/* Energy Beams */}
        {energyBeams.map(beam => (
          <line
            key={beam.id}
            x1={beam.startX}
            y1={beam.startY}
            x2={beam.endX}
            y2={beam.endY}
            stroke={finalColor}
            strokeWidth={1 + beam.intensity * 4}
            opacity={beam.opacity}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 ${5 + beam.intensity * 10}px ${finalColor})`,
              animation: 'pulse 0.1s ease-in-out'
            }}
          />
        ))}
        
        {/* Central Energy Core (only for center position) */}
        {position === 'center' && pulseIntensity > 0.3 && (
          <circle
            cx={window.innerWidth / 2}
            cy={window.innerHeight / 2}
            r={30 + pulseIntensity * 50}
            fill={`url(#pulse-${position})`}
            fillOpacity={pulseIntensity * 0.4}
            style={{
              filter: `drop-shadow(0 0 ${30 + pulseIntensity * 40}px ${finalColor})`
            }}
          />
        )}
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