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
  const [wavePhase, setWavePhase] = useState(0);
  const [beatDropIntensity, setBeatDropIntensity] = useState(0);
  const [lastAudioLevel, setLastAudioLevel] = useState(0);
  
  const lastBeatTime = useRef(0);
  const beatInterval = useRef<number | null>(null);
  const animationFrame = useRef<number | null>(null);

  // White color palette
  const colorPalette = [
    '#FFFFFF', // Pure White
  ];

  const beatDuration = 60000 / bpm;

  // Real-time audio analysis and wave animation
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
      return;
    }

    // Beat-locked wave animation with audio analysis
    const animate = () => {
      if (analyser) {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        
        // Get different frequency ranges for more detailed response
        const lowFreq = dataArray.slice(0, 85).reduce((sum, value) => sum + value, 0) / 85 / 255;
        const midFreq = dataArray.slice(85, 170).reduce((sum, value) => sum + value, 0) / 85 / 255;
        const highFreq = dataArray.slice(170, 255).reduce((sum, value) => sum + value, 0) / 85 / 255;
        
        const overall = (lowFreq + midFreq + highFreq) / 3;
        
        // Beat drop detection - sudden audio level increases
        const audioJump = overall - lastAudioLevel;
        if (audioJump > 0.3 && overall > 0.6) {
          setBeatDropIntensity(1.0);
        } else {
          setBeatDropIntensity(prev => Math.max(0, prev - 0.05)); // Fade out over time
        }
        
        setLastAudioLevel(overall);
        setAudioLevel(overall);
      }

      // Discrete beat-based wave phase (only changes on beat)
      const timeSinceLastBeat = Date.now() - lastBeatTime.current;
      const beatNumber = Math.floor(timeSinceLastBeat / beatDuration);
      setWavePhase(beatNumber * Math.PI * 0.5); // Smaller phase jumps per beat
      
      animationFrame.current = requestAnimationFrame(animate);
    };
    
    animate();

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [isPlaying, analyser, beatDuration]);

  // Precise beat timing
  useEffect(() => {
    if (isPlaying && bpm) {
      const startBeat = () => {
        const now = Date.now();
        if (now - lastBeatTime.current >= beatDuration) {
          setBeatPulse(1);
          setColorCycle(prev => (prev + 1) % colorPalette.length);
          lastBeatTime.current = now;
          
          // Quick beat pulse
          setTimeout(() => setBeatPulse(0.7), 50);
          setTimeout(() => setBeatPulse(0.4), 100);
          setTimeout(() => setBeatPulse(0), 150);
        }
      };

      beatInterval.current = window.setInterval(startBeat, beatDuration / 16); // High precision
      
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
  }, [isPlaying, bpm, beatDuration]);

  if (!isPlaying) return null;

  const pulseIntensity = Math.max(beatPulse, audioLevel);
  const opacity = 0.2 + (pulseIntensity * 0.6);
  
  // Dynamic color based on beat drop intensity
  const beatDropColor = beatDropIntensity > 0.7 ? '#000000' : beatDropIntensity > 0.3 ? '#0066FF' : '#FFFFFF';
  const finalColor = beatDropColor;

  // Audio-reactive wave parameters
  const baseAmplitude = 20 + (audioLevel * 80); // Wave size responds to audio fluctuations
  const waveAmplitude = baseAmplitude + (pulseIntensity * 40);
  const beatSyncedOffset = Math.sin(wavePhase) * (50 + audioLevel * 100);
  const secondaryOffset = Math.sin(wavePhase * 2) * (30 + audioLevel * 60);

  // Create beat-matched wave path
  const createBeatWavePath = (baseY: number, waveIndex: number, direction: number) => {
    const points: string[] = [];
    const steps = 80;
    const phaseShift = waveIndex * 0.8;
    
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
      
      // Beat-locked wave components with audio sizing
      const audioIntensity = audioLevel * 1.5; // Audio affects size, not movement
      const beatWave = Math.sin((normalizedX * Math.PI * 2) + wavePhase + phaseShift) * (waveAmplitude * (0.6 + audioIntensity));
      const subBeat = Math.sin((normalizedX * Math.PI * 4) + wavePhase) * (waveAmplitude * 0.2 * (0.5 + audioIntensity));
      const beatOffset = Math.sin(normalizedX * Math.PI + wavePhase) * (20 + audioLevel * 40);
      const audioReactive = Math.sin(normalizedX * Math.PI * 3) * (audioLevel * 50); // Static pattern, audio-sized
      const dynamicVariation = Math.cos(normalizedX * Math.PI * 6) * (audioLevel * 20); // Static pattern, audio-sized
      
      const waveY = baseY + beatWave + subBeat + beatOffset + audioReactive + dynamicVariation;
      points.push(`${Math.round(x)},${Math.round(waveY)}`);
    }
    
    return `M ${points.join(' L ')}`;
  };

  // Create gradient-based waves
  const waveCount = 8;
  const waves = Array.from({ length: waveCount }, (_, i) => {
    const layerY = window.innerHeight * (0.15 + (i / waveCount) * 0.7);
    const direction = position === 'left' ? 1 : position === 'right' ? -1 : (i % 2 === 0 ? 1 : -1);
    const strokeOpacity = opacity * (1 - (i / waveCount) * 0.4);
    
    return (
      <g key={i}>
        {/* Main wave with gradient stroke */}
        <path
          d={createBeatWavePath(layerY, i, direction)}
          stroke={`url(#waveGradient-${position}-${i})`}
          strokeWidth={1.5 + pulseIntensity * 3 + audioLevel * 2}
          fill="none"
          opacity={strokeOpacity}
          strokeLinecap="round"
          style={{
            filter: `drop-shadow(0 0 ${8 + pulseIntensity * 15 + audioLevel * 10}px ${finalColor})`,
            transform: `scale(${1 + beatPulse * 0.15 + audioLevel * 0.1})`,
            transformOrigin: position === 'left' ? 'left center' : position === 'right' ? 'right center' : 'center'
          }}
        />
        
        {/* Enhanced glow layer that responds to audio */}
        <path
          d={createBeatWavePath(layerY, i, direction)}
          stroke={finalColor}
          strokeWidth={3 + pulseIntensity * 8 + audioLevel * 4}
          fill="none"
          opacity={strokeOpacity * (0.2 + audioLevel * 0.3)}
          strokeLinecap="round"
          style={{
            filter: `blur(${2 + pulseIntensity * 6 + audioLevel * 4}px)`,
            transform: `scale(${1 + beatPulse * 0.15 + audioLevel * 0.1})`,
            transformOrigin: position === 'left' ? 'left center' : position === 'right' ? 'right center' : 'center'
          }}
        />
        
        {/* Extra bright layer for high audio levels */}
        {audioLevel > 0.5 && (
          <path
            d={createBeatWavePath(layerY, i, direction)}
            stroke={finalColor}
            strokeWidth={2 + audioLevel * 3}
            fill="none"
            opacity={strokeOpacity * audioLevel * 0.4}
            strokeLinecap="round"
            style={{
              filter: `blur(${1 + audioLevel * 3}px) brightness(1.5)`,
              transform: `scale(${1 + beatPulse * 0.2 + audioLevel * 0.15})`,
              transformOrigin: position === 'left' ? 'left center' : position === 'right' ? 'right center' : 'center'
            }}
          />
        )}
      </g>
    );
  });

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
          {Array.from({ length: waveCount }, (_, i) => (
            <linearGradient 
              key={i}
              id={`waveGradient-${position}-${i}`} 
              x1="0%" y1="0%" x2="100%" y2="0%"
            >
              <stop offset="0%" stopColor={finalColor} stopOpacity={opacity} />
              <stop offset="30%" stopColor={finalColor} stopOpacity={opacity * 0.8} />
              <stop offset="70%" stopColor={colorPalette[(colorCycle + 2) % colorPalette.length]} stopOpacity={opacity * 0.6} />
              <stop offset="100%" stopColor={colorPalette[(colorCycle + 4) % colorPalette.length]} stopOpacity={0.1} />
            </linearGradient>
          ))}
        </defs>
        
        {waves}
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