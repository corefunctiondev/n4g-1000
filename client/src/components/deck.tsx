import { useCallback, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAudio } from '@/hooks/use-audio';
import { Waveform } from './waveform';
import { Knob } from './knob';
import { Fader } from './fader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatabaseTrack } from '@/types/audio';

interface DeckProps {
  deckId: 'A' | 'B';
  color: string;
  otherDeckState?: any;
  onStateChange?: (state: any) => void;
  onPlaybackChange?: (deckId: 'A' | 'B', isPlaying: boolean) => void;
  playbackOrder?: ('A' | 'B')[];
}

export function Deck({ deckId, color, otherDeckState, onStateChange, onPlaybackChange, playbackOrder }: DeckProps) {
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

  const [isDraggingTempo, setIsDraggingTempo] = useState(false);
  const [tempoRange, setTempoRange] = useState(8); // Default ±8%
  const [selectedTrackId, setSelectedTrackId] = useState<string>('');

  // Fetch tracks from Supabase database
  const { data: tracks = [], isLoading: tracksLoading } = useQuery({
    queryKey: ['/api/tracks'],
    select: (data: DatabaseTrack[]) => data || []
  });

  // Share deck state with parent component for sync functionality
  useEffect(() => {
    if (onStateChange) {
      onStateChange(deck);
    }
  }, [deck, onStateChange]);

  // Track playback changes for smart sync
  useEffect(() => {
    if (onPlaybackChange) {
      onPlaybackChange(deckId, deck.isPlaying);
    }
  }, [deck.isPlaying, deckId, onPlaybackChange]);

  // Handle track selection from database
  const handleTrackSelect = useCallback(async (trackId: string) => {
    setSelectedTrackId(trackId);
    const selectedTrack = tracks.find(track => track.id.toString() === trackId);
    if (selectedTrack && selectedTrack.url) {
      try {
        const trackUrl = selectedTrack.url;
        console.log(`[${deckId}] Loading track: ${selectedTrack.name}`);
        console.log(`[${deckId}] Fetching from: ${trackUrl}`);
        
        // Fetch the audio file from the URL
        const response = await fetch(trackUrl);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const blob = await response.blob();
        console.log(`[${deckId}] Downloaded ${blob.size} bytes, type: ${blob.type}`);
        
        const file = new File([blob], selectedTrack.name + '.wav', { type: 'audio/wav' });
        console.log(`[${deckId}] Created File object, starting audio loading...`);
        
        await loadTrack(file, selectedTrack.bpm);
        console.log(`[${deckId}] ✓ Track loaded successfully: ${selectedTrack.name}`);
      } catch (error) {
        console.error(`[${deckId}] ✗ Error loading track:`, error);
        console.error(`[${deckId}] Track details:`, selectedTrack);
      }
    } else {
      console.error('Selected track not found or missing URL:', selectedTrack);
    }
  }, [tracks, loadTrack, deckId]);



  const handlePlayPause = useCallback(() => {
    if (deck.isPlaying) {
      pause();
    } else {
      play();
    }
  }, [deck.isPlaying, play, pause]);

  const handleSync = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log(`Sync button clicked on deck ${deckId}`);
    
    if (!playbackOrder || playbackOrder.length === 0) {
      console.log(`No decks are currently playing - sync requires a playing deck as reference`);
      return;
    }
    
    // Find the first deck that started playing (master deck)
    const masterDeckId = playbackOrder[0];
    
    if (masterDeckId === deckId) {
      console.log(`Deck ${deckId} is the master deck - cannot sync to itself`);
      return;
    }
    
    // Get the master deck's state
    const masterDeckState = masterDeckId === 'A' ? 
      (deckId === 'B' ? otherDeckState : null) : 
      (deckId === 'A' ? otherDeckState : null);
    
    if (masterDeckState && masterDeckState.track) {
      sync(masterDeckState);
      console.log(`Deck ${deckId} syncing to master deck ${masterDeckId} (${masterDeckState.track.bpm} BPM)`);
    } else {
      console.log(`Cannot sync - master deck ${masterDeckId} state not available`);
    }
  }, [sync, otherDeckState, deckId, playbackOrder]);

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
    const remainingSeconds = seconds % 60;
    const wholeSeconds = Math.floor(remainingSeconds);
    const decimals = Math.floor((remainingSeconds - wholeSeconds) * 10);
    return `${minutes.toString().padStart(2, '0')}:${wholeSeconds.toString().padStart(2, '0')}.${decimals}`;
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
      style={{ position: 'relative', zIndex: 1 }}
    >
      {/* Track Selection Dropdown - Top of CDJ */}
      <div className="mb-3" style={{ zIndex: 10, position: 'relative' }}>
        <div className="text-xs text-blue-300 mb-2 text-center">TRACK SELECTION</div>
        <Select value={selectedTrackId} onValueChange={handleTrackSelect}>
          <SelectTrigger className="w-full pioneer-button text-xs bg-gray-800 border-gray-600 text-gray-300">
            <SelectValue placeholder={tracksLoading ? "Loading tracks..." : "Select a track"} />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-600">
            {tracks.map((track) => (
              <SelectItem 
                key={track.id} 
                value={track.id.toString()}
                className="text-gray-300 hover:bg-gray-700"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{track.name}</span>
                  <span className="text-xs text-gray-400">
                    {track.artist} • {track.bpm} BPM
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Top Section - Screen and Info Display */}
      <div className="mb-2 flex-1">
        {/* Main LCD Screen */}
        <div className="pioneer-screen p-3 mb-3 h-full flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <div className="text-xs text-blue-300 font-mono">CDJ-3000</div>
            <div className="text-xs text-blue-300 font-mono">
              {deck.isReady ? 'READY' : 'LOADING'}
            </div>
          </div>
          
          {/* BPM and Bar Display */}
          <div className="flex justify-between items-center mb-2">
            <div className="text-orange-400 font-mono text-sm">
              {deck.track ? `${Math.floor(deck.currentTime / (60 / deck.track.bpm / 4))}.${Math.floor((deck.currentTime % (60 / deck.track.bpm / 4)) * 4) + 1}` : '0.1'} Bars
            </div>
            <div className="text-blue-300 font-mono text-sm">
              {deck.track ? `${Math.floor(deck.currentTime / (60 / deck.track.bpm))}.${Math.floor((deck.currentTime % (60 / deck.track.bpm)) * 4) + 1}` : '0.1'} Bars
            </div>
          </div>
          
          {/* Extended Waveform Display - Fill Available Space */}
          <div className="pioneer-waveform mb-2 relative" style={{ height: '140px' }}>
            <Waveform
              track={deck.track}
              currentTime={deck.currentTime}
              width={580}
              height={140}
              color={color}
              onSeek={seek}
              className="w-full h-full cursor-pointer"
              analyser={getAnalyser()}
              isPlaying={deck.isPlaying}
            />
            

            
            {/* Hot Cue Markers */}
            <div className="absolute bottom-0 left-0 right-0 h-2 flex">
              {[1, 2, 3, 4].map((cue) => (
                <div 
                  key={cue}
                  className="w-1 h-2 bg-blue-400 mr-4"
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
              <div className="text-xs text-gray-300">TRACK 01</div>
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
            <div className="flex justify-between items-center mt-2 text-xs text-gray-300">
              <span>A.HOT CUE</span>
              <span>{deck.track ? `${formatTempo(deck.tempo)}` : '+0.0%'}</span>
              <span>02:34</span>
            </div>
          </div>
        </div>



        {/* Controls Row */}
        <div className="flex gap-1 mb-2 justify-center" style={{ zIndex: 10, position: 'relative' }}>
          <button 
            className="pioneer-button py-1 px-2 text-xs text-purple-400 hover:text-purple-300"
            onClick={handleSync}
            style={{ 
              zIndex: 11, 
              pointerEvents: 'auto',
              position: 'relative',
              userSelect: 'none',
              touchAction: 'manipulation'
            }}
            type="button"
          >
            SYNC
          </button>
        </div>
      </div>

      {/* Bottom Controls Section - Ultra Compact */}
      <div className="flex items-center justify-between gap-2 mb-2">
        {/* Play/Stop Controls */}
        <div className="flex gap-1">
          <button 
            onClick={handlePlayPause}
            className={`pioneer-button py-1 px-2 text-xs ${deck.isPlaying ? 'text-blue-300' : 'text-blue-300'}`}
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
              className="pioneer-button py-1 text-xs hover:bg-blue-500 hover:text-white"
              onClick={resetTempo}
            >
              RESET
            </button>
          </div>
        </div>
      </div>



      {/* Bottom Controls - Compact */}
      <div className="grid grid-cols-3 gap-1">
        <button 
          className={`pioneer-button py-1 text-xs ${
            deck.isLooping ? 'bg-blue-500 text-white' : 'text-blue-300 hover:bg-blue-500'
          }`}
          onClick={toggleLoop}
        >
          LOOP
        </button>
        <button 
          className="pioneer-button py-1 text-xs text-blue-300 hover:bg-blue-500"
          onClick={() => beatJump(-1)}
        >
          SLIP
        </button>
        <button 
          className="pioneer-button py-1 text-xs text-orange-400 hover:bg-orange-500"
          onClick={() => beatJump(1)}
        >
          BEAT
        </button>
      </div>
    </div>
  );
}
