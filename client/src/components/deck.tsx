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
  } = useAudio(deckId);

  const [isDragOver, setIsDragOver] = useState(false);

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
      className="pioneer-cdj p-6 w-full max-w-md mx-auto"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Top Section - Screen and Info Display */}
      <div className="mb-6">
        {/* Main LCD Screen */}
        <div className="pioneer-screen p-4 mb-4">
          <div className="flex justify-between items-start mb-2">
            <div className="text-xs text-blue-400 font-mono">CDJ-3000</div>
            <div className="text-xs text-green-400 font-mono">
              {deck.isReady ? 'READY' : 'LOADING'}
            </div>
          </div>
          
          {/* Waveform Display */}
          <div className="pioneer-waveform mb-3">
            <Waveform
              track={deck.track}
              currentTime={deck.currentTime}
              width={280}
              height={60}
              color={color}
              onSeek={seek}
              className="w-full"
            />
          </div>
          
          {/* Track Info */}
          <div className="text-white">
            <div className="text-sm font-bold truncate mb-1">
              {deck.track?.name || 'No Track Loaded'}
            </div>
            <div className="flex justify-between text-xs text-gray-300">
              <span>{formatTime(deck.currentTime)}</span>
              <span className="pioneer-led" style={{ color }}>
                {deck.track ? formatBPM(deck.track.bpm) : '---.-'} BPM
              </span>
              <span>{deck.track ? formatTime(deck.track.duration - deck.currentTime) : '--:--'}</span>
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

      {/* Center Section - Jog Wheel */}
      <div className="flex justify-center mb-6">
        <div className="pioneer-jog cursor-pointer hover:scale-105 transition-transform"></div>
      </div>

      {/* Transport Controls */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        <button 
          onClick={cue}
          className="pioneer-button py-3 text-orange-400 hover:text-orange-300"
        >
          <div className="text-lg">⏮</div>
          <div className="text-xs">CUE</div>
        </button>
        
        <button 
          onClick={handlePlayPause}
          className={`pioneer-button py-3 ${deck.isPlaying ? 'active text-green-400' : 'text-green-400'}`}
        >
          <div className="text-lg">{deck.isPlaying ? '⏸' : '▶'}</div>
          <div className="text-xs">{deck.isPlaying ? 'PAUSE' : 'PLAY'}</div>
        </button>
        
        <button 
          onClick={stop}
          className="pioneer-button py-3 text-red-400 hover:text-red-300"
        >
          <div className="text-lg">⏹</div>
          <div className="text-xs">STOP</div>
        </button>
        
        <button className="pioneer-button py-3 text-blue-400 hover:text-blue-300">
          <div className="text-lg">🔗</div>
          <div className="text-xs">SYNC</div>
        </button>
      </div>

      {/* Hot Cue Pads */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {[1, 2, 3, 4].map((cueNum) => (
          <button
            key={cueNum}
            className="pioneer-button py-4 hover:bg-pink-500 hover:text-white transition-all"
          >
            <div className="text-lg font-bold">{cueNum}</div>
            <div className="text-xs">HOT CUE</div>
          </button>
        ))}
      </div>

      {/* Left Side Controls */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* EQ Section */}
        <div className="pioneer-eq-section p-3">
          <div className="text-xs text-center mb-2 text-gray-300">EQ</div>
          <div className="space-y-3">
            <div className="text-center">
              <div 
                className="pioneer-knob w-12 h-12 mx-auto mb-1 cursor-pointer"
                style={{ transform: `rotate(${(deck.eq.high - 50) * 2.7}deg)` }}
                onMouseDown={(e) => {
                  // Add knob interaction logic
                }}
              />
              <div className="text-xs text-gray-400">HI</div>
            </div>
            <div className="text-center">
              <div 
                className="pioneer-knob w-12 h-12 mx-auto mb-1 cursor-pointer"
                style={{ transform: `rotate(${(deck.eq.mid - 50) * 2.7}deg)` }}
              />
              <div className="text-xs text-gray-400">MID</div>
            </div>
            <div className="text-center">
              <div 
                className="pioneer-knob w-12 h-12 mx-auto mb-1 cursor-pointer"
                style={{ transform: `rotate(${(deck.eq.low - 50) * 2.7}deg)` }}
              />
              <div className="text-xs text-gray-400">LOW</div>
            </div>
          </div>
        </div>

        {/* Tempo Control */}
        <div className="pioneer-eq-section p-3">
          <div className="text-xs text-center mb-2 text-gray-300">TEMPO</div>
          <div className="text-center mb-3">
            <div className="text-lg font-mono pioneer-led" style={{ color }}>
              {formatTempo(deck.tempo)}
            </div>
          </div>
          <div className="flex justify-center">
            <div className="pioneer-fader-track h-32 w-8 relative">
              <div 
                className="pioneer-fader-handle w-10 h-6 absolute -left-1"
                style={{ 
                  top: `${((50 - deck.tempo) / 100) * (128 - 24)}px`,
                }}
              />
            </div>
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
