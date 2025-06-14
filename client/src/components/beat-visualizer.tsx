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

      // Discrete beat-based wave phase (only changes on beat)
      const timeSinceLastBeat = Date.now() - lastBeatTime.current;
      const beatNumber = Math.floor(timeSinceLastBeat / beatDuration);
      setWavePhase(beatNumber * Math.PI * 0.5); // Beat-based jumps
      
      // Ultra-smooth continuous shape evolution with more flexibility
      setShapePhase(Date.now() * 0.0002); // Even slower for maximum smoothness
      
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
      
      // Beat detection with timing constraints
      const now = Date.now();
      if (energySpike && (now - lastBeatDetected) > minBeatInterval) {
        lastBeatDetected = now;
        lastBeatTime.current = now;
        setBeatPulse(1.0);
        
        // Quick beat bounce
        setTimeout(() => setBeatPulse(0.6), 100);
        setTimeout(() => setBeatPulse(0.2), 200);
        setTimeout(() => setBeatPulse(0), 300);
      }
      
      if (isPlaying) {
        requestAnimationFrame(detectBeats);
      }
    };
    
    detectBeats();
  }, [isPlaying, analyser, bpm]);

  if (!isPlaying) return null;

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
      
      if (position === 'left') {
        // Snake flows from left to right
        x = startX + (waveWidth / steps) * i;
        normalizedX = (x - startX) / waveWidth;
      } else if (position === 'right') {
        // Snake flows from right to left
        const reverseI = totalRevealSteps - i;
        x = startX + (waveWidth / steps) * reverseI;
        normalizedX = (x - startX) / waveWidth;
      } else {
        // Center waves grow from both sides simultaneously
        const centerStep = Math.floor(steps / 2);
        if (i <= centerStep) {
          x = startX + waveWidth / 2 - (waveWidth / 2 / centerStep) * (centerStep - i);
        } else {
          x = startX + waveWidth / 2 + (waveWidth / 2 / centerStep) * (i - centerStep);
        }
        normalizedX = (x - startX) / waveWidth;
      }
      
      // Flexible and smooth wave components with limited extension
      const audioIntensity = audioLevel * 0.8; // Reduced audio impact
      const beatBounce = beatPulse * 0.1; // Very subtle beat bounces
      
      // Ultra-smooth flexible easing functions
      const flexEase1 = (Math.sin(shapePhase * 0.07) + 1) * 0.5; // Slow flexible movement
      const flexEase2 = (Math.cos(shapePhase * 0.05) + 1) * 0.5; // Even more flexible
      const flexEase3 = (Math.sin(shapePhase * 0.04) + 1) * 0.5; // Maximum flexibility
      
      // Main wave with smooth flexibility and controlled size
      const mainWaveFreq = 2 + flexEase1 * 0.2; // Subtle frequency variation
      const beatWave = Math.sin((normalizedX * Math.PI * mainWaveFreq) + wavePhase + phaseShift) * (waveAmplitude * (0.5 + audioIntensity + beatBounce));
      
      // Flexible secondary waves with organic movement
      const morphFreq1 = 2.8 + flexEase2 * 0.3; // Gentle frequency shift
      const morphFreq2 = 1.2 + flexEase3 * 0.25; // Smooth variation
      const morphingWave1 = Math.sin((normalizedX * Math.PI * morphFreq1) + shapePhase * 0.1) * (waveAmplitude * 0.08 * (0.2 + audioIntensity) * flexEase1);
      const morphingWave2 = Math.cos((normalizedX * Math.PI * morphFreq2) + shapePhase * 0.08) * (waveAmplitude * 0.06 * (0.15 + audioIntensity) * flexEase2);
      
      // Gentle beat-responsive elements with flexibility
      const beatOffset = Math.sin(normalizedX * Math.PI + wavePhase) * (6 + audioLevel * 8 + beatPulse * 6) * flexEase3;
      const audioReactive = Math.sin(normalizedX * Math.PI * (2.2 + flexEase1 * 0.1) + shapePhase * 0.06) * (audioLevel * 10) * flexEase2;
      
      // Smooth shape variation with controlled amplitude
      const shapeVariation = Math.sin(normalizedX * Math.PI * (3.5 + flexEase2 * 0.2) + shapePhase * 0.03) * (3 + audioLevel * 4) * flexEase3;
      
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