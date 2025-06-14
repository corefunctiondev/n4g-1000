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
        life: particle.life - 0.008,
        opacity: particle.opacity * particle.life,
        size: particle.size * (1 + (1 - particle.life) * 0.1)
      })).filter(particle => 
        particle.life > 0 && 
        particle.opacity > 0.05 &&
        particle.x > -50 && 
        particle.x < window.innerWidth + 50 &&
        particle.y > -50 && 
        particle.y < window.innerHeight + 50
      );
      
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
        // MASSIVE particle count for futuristic effect
        const baseCount = Math.floor(intensity * 200 + audioLevel * 300);
        const particleCount = baseCount + Math.floor(beatPulse * 500);
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
          
          // Position-based particle spawning with multiple streams
          let startX, startY, velX, velY;
          
          if (position === 'left') {
            // Multiple horizontal streams from left
            const streamHeight = window.innerHeight / 8;
            const streamIndex = Math.floor(Math.random() * 8);
            startX = -50 - Math.random() * 100;
            startY = streamIndex * streamHeight + Math.random() * streamHeight;
            velX = Math.random() * 12 + 4; // Very fast rightward
            velY = (Math.random() - 0.5) * 1;
          } else if (position === 'right') {
            // Multiple horizontal streams from right
            const streamHeight = window.innerHeight / 8;
            const streamIndex = Math.floor(Math.random() * 8);
            startX = window.innerWidth + 50 + Math.random() * 100;
            startY = streamIndex * streamHeight + Math.random() * streamHeight;
            velX = -(Math.random() * 12 + 4); // Very fast leftward
            velY = (Math.random() - 0.5) * 1;
          } else {
            // Center: explosive bursts from all directions
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 200 + 50;
            const speed = Math.random() * 8 + 3;
            startX = window.innerWidth / 2 + Math.cos(angle) * distance;
            startY = window.innerHeight / 2 + Math.sin(angle) * distance;
            velX = Math.cos(angle) * speed;
            velY = Math.sin(angle) * speed;
          }
          
          // Tiny particles for futuristic dust effect
          const particleSize = Math.random() * 2 + 0.5;
          
          newParticles.push({
            id: particleId.current++,
            x: startX,
            y: startY,
            size: particleSize,
            opacity: Math.random() * 0.7 + 0.1,
            color: currentColor,
            velocityX: velX,
            velocityY: velY,
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
      
      // Ultra-dense micro-bursts for millions of particles effect
      const microBurstInterval = window.setInterval(() => {
        const microCount = Math.floor((intensity + audioLevel) * 150);
        const microParticles: Array<{
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
        
        for (let i = 0; i < microCount; i++) {
          const currentColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
          let startX, velX;
          
          if (position === 'left') {
            startX = -40 - Math.random() * 80;
            velX = Math.random() * 18 + 6;
          } else if (position === 'right') {
            startX = window.innerWidth + 40 + Math.random() * 80;
            velX = -(Math.random() * 18 + 6);
          } else {
            const edge = Math.random() < 0.5;
            startX = edge ? -40 : window.innerWidth + 40;
            velX = edge ? Math.random() * 12 + 4 : -(Math.random() * 12 + 4);
          }
          
          microParticles.push({
            id: particleId.current++,
            x: startX,
            y: Math.random() * window.innerHeight,
            size: Math.random() * 1.2 + 0.2,
            opacity: Math.random() * 0.5 + 0.05,
            color: currentColor,
            velocityX: velX,
            velocityY: (Math.random() - 0.5) * 1.5,
            life: 0.6
          });
        }
        
        setParticles(prev => [...prev, ...microParticles]);
      }, beatDuration / 16); // Ultra-fast micro-bursts
      
      return () => {
        if (beatInterval.current) {
          clearInterval(beatInterval.current);
        }
        clearInterval(microBurstInterval);
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
            boxShadow: `0 0 ${particle.size * 3}px ${particle.color}, 0 0 ${particle.size * 6}px ${particle.color}40`,
            transform: `scale(${1 + beatPulse * 0.5})`,
            transition: 'transform 0.05s ease-out',
            filter: `blur(${particle.size * 0.1}px) brightness(1.5)`,
            mixBlendMode: 'screen',
            willChange: 'transform, opacity'
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