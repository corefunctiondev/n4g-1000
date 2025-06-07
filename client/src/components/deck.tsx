import { useCallback, useState } from 'react';
import { useAudio } from '@/hooks/use-audio';
import { Waveform } from './waveform';
import { Knob } from './knob';
import { Fader } from './fader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface DeckProps {
  deckId: 'A' | 'B';
  color: string;
}

export function Deck({ deckId, color }: DeckProps) {
  const {
    deck,
    loadTrack,
    play,
    pause,
    stop,
    cue,
    setVolume,
    setTempo,
    setEQ,
    seek,
    setCuePoint,
    jumpToCue,
    setLoop,
    toggleLoop,
    beatJump,
    sync,
  } = useAudio(deckId);

  const [isDragOver, setIsDragOver] = useState(false);
  const [isDraggingTempo, setIsDraggingTempo] = useState(false);
  const [tempoRange, setTempoRange] = useState(8); // Default ±8%

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      loadTrack(file);
    }
  }, [loadTrack]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('audio/')) {
        loadTrack(file);
      }
    }
  }, [loadTrack]);

  const handlePlayPause = useCallback(() => {
    if (deck.isPlaying) {
      pause();
    } else {
      play();
    }
  }, [deck.isPlaying, play, pause]);

  // Tempo fader interaction
  const handleTempoMouseDown = useCallback((event: React.MouseEvent) => {
    setIsDraggingTempo(true);
    const handleMouseMove = (e: MouseEvent) => {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const y = e.clientY - rect.top;
      const height = rect.height;
      const percentage = Math.max(0, Math.min(1, (height - y) / height));
      const tempoValue = (percentage - 0.5) * 2 * tempoRange; // Convert to ±tempoRange%
      setTempo(tempoValue);
    };
    
    const handleMouseUp = () => {
      setIsDraggingTempo(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [setTempo, tempoRange]);

  // Hot cue button interactions
  const handleCueClick = useCallback((cueIndex: number, event: React.MouseEvent) => {
    if (event.shiftKey) {
      // Set cue point
      setCuePoint(cueIndex);
    } else {
      // Jump to cue point
      jumpToCue(cueIndex);
    }
  }, [setCuePoint, jumpToCue]);

  // Sync button
  const handleSync = useCallback(() => {
    sync();
  }, [sync]);

  // Beat jump buttons
  const handleBeatJump = useCallback((beats: number) => {
    beatJump(beats);
  }, [beatJump]);

  // Tempo range cycling
  const cycleTempoRange = useCallback(() => {
    const ranges = [4, 8, 16, 100];
    const currentIndex = ranges.indexOf(tempoRange);
    const nextIndex = (currentIndex + 1) % ranges.length;
    setTempoRange(ranges[nextIndex]);
  }, [tempoRange]);

  // Reset tempo to 0
  const resetTempo = useCallback(() => {
    setTempo(0);
  }, [setTempo]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatBPM = (bpm: number): string => {
    return bpm.toFixed(1);
  };

  const formatTempo = (tempo: number): string => {
    return `${tempo > 0 ? '+' : ''}${tempo.toFixed(1)}%`;
  };

  return (
    <div 
      className="pioneer-cdj p-4 w-[650px] h-[320px]"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Top Section - Screen and Info Display */}
      <div className="mb-3 flex-1">
        {/* Main LCD Screen */}
        <div className="pioneer-screen p-3 mb-3 h-full flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <div className="text-xs text-blue-400 font-mono">CDJ-3000</div>
            <div className="text-xs text-green-400 font-mono">
              {deck.isReady ? 'READY' : 'LOADING'}
            </div>
          </div>
          
          {/* BPM and Bar Display */}
          <div className="flex justify-between items-center mb-2">
            <div className="text-orange-400 font-mono text-sm">
              {deck.track ? `${Math.floor(deck.currentTime / (60 / deck.track.bpm / 4))}.${Math.floor((deck.currentTime % (60 / deck.track.bpm / 4)) * 4) + 1}` : '0.1'} Bars
            </div>
            <div className="text-green-400 font-mono text-sm">
              {deck.track ? `${Math.floor(deck.currentTime / (60 / deck.track.bpm))}.${Math.floor((deck.currentTime % (60 / deck.track.bpm)) * 4) + 1}` : '0.1'} Bars
            </div>
          </div>
          
          {/* 3-Band Waveform Display - Wider and Shorter */}
          <div className="pioneer-waveform mb-2 relative flex-1">
            <Waveform
              track={deck.track}
              currentTime={deck.currentTime}
              width={580}
              height={60}
              color={color}
              onSeek={seek}
              className="w-full"
            />
            
            {/* Frequency Band Labels */}
            <div className="absolute top-1 left-2 text-xs text-cyan-400 font-mono">HIGH</div>
            <div className="absolute top-1/2 left-2 text-xs text-blue-400 font-mono">MID</div>
            <div className="absolute bottom-1 left-2 text-xs text-orange-400 font-mono">LOW</div>
            
            {/* Hot Cue Markers */}
            <div className="absolute bottom-0 left-0 right-0 h-2 flex">
              {[1, 2, 3, 4].map((cue) => (
                <div 
                  key={cue}
                  className="w-1 h-2 bg-green-400 mr-4"
                  style={{ left: `${cue * 20}%` }}
                />
              ))}
            </div>
          </div>
          
          {/* Track Info and Time Display */}
          <div className="text-white">
            <div className="flex justify-between items-start mb-1">
              <div className="text-sm font-bold truncate flex-1 mr-2">
                {deck.track?.name || 'No Track Loaded'}
              </div>
              <div className="text-xs text-gray-400">TRACK 01</div>
            </div>
            
            <div className="flex justify-between items-center text-xs">
              <div className="text-orange-400 font-mono">
                {formatTime(deck.currentTime)}
              </div>
              <div className="pioneer-led text-center" style={{ color }}>
                <div className="text-lg font-bold">
                  {deck.track ? formatBPM(deck.track.bpm) : '---.-'}
                </div>
                <div className="text-xs">BPM</div>
              </div>
              <div className="text-orange-400 font-mono">
                -{deck.track ? formatTime(deck.track.duration - deck.currentTime) : '--:--'}
              </div>
            </div>
            
            {/* Additional CDJ Info */}
            <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
              <span>A.HOT CUE</span>
              <span>{deck.track ? `${formatTempo(deck.tempo)}` : '+0.0%'}</span>
              <span>02:34</span>
            </div>
          </div>
        </div>

        {/* Control Buttons Row */}
        <div className="grid grid-cols-6 gap-2 mb-4">
          <button className="pioneer-button py-2 px-1 text-xs">MENU</button>
          <button className="pioneer-button py-2 px-1 text-xs">TAG</button>
          <button className="pioneer-button py-2 px-1 text-xs">INFO</button>
          <button className="pioneer-button py-2 px-1 text-xs">TIME</button>
          <button className="pioneer-button py-2 px-1 text-xs">AUTO</button>
          <button className="pioneer-button py-2 px-1 text-xs">TRACK</button>
        </div>
      </div>

      {/* Bottom Controls Section - Compact Layout */}
      <div className="flex items-center justify-between gap-4">
        {/* Left Side - Transport Controls */}
        <div className="flex gap-2">
          <button 
            onClick={cue}
            className="pioneer-button py-2 px-3 text-orange-400 hover:text-orange-300"
          >
            <div className="text-sm">⏮</div>
            <div className="text-xs">CUE</div>
          </button>
          
          <button 
            onClick={handlePlayPause}
            className={`pioneer-button py-2 px-3 ${deck.isPlaying ? 'active text-green-400' : 'text-green-400'}`}
          >
            <div className="text-sm">{deck.isPlaying ? '⏸' : '▶'}</div>
            <div className="text-xs">{deck.isPlaying ? 'PAUSE' : 'PLAY'}</div>
          </button>
          
          <button 
            onClick={stop}
            className="pioneer-button py-2 px-3 text-red-400 hover:text-red-300"
          >
            <div className="text-sm">⏹</div>
            <div className="text-xs">STOP</div>
          </button>
          
          <button className="pioneer-button py-2 px-3 text-blue-400 hover:text-blue-300">
            <div className="text-sm">🔗</div>
            <div className="text-xs">SYNC</div>
          </button>
        </div>

        {/* Center - Hot Cue Pads */}
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((cueNum) => (
            <button
              key={cueNum}
              className="pioneer-button py-2 px-2 hover:bg-pink-500 hover:text-white transition-all"
            >
              <div className="text-sm font-bold">{cueNum}</div>
              <div className="text-xs">CUE</div>
            </button>
          ))}
        </div>

        {/* Right Side - Tempo Control */}
        <div className="pioneer-eq-section p-2">
          <div className="text-xs text-center mb-1 text-gray-300">TEMPO</div>
          <div className="text-center mb-2">
            <div className="text-sm font-mono pioneer-led" style={{ color }}>
              {formatTempo(deck.tempo)}
            </div>
          </div>
          <div className="flex justify-center">
            <div 
              className="pioneer-fader-track h-16 w-6 relative cursor-pointer"
              onMouseDown={handleTempoMouseDown}
            >
              <div 
                className={`pioneer-fader-handle w-8 h-4 absolute -left-1 transition-colors ${
                  isDraggingTempo ? 'bg-blue-400' : ''
                }`}
                style={{ 
                  top: `${((tempoRange - deck.tempo) / (tempoRange * 2)) * (64 - 16)}px`,
                }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button 
              className="pioneer-button py-1 text-xs hover:bg-blue-500 hover:text-white"
              onClick={cycleTempoRange}
            >
              ±{tempoRange}%
            </button>
            <button 
              className="pioneer-button py-1 text-xs hover:bg-green-500 hover:text-white"
              onClick={resetTempo}
            >
              RESET
            </button>
          </div>
        </div>
      </div>

      {/* File Upload Area */}
      <div className="mb-4">
        <label className={`block w-full p-3 border-2 border-dashed rounded-lg cursor-pointer transition-all text-center ${
          isDragOver 
            ? 'border-blue-400 bg-blue-400 bg-opacity-10 scale-105' 
            : 'border-gray-600 hover:border-blue-400'
        }`}>
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <i className={`fas fa-upload text-lg mb-1 ${isDragOver ? 'animate-bounce' : ''}`} style={{ color }} />
          <div className="text-xs text-gray-400">
            {isDragOver ? 'Drop your track here!' : 'Load Track'}
          </div>
        </label>
      </div>

      {/* Bottom Controls */}
      <div className="grid grid-cols-3 gap-2">
        <button className="pioneer-button py-2 text-xs">LOOP</button>
        <button className="pioneer-button py-2 text-xs">SLIP</button>
        <button className="pioneer-button py-2 text-xs">BEAT</button>
      </div>
    </div>
  );
}
