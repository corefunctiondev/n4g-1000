import { useState, useCallback, useRef, useEffect } from 'react';
import { DeckState, AudioTrack, AudioNodeSetup } from '@/types/audio';
import { audioEngine } from '@/lib/audio-engine';
import { BPMAnalyzer } from '@/lib/bpm-analyzer';

export function useAudio(deckId: 'A' | 'B') {
  const [deck, setDeck] = useState<DeckState>({
    track: null,
    isPlaying: false,
    isPaused: false,
    currentTime: 0,
    volume: 0.75,
    tempo: 0,
    pitch: 0,
    eq: { high: 0, mid: 0, low: 0 },
    cuePoints: [],
    isLooping: false,
    loopStart: 0,
    loopEnd: 0,
    isReady: false,
  });

  const audioNodes = useRef<AudioNodeSetup | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const initializeAudio = async () => {
      try {
        await audioEngine.initialize();
        // Create unique audio nodes for this deck instance
        audioNodes.current = audioEngine.createDeckNodes();
        audioEngine.registerDeckNodes(deckId, audioNodes.current);
        setDeck(prev => ({ ...prev, isReady: true }));
        console.log(`Deck ${deckId} initialized with independent audio nodes`);
      } catch (error) {
        console.error(`Failed to initialize deck ${deckId}:`, error);
      }
    };

    initializeAudio();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (sourceRef.current) {
        sourceRef.current.stop();
        sourceRef.current.disconnect();
      }
    };
  }, [deckId]);

  const updateCurrentTime = useCallback(() => {
    if (deck.isPlaying && audioNodes.current && deck.track) {
      const elapsed = audioEngine.getCurrentTime() - startTimeRef.current + pauseTimeRef.current;
      let currentTime = Math.min(elapsed, deck.track.duration);
      
      // Handle looping
      if (deck.isLooping && currentTime >= deck.loopEnd) {
        // Jump back to loop start
        const loopOffset = deck.loopStart;
        pauseTimeRef.current = loopOffset;
        startTimeRef.current = audioEngine.getCurrentTime();
        currentTime = loopOffset;
        
        // Restart audio source from loop point
        if (sourceRef.current) {
          sourceRef.current.stop();
          sourceRef.current.disconnect();
        }
        
        const source = audioEngine.createAudioSource(deck.track.audioBuffer!);
        source.connect(audioNodes.current.gainNode);
        source.start(0, loopOffset);
        sourceRef.current = source;
      }
      
      setDeck(prev => ({ ...prev, currentTime }));
      
      if (currentTime < deck.track.duration) {
        animationFrameRef.current = requestAnimationFrame(updateCurrentTime);
      } else {
        // Track finished
        setDeck(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
      }
    }
  }, [deck.isPlaying, deck.track, deck.isLooping, deck.loopStart, deck.loopEnd]);

  const loadTrack = useCallback(async (file: File) => {
    try {
      console.log(`Starting to load track on deck ${deckId}:`, file.name);
      
      // Ensure audio engine is initialized but don't reinitialize if already done
      if (!audioEngine.getContext()) {
        await audioEngine.initialize();
      }
      await audioEngine.resumeContext();
      
      console.log(`Audio engine ready, decoding file...`);
      const audioBuffer = await audioEngine.decodeAudioFile(file);
      console.log(`Audio decoded, duration: ${audioBuffer.duration}s`);
      
      console.log(`Analyzing BPM...`);
      const bpmAnalyzer = new BPMAnalyzer(audioEngine.getContext()!);
      const bpm = await bpmAnalyzer.analyzeBPM(audioBuffer);
      console.log(`BPM detected: ${bpm}`);
      
      const track: AudioTrack = {
        file,
        audioBuffer,
        name: file.name,
        duration: audioBuffer.duration,
        bpm,
        originalBpm: bpm, // Store original BPM for sync calculations
        waveformData: audioBuffer.getChannelData(0),
      };

      // Only create new audio nodes if we don't already have them
      if (!audioNodes.current) {
        audioNodes.current = audioEngine.createDeckNodes();
        audioEngine.registerDeckNodes(deckId, audioNodes.current);
        console.log(`New audio nodes created and registered for deck ${deckId}`);
      } else {
        console.log(`Using existing audio nodes for deck ${deckId}`);
      }

      setDeck(prev => ({
        ...prev,
        track,
        currentTime: 0,
        isPlaying: false,
        isPaused: false,
        isReady: true,
      }));

      console.log(`Track successfully loaded on deck ${deckId}:`, file.name, `BPM: ${bpm.toFixed(1)}`);
    } catch (error) {
      console.error(`Failed to load track on deck ${deckId}:`, error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
    }
  }, [deckId]);

  const play = useCallback(async () => {
    console.log(`Attempting to play track on deck ${deckId}`);
    console.log('Track available:', !!deck.track);
    console.log('Audio buffer available:', !!deck.track?.audioBuffer);
    console.log('Audio nodes available:', !!audioNodes.current);

    if (!deck.track?.audioBuffer) {
      console.error(`No audio buffer available for deck ${deckId}`);
      return;
    }

    if (!audioNodes.current) {
      console.error(`No audio nodes available for deck ${deckId}, initializing...`);
      // Try to initialize audio nodes if missing
      try {
        await audioEngine.initialize();
        audioNodes.current = audioEngine.createDeckNodes();
        audioEngine.registerDeckNodes(deckId, audioNodes.current);
        console.log(`Audio nodes initialized for deck ${deckId}`);
      } catch (error) {
        console.error(`Failed to initialize audio nodes for deck ${deckId}:`, error);
        return;
      }
    }

    try {
      await audioEngine.resumeContext();
      console.log(`Audio context resumed for deck ${deckId}`);

      // Stop current source if playing (only for this specific deck)
      if (sourceRef.current) {
        try {
          sourceRef.current.stop();
          sourceRef.current.disconnect();
        } catch (e) {
          // Source may already be stopped
        }
        sourceRef.current = null;
      }

      // Create new source for this deck only
      const source = audioEngine.createAudioSource(deck.track.audioBuffer);
      source.connect(audioNodes.current.gainNode);
      console.log(`Audio source created and connected for deck ${deckId}`);
      
      // Calculate start offset
      const offset = deck.isPaused ? pauseTimeRef.current : 0;
      console.log(`Starting playback with offset: ${offset}s`);
      
      // Apply tempo adjustment
      const playbackRate = 1 + (deck.tempo / 100);
      source.playbackRate.setValueAtTime(playbackRate, audioEngine.getCurrentTime());
      
      source.start(0, offset);
      sourceRef.current = source;
      startTimeRef.current = audioEngine.getCurrentTime();
      
      setDeck(prev => ({ ...prev, isPlaying: true, isPaused: false }));
      updateCurrentTime();
      
      console.log(`Playback started successfully on deck ${deckId}`);
      
    } catch (error) {
      console.error(`Failed to play track on deck ${deckId}:`, error);
    }
  }, [deck, deckId, updateCurrentTime]);

  const pause = useCallback(() => {
    if (sourceRef.current && deck.isPlaying) {
      sourceRef.current.stop();
      sourceRef.current.disconnect();
      sourceRef.current = null;
      
      pauseTimeRef.current = deck.currentTime;
      setDeck(prev => ({ ...prev, isPlaying: false, isPaused: true }));
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  }, [deck.isPlaying, deck.currentTime]);

  const stop = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.stop();
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    
    pauseTimeRef.current = 0;
    setDeck(prev => ({ 
      ...prev, 
      isPlaying: false, 
      isPaused: false, 
      currentTime: 0 
    }));
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  const cue = useCallback(() => {
    stop();
  }, [stop]);

  const setVolume = useCallback((volume: number) => {
    if (audioNodes.current) {
      audioNodes.current.gainNode.gain.setValueAtTime(
        volume,
        audioEngine.getCurrentTime()
      );
    }
    setDeck(prev => ({ ...prev, volume }));
  }, []);

  const setTempo = useCallback((tempo: number) => {
    const playbackRate = 1 + (tempo / 100);
    
    // Apply tempo change to current source if playing
    if (sourceRef.current && deck.isPlaying) {
      sourceRef.current.playbackRate.setValueAtTime(
        playbackRate,
        audioEngine.getCurrentTime()
      );
    }
    
    // Calculate new BPM based on tempo change using original BPM
    const originalBPM = deck.track?.originalBpm || deck.track?.bpm || 120;
    const newBPM = Math.round(originalBPM * playbackRate);
    
    setDeck(prev => ({ 
      ...prev, 
      tempo,
      // Update the track's displayed BPM while preserving original
      track: prev.track ? { 
        ...prev.track, 
        bpm: newBPM,
        originalBpm: prev.track.originalBpm || prev.track.bpm
      } : null
    }));
  }, [deck.isPlaying, deck.track]);

  const setEQ = useCallback((band: 'high' | 'mid' | 'low', value: number) => {
    if (audioNodes.current) {
      const gain = (value - 50) * 0.3; // Convert 0-100 to -15dB to +15dB
      audioNodes.current.eqNodes[band].gain.setValueAtTime(
        gain,
        audioEngine.getCurrentTime()
      );
    }
    // Also update via audio engine for mixer control
    audioEngine.setChannelEQ(deckId, band, value);
    
    setDeck(prev => ({
      ...prev,
      eq: { ...prev.eq, [band]: value }
    }));
  }, [deckId]);

  const seek = useCallback((time: number) => {
    if (deck.track && time >= 0 && time <= deck.track.duration) {
      pauseTimeRef.current = time;
      setDeck(prev => ({ ...prev, currentTime: time }));
      
      if (deck.isPlaying) {
        // Restart playback from new position
        pause();
        setTimeout(() => play(), 50);
      }
    }
  }, [deck.track, deck.isPlaying, pause, play]);

  const setCuePoint = useCallback((index: number) => {
    if (deck.track) {
      const newCuePoints = [...deck.cuePoints];
      newCuePoints[index] = deck.currentTime;
      setDeck(prev => ({ ...prev, cuePoints: newCuePoints }));
    }
  }, [deck.currentTime, deck.track]);

  const jumpToCue = useCallback((index: number) => {
    if (deck.cuePoints[index] !== undefined) {
      seek(deck.cuePoints[index]);
    }
  }, [deck.cuePoints, seek]);

  const setLoop = useCallback((start: number, end: number) => {
    setDeck(prev => ({ 
      ...prev, 
      loopStart: start, 
      loopEnd: end, 
      isLooping: true 
    }));
  }, []);

  const toggleLoop = useCallback(() => {
    if (!deck.isLooping && deck.track) {
      // Set default 4-beat loop from current position
      const beatDuration = 60 / deck.track.bpm;
      const loopLength = beatDuration * 4; // 4 beats
      const start = deck.currentTime;
      const end = Math.min(start + loopLength, deck.track.duration);
      
      setDeck(prev => ({ 
        ...prev, 
        isLooping: true,
        loopStart: start,
        loopEnd: end
      }));
    } else {
      setDeck(prev => ({ ...prev, isLooping: false }));
    }
  }, [deck.isLooping, deck.currentTime, deck.track]);

  const beatJump = useCallback((beats: number) => {
    if (deck.track) {
      const beatDuration = 60 / deck.track.bpm;
      const jumpTime = beats * beatDuration;
      const newTime = Math.max(0, Math.min(deck.track.duration, deck.currentTime + jumpTime));
      seek(newTime);
    }
  }, [deck.track, deck.currentTime, seek]);

  const sync = useCallback((targetDeck?: any) => {
    if (!deck.track) {
      console.log(`No track loaded on deck ${deckId} for sync`);
      return;
    }
    
    if (!targetDeck || !targetDeck.track) {
      console.log(`Target deck has no track loaded for sync`);
      return;
    }
    
    // Use original BPM for accurate sync calculations
    const currentOriginalBPM = deck.track.originalBpm || deck.track.bpm;
    const targetCurrentBPM = targetDeck.track.bpm; // Target's current BPM (includes tempo)
    
    // Calculate tempo adjustment needed to match target's current BPM
    const tempoAdjustment = ((targetCurrentBPM / currentOriginalBPM) - 1) * 100;
    
    // Clamp tempo adjustment to reasonable range
    const clampedTempo = Math.max(-50, Math.min(50, tempoAdjustment));
    
    // Apply the tempo adjustment
    setTempo(clampedTempo);
    
    console.log(`Deck ${deckId} synced: ${Math.round(currentOriginalBPM)} -> ${Math.round(targetCurrentBPM)} BPM (${clampedTempo.toFixed(1)}% tempo)`);
  }, [deckId, deck.track, setTempo]);

  return {
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
    getAnalyser: () => audioNodes.current?.analyser || null,
  };
}
