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
  const [shapePhase, setShapePhase] = useState(0);
  const [waveReveal, setWaveReveal] = useState(0);
  const [snakePosition, setSnakePosition] = useState(0);
  const startTime = useRef<number | null>(null);
  
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

    // Beat-locked wave animation with snake entrance effect
    const animate = () => {
      const now = Date.now();
      
      // Initialize start time on first frame
      if (!startTime.current) {
        startTime.current = now;
        setWaveReveal(0);
      }
      
      // Snake entrance animation over 6 seconds
      const entranceTime = now - startTime.current;
      const entranceDuration = 6000; // 6 seconds for slower entrance
      if (entranceTime < entranceDuration) {
        const progress = entranceTime / entranceDuration;
        // Smooth ease-in curve for snake entrance
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        setWaveReveal(easeProgress);
      } else {
        setWaveReveal(1);
      }
      
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

      // Snake movement around CDJ interface (continuous while playing)
      setSnakePosition(Date.now() * 0.0008); // Slow continuous snake movement
      
      // Wave phase only updates on detected beats (no continuous movement)
      // wavePhase and shapePhase are only updated when beats are detected
      
      animationFrame.current = requestAnimationFrame(animate);
    };
    
    animate();

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [isPlaying, analyser, beatDuration]);

  // Reset entrance animation when playback stops
  useEffect(() => {
    if (!isPlaying) {
      startTime.current = null;
      setWaveReveal(0);
    }
  }, [isPlaying]);

  // Enhanced beat detection using audio analysis
  useEffect(() => {
    if (!isPlaying || !analyser) return;

    let lastBeatDetected = 0;
    let energyHistory: number[] = [];
    const minBeatInterval = 60000 / (bpm || 120) * 0.7; // Allow some timing flexibility
    
    const detectBeats = () => {
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);
      
      // Focus on low frequencies for beat detection (kick drums, bass)
      const lowFreqs = dataArray.slice(0, 60);
      const lowFreqEnergy = lowFreqs.reduce((sum, val) => sum + val, 0) / lowFreqs.length;
      
      // Keep energy history for comparison
      energyHistory.push(lowFreqEnergy);
      if (energyHistory.length > 8) energyHistory.shift();
      
      const avgEnergy = energyHistory.reduce((sum, val) => sum + val, 0) / energyHistory.length;
      const energySpike = lowFreqEnergy > avgEnergy * 1.4 && lowFreqEnergy > 100;
      
      // Enhanced beat detection with smoother response
      const now = Date.now();
      if (energySpike && (now - lastBeatDetected) > minBeatInterval) {
        lastBeatDetected = now;
        lastBeatTime.current = now;
        setBeatPulse(1.0);
        
        // Update wave phase only on detected beats
        setWavePhase(prev => prev + Math.PI * 0.5);
        setShapePhase(prev => prev + 0.1);
        
        // Smoother beat pulse decay with more responsiveness
        setTimeout(() => setBeatPulse(0.8), 50);
        setTimeout(() => setBeatPulse(0.6), 100);
        setTimeout(() => setBeatPulse(0.4), 150);
        setTimeout(() => setBeatPulse(0.2), 200);
        setTimeout(() => setBeatPulse(0.1), 250);
        setTimeout(() => setBeatPulse(0), 300);
      }
      
      if (isPlaying) {
        requestAnimationFrame(detectBeats);
      }
    };
    
    detectBeats();
  }, [isPlaying, analyser, bpm]);

  if (!isPlaying) return null;

  const width = window.innerWidth;
  const height = window.innerHeight;
  const pulseIntensity = Math.max(beatPulse, audioLevel);
  const opacity = 0.2 + (pulseIntensity * 0.6);
  
  // Dynamic color based on beat drop intensity
  const beatDropColor = beatDropIntensity > 0.7 ? '#000000' : beatDropIntensity > 0.3 ? '#0066FF' : '#FFFFFF';
  const finalColor = beatDropColor;

  // Smooth and flexible wave parameters with limited extension
  const baseAmplitude = 15 + (audioLevel * 35); // Reduced maximum size
  const waveAmplitude = baseAmplitude + (pulseIntensity * 20); // Gentler pulse effect
  const beatSyncedOffset = Math.sin(wavePhase) * (20 + audioLevel * 30); // Limited offset
  const secondaryOffset = Math.sin(wavePhase * 2) * (12 + audioLevel * 18); // Smaller secondary

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
    
    // Snake entrance effect: waves reveal progressively from the sides
    const totalRevealSteps = Math.floor(steps * waveReveal);
    
    for (let i = 0; i <= totalRevealSteps; i++) {
      let x, normalizedX;
      
      // Calculate snake path around CDJ (flowing movement)
      const snakeProgress = (i / steps) + snakePosition;
      
      if (position === 'left') {
        // Left snake flows in curved path around left CDJ
        const pathProgress = snakeProgress % 1;
        const curveX = pathProgress * waveWidth;
        const curveOffset = Math.sin(pathProgress * Math.PI * 3) * (waveWidth * 0.2);
        x = startX + curveX + curveOffset;
        normalizedX = (x - startX) / waveWidth;
      } else if (position === 'right') {
        // Right snake flows in curved path around right CDJ (opposite direction)
        const pathProgress = (-snakeProgress) % 1;
        const curveX = Math.abs(pathProgress) * waveWidth;
        const curveOffset = Math.sin(Math.abs(pathProgress) * Math.PI * 3) * (waveWidth * 0.2);
        x = startX + waveWidth - curveX - curveOffset;
        normalizedX = (x - startX) / waveWidth;
      } else {
        // Center snakes flow in sinuous S-curves
        const pathProgress = snakeProgress % 1;
        const curveX = pathProgress * waveWidth;
        const sineOffset = Math.sin(pathProgress * Math.PI * 4) * (waveWidth * 0.15);
        x = startX + curveX + sineOffset;
        normalizedX = (x - startX) / waveWidth;
      }
      
      // More reactive wave components with enhanced beat response
      const audioIntensity = audioLevel * 0.9; // Increased audio impact
      const beatBounce = beatPulse * 0.4; // Much more reactive to beats
      const beatReactivity = beatPulse * 0.25; // Increased beat responsiveness
      
      // Static base values (no continuous movement)
      const flexEase1 = 0.5; // Static value
      const flexEase2 = 0.5; // Static value  
      const flexEase3 = 0.5; // Static value
      
      // Highly reactive main wave (beat-triggered only)
      const mainWaveFreq = 2.1 + beatReactivity * 0.3; // Stronger frequency response
      const beatWave = Math.sin((normalizedX * Math.PI * mainWaveFreq) + wavePhase + phaseShift) * (waveAmplitude * (0.7 + audioIntensity + beatBounce));
      
      // More reactive secondary waves (beat-only)
      const morphFreq1 = 2.9 + beatPulse * 0.15; // Increased beat response
      const morphFreq2 = 1.3 + beatPulse * 0.12; // Increased beat response
      const morphingWave1 = Math.sin((normalizedX * Math.PI * morphFreq1) + shapePhase) * (waveAmplitude * 0.15 * (0.4 + audioIntensity + beatReactivity));
      const morphingWave2 = Math.cos((normalizedX * Math.PI * morphFreq2) + shapePhase * 0.8) * (waveAmplitude * 0.12 * (0.3 + audioIntensity + beatReactivity));
      
      // Enhanced beat-triggered elements
      const beatOffset = Math.sin(normalizedX * Math.PI + wavePhase + beatPulse * 0.7) * (10 + audioLevel * 15 + beatPulse * 10);
      const audioReactive = Math.sin(normalizedX * Math.PI * (2.3 + beatPulse * 0.15) + shapePhase) * (audioLevel * 15 + beatPulse * 15);
      
      // More responsive shape variation
      const shapeVariation = Math.sin(normalizedX * Math.PI * (3.6 + beatReactivity * 0.3) + shapePhase * 0.5) * (6 + audioLevel * 8 + beatPulse * 5);
      
      const waveY = baseY + beatWave + morphingWave1 + morphingWave2 + beatOffset + audioReactive + shapeVariation;
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