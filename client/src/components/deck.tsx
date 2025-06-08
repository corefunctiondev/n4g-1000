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
    getAnalyser,
  } = useAudio(deckId);

  const [isDragOver, setIsDragOver] = useState(false);
  const [isDraggingTempo, setIsDraggingTempo] = useState(false);
  const [tempoRange, setTempoRange] = useState(8); // Default ±8%

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File input changed:', event.target.files);
    const file = event.target.files?.[0];
    if (file) {
      console.log('Selected file:', file.name, file.type, file.size);
      loadTrack(file);
      // Reset input to allow same file to be selected again
      event.target.value = '';
    } else {
      console.log('No file selected');
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
    event.preventDefault();
    setIsDraggingTempo(true);
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const y = e.clientY - rect.top;
      const height = rect.height;
      const percentage = Math.max(0, Math.min(1, (height - y) / height));
      const tempoValue = (percentage - 0.5) * 2 * tempoRange; // Convert to ±tempoRange%
      setTempo(tempoValue);
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
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
      className="pioneer-cdj p-2 flex-1 h-full flex flex-col"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Top Section - Screen and Info Display */}
      <div className="mb-2 flex-1">
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
              analyser={getAnalyser()}
              isPlaying={deck.isPlaying}
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

        {/* Consolidated Controls Row */}
        <div className="flex gap-1 mb-2 justify-center">
          <label className="pioneer-button py-1 px-2 text-xs cursor-pointer text-blue-400 hover:text-blue-300">
            LOAD TRACK
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          <button 
            className="pioneer-button py-1 px-2 text-xs text-purple-400 hover:text-purple-300"
            onClick={handleSync}
          >
            SYNC
          </button>
          <button 
            className={`pioneer-button py-1 px-2 text-xs ${
              deck.isLooping ? 'bg-green-500 text-white' : 'text-green-400 hover:bg-green-500'
            }`}
            onClick={toggleLoop}
          >
            LOOP
          </button>
        </div>
      </div>

      {/* Bottom Controls Section - Ultra Compact */}
      <div className="flex items-center justify-between gap-2 mb-2">
        {/* Play/Stop Controls */}
        <div className="flex gap-1">
          <button 
            onClick={handlePlayPause}
            className={`pioneer-button py-1 px-2 text-xs ${deck.isPlaying ? 'text-green-400' : 'text-green-400'}`}
          >
            <div className="text-sm">{deck.isPlaying ? '⏸' : '▶'}</div>
            <div className="text-xs">{deck.isPlaying ? 'PAUSE' : 'PLAY'}</div>
          </button>
          
          <button 
            onClick={stop}
            className="pioneer-button py-1 px-2 text-xs text-red-400"
          >
            <div className="text-sm">⏹</div>
            <div className="text-xs">STOP</div>
          </button>
        </div>

        {/* Tempo Control - Compact */}
        <div className="pioneer-eq-section p-1">
          <div className="text-xs text-center mb-1 text-gray-300">TEMPO</div>
          <div className="text-center mb-1">
            <div className="text-xs font-mono pioneer-led" style={{ color }}>
              {formatTempo(deck.tempo)}
            </div>
          </div>
          <div className="flex justify-center">
            <div 
              className="pioneer-fader-track h-10 w-4 relative cursor-pointer"
              onMouseDown={handleTempoMouseDown}
            >
              <div 
                className={`pioneer-fader-handle w-6 h-3 absolute -left-1 transition-colors ${
                  isDraggingTempo ? 'bg-blue-400' : ''
                }`}
                style={{ 
                  top: `${((tempoRange - deck.tempo) / (tempoRange * 2)) * (40 - 12)}px`,
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

      {/* File Upload Area - Compact */}
      <div className="mb-2">
        <label className={`block w-full p-2 border-2 border-dashed rounded-lg cursor-pointer transition-all text-center ${
          isDragOver 
            ? 'border-blue-400 bg-blue-400 bg-opacity-10' 
            : 'border-gray-600 hover:border-blue-400'
        }`}>
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <div className="text-xs text-gray-400">
            {isDragOver ? 'Drop your track here!' : 'Load Track'}
          </div>
        </label>
      </div>

      {/* Bottom Controls - Compact */}
      <div className="grid grid-cols-3 gap-1">
        <button className="pioneer-button py-1 text-xs">LOOP</button>
        <button className="pioneer-button py-1 text-xs">SLIP</button>
        <button className="pioneer-button py-1 text-xs">BEAT</button>
      </div>
    </div>
  );
}
