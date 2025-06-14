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
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    opacity: number;
    color: string;
    velocityX: number;
    velocityY: number;
    life: number;
  }>>([]);
  const animationFrameRef = useRef<number>();
  const lastBeatTime = useRef<number>(0);
  const beatInterval = useRef<number>();
  const particleId = useRef(0);

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

  // Particle animation and audio analysis
  const animateParticles = useCallback(() => {
    if (!isPlaying) {
      setParticles([]);
      return;
    }

    // Update particles
    setParticles(prev => {
      const updated = prev.map(particle => ({
        ...particle,
        x: particle.x + particle.velocityX,
        y: particle.y + particle.velocityY,
        life: particle.life - 0.01,
        opacity: particle.opacity * particle.life,
        size: particle.size * (1 + (1 - particle.life) * 0.1)
      })).filter(particle => particle.life > 0 && particle.opacity > 0.05);
      
      return updated;
    });

    // Audio analysis for real-time beat detection
    if (analyser) {
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
    }

    animationFrameRef.current = requestAnimationFrame(animateParticles);
  }, [analyser, isPlaying, intensity]);

  // Beat timing simulation when no real-time audio analysis
  useEffect(() => {
    if (isPlaying && bpm) {
      const createParticles = () => {
        const particleCount = Math.floor(intensity * 15 + audioLevel * 20);
        const newParticles: Array<{
          id: number;
          x: number;
          y: number;
          size: number;
          opacity: number;
          color: string;
          velocityX: number;
          velocityY: number;
          life: number;
        }> = [];
        
        for (let i = 0; i < particleCount; i++) {
          const currentColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
          
          newParticles.push({
            id: particleId.current++,
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            size: Math.random() * 4 + 1,
            opacity: Math.random() * 0.8 + 0.2,
            color: currentColor,
            velocityX: (Math.random() - 0.5) * 2,
            velocityY: (Math.random() - 0.5) * 2,
            life: 1.0
          });
        }
        
        setParticles(prev => [...prev, ...newParticles]);
      };

      const startBeat = () => {
        const now = Date.now();
        if (now - lastBeatTime.current >= beatDuration) {
          setBeatPulse(1);
          setColorCycle(prev => (prev + 1) % colorPalette.length);
          createParticles();
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
      }
    }
  }, [isPlaying, bpm, beatDuration]);

  // Start particle animation
  useEffect(() => {
    if (isPlaying) {
      animateParticles();
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, animateParticles]);

  if (!isPlaying) return null;

  return (
    <div 
      className={`fixed inset-0 pointer-events-none ${
        position === 'left' ? 'z-0' : position === 'right' ? 'z-0' : 'z-10'
      }`}
    >
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            opacity: particle.opacity,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
            transform: `scale(${1 + beatPulse * 0.3})`,
            transition: 'transform 0.1s ease-out',
            filter: `blur(${particle.size * 0.2}px)`,
            mixBlendMode: 'screen'
          }}
        />
      ))}
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