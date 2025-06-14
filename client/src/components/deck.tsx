import { useCallback, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAudio } from '@/hooks/use-audio';
import { useAudioFeedback } from '@/hooks/use-audio-feedback';
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
    setReverb,
    setDelay,
    setEcho,
    cutFX,
  } = useAudio(deckId);
  
  const audioFeedback = useAudioFeedback();

  const [isDraggingTempo, setIsDraggingTempo] = useState(false);
  const [tempoRange, setTempoRange] = useState(8); // Default ±8%
  const [selectedTrackId, setSelectedTrackId] = useState<string>('');
  const [isLoadingTrack, setIsLoadingTrack] = useState(false);

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
        setIsLoadingTrack(true);
        
        // Always stop current track when loading new one
        if (deck.isPlaying || deck.isPaused) {
          console.log(`[${deckId}] Stopping current track to load new one`);
          stop(); // Use stop() to completely reset state
          // Wait for stop to fully complete
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
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
        console.log(`[${deckId}] Track ready - press PLAY to start`);
        
        setIsLoadingTrack(false);
      } catch (error) {
        setIsLoadingTrack(false);
        console.error(`[${deckId}] ✗ Error loading track:`, error);
        console.error(`[${deckId}] Track details:`, selectedTrack);
      }
    } else {
      console.error('Selected track not found or missing URL:', selectedTrack);
    }
  }, [tracks, loadTrack, deckId, deck.isPlaying, deck.isPaused, stop]);



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
    
    // Check if this deck has a track loaded
    if (!deck.track) {
      console.log(`Deck ${deckId} has no track loaded for sync`);
      return;
    }
    
    // Check if other deck has a track loaded
    if (!otherDeckState || !otherDeckState.track) {
      console.log(`Other deck has no track loaded for sync`);
      return;
    }
    
    // Perform beatmatching - sync this deck to the other deck's BPM
    sync(otherDeckState);
    
    const currentBPM = deck.track.bpm * (1 + (deck.tempo / 100));
    const targetBPM = otherDeckState.track.bpm * (1 + (otherDeckState.tempo / 100));
    
    console.log(`Beatmatching: Deck ${deckId} (${currentBPM.toFixed(1)} BPM) syncing to other deck (${targetBPM.toFixed(1)} BPM)`);
  }, [sync, otherDeckState, deckId, deck.track, deck.tempo]);

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

  // Update parent component with deck state including analyser for beat visualization
  useEffect(() => {
    const analyser = getAnalyser();
    const state = {
      ...deck,
      analyser,
      tempo: deck.tempo,
      isPlaying: deck.isPlaying,
      track: deck.track
    };
    onStateChange?.(state);
  }, [deck, getAnalyser, onStateChange]);

  // Update parent with playback changes for beat visualization
  useEffect(() => {
    onPlaybackChange?.(deckId, deck.isPlaying);
  }, [deck.isPlaying, deckId, onPlaybackChange]);



  return (
    <div 
      className="pioneer-cdj p-2 flex-1 h-full flex flex-col"
      style={{ position: 'relative', zIndex: 1 }}
    >
      {/* Track Selection Dropdown - Top of CDJ */}
      <div className="mb-3" style={{ zIndex: 10, position: 'relative' }}>
        <div className="text-xs text-blue-300 mb-2 text-center">TRACK SELECTION</div>
        <Select value={selectedTrackId} onValueChange={handleTrackSelect} disabled={isLoadingTrack}>
          <SelectTrigger className="w-full pioneer-button text-xs bg-gray-800 border-gray-600 text-gray-300">
            {isLoadingTrack ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border border-blue-300 border-t-transparent rounded-full animate-spin"></div>
                <span>Loading track...</span>
              </div>
            ) : (
              <SelectValue placeholder={tracksLoading ? "Loading tracks..." : "Select a track"} />
            )}
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

      {/* Black LCD Screen Area - Only Waveform and Digital Info */}
      <div className="pioneer-screen p-3 mb-3" style={{ height: '240px' }}>
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
        
        {/* Waveform Display */}
        <div className="pioneer-waveform mb-2 relative" style={{ height: '100px' }}>
          <Waveform
            track={deck.track}
            currentTime={deck.currentTime}
            width={480}
            height={100}
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
              {deck.track?.name?.replace(/\.wav$/i, '') || 'No Track Loaded'}
            </div>
            <div className="text-xs text-gray-300">TRACK 01</div>
          </div>
          
          <div className="flex justify-between items-center text-xs">
            <div className="text-orange-400 font-mono">
              {formatTime(deck.currentTime)}
            </div>
            <div className="pioneer-led text-center w-[50px] flex-shrink-0" style={{ color }}>
              <div className="text-xs font-bold">
                {deck.track ? formatBPM(deck.track.bpm) : '---'}
              </div>
              <div className="text-[10px]">BPM</div>
            </div>
            <div className="text-orange-400 font-mono">
              -{deck.track ? formatTime(deck.track.duration - deck.currentTime) : '--:--'}
            </div>
          </div>
          
          {/* Controls Row - Inside Black Screen */}
          <div className="flex justify-between items-center mt-2 text-xs">
            <div className="flex gap-2">
              <button 
                className="pioneer-button py-1 px-2 text-xs text-purple-400 hover:text-purple-300"
                onClick={handleSync}
                type="button"
              >
                SYNC
              </button>
              <button 
                className="pioneer-button py-1 px-2 text-xs text-red-400 hover:text-red-300"
                onClick={() => {
                  cutFX();
                  audioFeedback?.playClick();
                }}
                type="button"
              >
                CUT FX
              </button>
            </div>
            
            <div className="text-gray-300">
              <span>A.HOT CUE</span>
            </div>
            
            <div className="text-orange-400 font-mono">
              {deck.track ? `${formatTempo(deck.tempo)}` : '+0.0%'}
            </div>
            
            <div className="text-blue-300 font-mono">
              02:34
            </div>
          </div>
        </div>
      </div>

      {/* Gray CDJ Area - Effects and Transport Controls */}
      <div className="p-3 bg-gray-800 rounded border border-gray-700 mt-4">
        {/* Effects Controls - Gray Area */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-gray-900/50 border border-gray-600 rounded p-1 text-xs flex flex-col items-center">
            <div className="text-purple-300 text-center mb-1 font-bold text-[10px]">REVERB</div>
            <Knob
              value={deck.effects.reverb}
              min={0}
              max={100}
              onChange={setReverb}
              size="sm"
              className="mb-1"
            />
            <div className="text-purple-200 text-[8px]">{deck.effects.reverb}%</div>
          </div>
          <div className="bg-gray-900/50 border border-gray-600 rounded p-1 text-xs flex flex-col items-center">
            <div className="text-green-300 text-center mb-1 font-bold text-[10px]">DELAY</div>
            <Knob
              value={deck.effects.delay}
              min={0}
              max={100}
              onChange={setDelay}
              size="sm"
              className="mb-1"
            />
            <div className="text-green-200 text-[8px]">{deck.effects.delay}%</div>
          </div>
          <div className="bg-gray-900/50 border border-gray-600 rounded p-1 text-xs flex flex-col items-center">
            <div className="text-cyan-300 text-center mb-1 font-bold text-[10px]">ECHO</div>
            <Knob
              value={deck.effects.echo}
              min={0}
              max={100}
              onChange={setEcho}
              size="sm"
              className="mb-1"
            />
            <div className="text-cyan-200 text-[8px]">{deck.effects.echo}%</div>
          </div>
        </div>

        {/* Play/Stop/SYNC/CUT FX Controls - Gray Area */}
        <div className="flex justify-center gap-2">
          <button 
            onClick={handlePlayPause}
            className={`pioneer-button py-2 px-3 text-xs ${deck.isPlaying ? 'text-blue-300' : 'text-blue-300'}`}
          >
            <div className="text-sm">{deck.isPlaying ? '⏸' : '▶'}</div>
            <div className="text-xs">{deck.isPlaying ? 'PAUSE' : 'PLAY'}</div>
          </button>
          
          <button 
            onClick={stop}
            className="pioneer-button py-2 px-3 text-xs text-red-400"
          >
            <div className="text-sm">⏹</div>
            <div className="text-xs">STOP</div>
          </button>
          
          <button 
            className="pioneer-button py-2 px-3 text-xs text-purple-400 hover:text-purple-300"
            onClick={handleSync}
            type="button"
          >
            <div className="text-sm">⚡</div>
            <div className="text-xs">SYNC</div>
          </button>
          
          <button 
            className="pioneer-button py-2 px-3 text-xs text-red-400 hover:text-red-300"
            onClick={() => {
              cutFX();
              audioFeedback?.playClick();
            }}
            type="button"
          >
            <div className="text-sm">✂</div>
            <div className="text-xs">CUT FX</div>
          </button>
        </div>
      </div>
    </div>
  );
}
