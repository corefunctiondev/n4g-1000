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
        audioNodes.current = audioEngine.createDeckNodes();
        setDeck(prev => ({ ...prev, isReady: true }));
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
      const currentTime = Math.min(elapsed, deck.track.duration);
      
      setDeck(prev => ({ ...prev, currentTime }));
      
      if (currentTime < deck.track.duration) {
        animationFrameRef.current = requestAnimationFrame(updateCurrentTime);
      } else {
        // Track finished
        setDeck(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
      }
    }
  }, [deck.isPlaying, deck.track]);

  const loadTrack = useCallback(async (file: File) => {
    try {
      await audioEngine.resumeContext();
      
      const audioBuffer = await audioEngine.decodeAudioFile(file);
      const bpmAnalyzer = new BPMAnalyzer(audioEngine.getContext()!);
      const bpm = await bpmAnalyzer.analyzeBPM(audioBuffer);
      
      const track: AudioTrack = {
        file,
        audioBuffer,
        name: file.name,
        duration: audioBuffer.duration,
        bpm,
        waveformData: audioBuffer.getChannelData(0),
      };

      setDeck(prev => ({
        ...prev,
        track,
        currentTime: 0,
        isPlaying: false,
        isPaused: false,
      }));

      console.log(`Track loaded on deck ${deckId}:`, file.name, `BPM: ${bpm}`);
    } catch (error) {
      console.error(`Failed to load track on deck ${deckId}:`, error);
    }
  }, [deckId]);

  const play = useCallback(async () => {
    if (!deck.track?.audioBuffer || !audioNodes.current) return;

    try {
      await audioEngine.resumeContext();

      // Stop current source if playing
      if (sourceRef.current) {
        sourceRef.current.stop();
        sourceRef.current.disconnect();
      }

      // Create new source
      const source = audioEngine.createAudioSource(deck.track.audioBuffer);
      source.connect(audioNodes.current.gainNode);
      
      // Calculate start offset
      const offset = deck.isPaused ? pauseTimeRef.current : 0;
      
      // Apply tempo adjustment
      const playbackRate = 1 + (deck.tempo / 100);
      source.playbackRate.setValueAtTime(playbackRate, audioEngine.getCurrentTime());
      
      source.start(0, offset);
      sourceRef.current = source;
      startTimeRef.current = audioEngine.getCurrentTime();
      
      setDeck(prev => ({ ...prev, isPlaying: true, isPaused: false }));
      updateCurrentTime();
      
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
    if (sourceRef.current && deck.isPlaying) {
      const playbackRate = 1 + (tempo / 100);
      sourceRef.current.playbackRate.setValueAtTime(
        playbackRate,
        audioEngine.getCurrentTime()
      );
    }
    setDeck(prev => ({ ...prev, tempo }));
  }, [deck.isPlaying]);

  const setEQ = useCallback((band: 'high' | 'mid' | 'low', value: number) => {
    if (audioNodes.current) {
      const gain = (value - 50) * 0.3; // Convert 0-100 to -15dB to +15dB
      audioNodes.current.eqNodes[band].gain.setValueAtTime(
        gain,
        audioEngine.getCurrentTime()
      );
    }
    setDeck(prev => ({
      ...prev,
      eq: { ...prev.eq, [band]: value }
    }));
  }, []);

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
    setDeck(prev => ({ ...prev, isLooping: !prev.isLooping }));
  }, []);

  const beatJump = useCallback((beats: number) => {
    if (deck.track) {
      const beatDuration = 60 / deck.track.bpm;
      const jumpTime = beats * beatDuration;
      const newTime = Math.max(0, Math.min(deck.track.duration, deck.currentTime + jumpTime));
      seek(newTime);
    }
  }, [deck.track, deck.currentTime, seek]);

  const sync = useCallback(() => {
    // Sync to master tempo - would connect to other deck in real implementation
    console.log(`Syncing deck ${deckId} to master tempo`);
  }, [deckId]);

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
