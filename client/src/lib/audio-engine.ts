export class AudioEngine {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private deckNodes: Map<string, any> = new Map();
  private crossfaderGainA: GainNode | null = null;
  private crossfaderGainB: GainNode | null = null;
  private beatAlignment: Map<string, { nextBeat: number; bpm: number; isPlaying: boolean }> = new Map();
  private syncEnabled: boolean = false;

  async initialize(): Promise<void> {
    try {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create master chain
      this.masterGain = this.context.createGain();
      this.compressor = this.context.createDynamicsCompressor();
      
      // Create crossfader gain nodes for each deck
      this.crossfaderGainA = this.context.createGain();
      this.crossfaderGainB = this.context.createGain();
      
      // Set up compressor
      this.compressor.threshold.setValueAtTime(-24, this.context.currentTime);
      this.compressor.knee.setValueAtTime(30, this.context.currentTime);
      this.compressor.ratio.setValueAtTime(12, this.context.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.context.currentTime);
      this.compressor.release.setValueAtTime(0.25, this.context.currentTime);
      
      // Connect master chain: crossfader gains → master → compressor → output
      this.crossfaderGainA.connect(this.masterGain);
      this.crossfaderGainB.connect(this.masterGain);
      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.context.destination);
      
      // Initialize crossfader to center position
      this.crossfaderGainA.gain.setValueAtTime(0.707, this.context.currentTime); // ~50%
      this.crossfaderGainB.gain.setValueAtTime(0.707, this.context.currentTime); // ~50%
      
      console.log('Audio engine initialized');
    } catch (error) {
      console.error('Failed to initialize audio engine:', error);
      throw error;
    }
  }

  async resumeContext(): Promise<void> {
    if (this.context && this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  getContext(): AudioContext | null {
    return this.context;
  }

  getMasterGain(): GainNode | null {
    return this.masterGain;
  }

  async decodeAudioFile(file: File): Promise<AudioBuffer> {
    if (!this.context) {
      throw new Error('Audio context not initialized');
    }

    const arrayBuffer = await file.arrayBuffer();
    return await this.context.decodeAudioData(arrayBuffer);
  }

  createDeckNodes(): {
    source: AudioBufferSourceNode | null;
    gainNode: GainNode;
    eqNodes: {
      high: BiquadFilterNode;
      mid: BiquadFilterNode;
      low: BiquadFilterNode;
    };
    reverbGain: GainNode;
    delayGain: GainNode;
    echoGain: GainNode;
    reverbNode: ConvolverNode;
    delayNode: DelayNode;
    echoNode: DelayNode;
    analyser: AnalyserNode;
    dryGain: GainNode;
    wetGain: GainNode;
    effectsMix: GainNode;
    delayFeedback: GainNode;
    echoFeedback: GainNode;
  } {
    if (!this.context) {
      throw new Error('Audio context not initialized');
    }

    const gainNode = this.context.createGain();
    const analyser = this.context.createAnalyser();
    
    // Create EQ nodes
    const highShelf = this.context.createBiquadFilter();
    const midPeaking = this.context.createBiquadFilter();
    const lowShelf = this.context.createBiquadFilter();

    // Create effects nodes
    const reverbGain = this.context.createGain();
    const delayGain = this.context.createGain();
    const echoGain = this.context.createGain();
    const reverbNode = this.context.createConvolver();
    const delayNode = this.context.createDelay(1.0);
    const echoNode = this.context.createDelay(1.0);
    
    // Create reverb impulse response
    const impulseLength = this.context.sampleRate * 2; // 2 seconds
    const impulse = this.context.createBuffer(2, impulseLength, this.context.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < impulseLength; i++) {
        const decay = Math.pow(1 - i / impulseLength, 2);
        channelData[i] = (Math.random() * 2 - 1) * decay * 0.5;
      }
    }
    reverbNode.buffer = impulse;
    
    // Configure delay
    delayNode.delayTime.setValueAtTime(0.25, this.context.currentTime);
    
    // Configure echo (longer delay)
    echoNode.delayTime.setValueAtTime(0.5, this.context.currentTime);

    // Configure EQ
    highShelf.type = 'highshelf';
    highShelf.frequency.setValueAtTime(10000, this.context.currentTime);
    highShelf.gain.setValueAtTime(0, this.context.currentTime);

    midPeaking.type = 'peaking';
    midPeaking.frequency.setValueAtTime(1000, this.context.currentTime);
    midPeaking.Q.setValueAtTime(1, this.context.currentTime);
    midPeaking.gain.setValueAtTime(0, this.context.currentTime);

    lowShelf.type = 'lowshelf';
    lowShelf.frequency.setValueAtTime(100, this.context.currentTime);
    lowShelf.gain.setValueAtTime(0, this.context.currentTime);

    // Configure analyser
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;

    // Initialize effects to 0
    reverbGain.gain.setValueAtTime(0, this.context.currentTime);
    delayGain.gain.setValueAtTime(0, this.context.currentTime);
    echoGain.gain.setValueAtTime(0, this.context.currentTime);

    // Connect the main chain: source → gain → EQ → analyser
    gainNode.connect(lowShelf);
    lowShelf.connect(midPeaking);
    midPeaking.connect(highShelf);
    highShelf.connect(analyser);
    
    // Create dry/wet mixer for effects
    const dryGain = this.context.createGain();
    const wetGain = this.context.createGain();
    const effectsMix = this.context.createGain();
    
    // Create feedback for delay/echo
    const delayFeedback = this.context.createGain();
    const echoFeedback = this.context.createGain();
    
    // Set initial levels
    dryGain.gain.setValueAtTime(1.0, this.context.currentTime);
    wetGain.gain.setValueAtTime(0.0, this.context.currentTime);
    delayFeedback.gain.setValueAtTime(0.35, this.context.currentTime);
    echoFeedback.gain.setValueAtTime(0.45, this.context.currentTime);
    
    // Main signal path: EQ → dry gain → effects mix
    highShelf.connect(dryGain);
    dryGain.connect(effectsMix);
    
    // Reverb path: EQ → reverb → reverb gain → wet gain → effects mix
    highShelf.connect(reverbNode);
    reverbNode.connect(reverbGain);
    reverbGain.connect(wetGain);
    wetGain.connect(effectsMix);
    
    // Delay path with feedback: EQ → delay → delay gain + feedback → delay
    highShelf.connect(delayNode);
    delayNode.connect(delayGain);
    delayNode.connect(delayFeedback);
    delayFeedback.connect(delayNode);
    delayGain.connect(effectsMix);
    
    // Echo path with feedback: EQ → echo → echo gain + feedback → echo  
    highShelf.connect(echoNode);
    echoNode.connect(echoGain);
    echoNode.connect(echoFeedback);
    echoFeedback.connect(echoNode);
    echoGain.connect(effectsMix);
    
    // Connect effects mix to analyser for final output
    effectsMix.connect(analyser);

    return {
      source: null,
      gainNode,
      eqNodes: {
        high: highShelf,
        mid: midPeaking,
        low: lowShelf,
      },
      reverbGain,
      delayGain,
      echoGain,
      reverbNode,
      delayNode,
      echoNode,
      analyser,
      dryGain,
      wetGain,
      effectsMix,
      delayFeedback,
      echoFeedback,
    };
  }

  createAudioSource(audioBuffer: AudioBuffer): AudioBufferSourceNode {
    if (!this.context) {
      throw new Error('Audio context not initialized');
    }

    const source = this.context.createBufferSource();
    source.buffer = audioBuffer;
    source.loop = false;
    
    return source;
  }

  registerDeckNodes(deckId: string, nodes: any): void {
    // Disconnect any existing connections for this deck
    const existingNodes = this.deckNodes.get(deckId);
    if (existingNodes) {
      try {
        existingNodes.analyser.disconnect();
        existingNodes.reverbGain.disconnect();
        existingNodes.delayGain.disconnect();
        existingNodes.echoGain.disconnect();
      } catch (e) {
        // Ignore disconnect errors
      }
    }
    
    this.deckNodes.set(deckId, nodes);
    
    // Connect each deck to its dedicated crossfader gain node
    if (deckId === 'A' && this.crossfaderGainA) {
      // Connect main signal
      nodes.analyser.connect(this.crossfaderGainA);
      // Connect effects
      nodes.reverbGain.connect(this.crossfaderGainA);
      nodes.delayGain.connect(this.crossfaderGainA);
      nodes.echoGain.connect(this.crossfaderGainA);
      console.log('Deck A connected to crossfader A with effects');
    } else if (deckId === 'B' && this.crossfaderGainB) {
      // Connect main signal
      nodes.analyser.connect(this.crossfaderGainB);
      // Connect effects
      nodes.reverbGain.connect(this.crossfaderGainB);
      nodes.delayGain.connect(this.crossfaderGainB);
      nodes.echoGain.connect(this.crossfaderGainB);
      console.log('Deck B connected to crossfader B with effects');
    }
  }

  getDeckNodes(deckId: string): any {
    return this.deckNodes.get(deckId);
  }

  setCrossfader(value: number): void {
    if (this.context && this.crossfaderGainA && this.crossfaderGainB) {
      const fadePosition = value / 100;
      const volumeA = Math.cos(fadePosition * Math.PI / 2);
      const volumeB = Math.sin(fadePosition * Math.PI / 2);
      
      this.crossfaderGainA.gain.setValueAtTime(volumeA, this.context.currentTime);
      this.crossfaderGainB.gain.setValueAtTime(volumeB, this.context.currentTime);
    }
  }

  setChannelEQ(deckId: string, band: 'high' | 'mid' | 'low', value: number): void {
    const nodes = this.deckNodes.get(deckId);
    if (nodes && this.context) {
      const gain = (value - 50) * 0.3;
      nodes.eqNodes[band].gain.setValueAtTime(gain, this.context.currentTime);
    }
  }

  setChannelVolume(deckId: string, volume: number): void {
    const nodes = this.deckNodes.get(deckId);
    if (nodes && this.context) {
      nodes.gainNode.gain.setValueAtTime(volume / 100, this.context.currentTime);
    }
  }

  setMasterVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(volume, this.context!.currentTime);
    }
  }

  setTempo(deckId: string, tempoPercent: number): void {
    const nodes = this.deckNodes.get(deckId);
    if (nodes && nodes.source && this.context) {
      // Apply tempo change by adjusting playback rate
      const tempoMultiplier = 1 + (tempoPercent / 100);
      if (nodes.source.playbackRate) {
        nodes.source.playbackRate.setValueAtTime(tempoMultiplier, this.context.currentTime);
      }
    }
  }

  getCurrentTime(): number {
    return this.context?.currentTime || 0;
  }

  getDeckBPM(deckId: string): { bpm: number; tempo: number } | null {
    // This will be called from the useAudio hook with actual deck state
    // For now, return default values - the hook will override with real values
    return { bpm: 120, tempo: 1 };
  }

  // Beat detection and alignment system
  updateBeatInfo(deckId: string, bpm: number, currentTime: number, isPlaying: boolean): void {
    if (!this.context) return;
    
    const beatDuration = 60 / bpm; // seconds per beat
    const currentContextTime = this.context.currentTime;
    
    // Calculate next beat time based on current playback position
    const beatsElapsed = Math.floor(currentTime / beatDuration);
    const nextBeatOffset = (beatsElapsed + 1) * beatDuration - currentTime;
    const nextBeat = currentContextTime + nextBeatOffset;
    
    this.beatAlignment.set(deckId, {
      nextBeat,
      bpm,
      isPlaying
    });
    
    // Check if both decks are playing and trigger auto-sync
    this.checkDualPlaybackSync();
  }

  private checkDualPlaybackSync(): void {
    const deckA = this.beatAlignment.get('A');
    const deckB = this.beatAlignment.get('B');
    
    if (deckA?.isPlaying && deckB?.isPlaying && !this.syncEnabled) {
      this.performBeatAlignment();
      this.syncEnabled = true;
      console.log('🎛️ AUTO-SYNC: Both decks playing - activating beat alignment');
    } else if ((!deckA?.isPlaying || !deckB?.isPlaying) && this.syncEnabled) {
      this.syncEnabled = false;
      console.log('🎛️ AUTO-SYNC: Single deck playing - beat alignment disabled');
    }
  }

  private performBeatAlignment(): void {
    const deckA = this.beatAlignment.get('A');
    const deckB = this.beatAlignment.get('B');
    
    if (!deckA || !deckB || !this.context) return;
    
    // Determine master and slave deck based on BPM stability or user preference
    // For now, use deck A as master
    const masterDeck = deckA;
    const slaveDeck = deckB;
    const slaveId = 'B';
    
    // Calculate BPM difference and apply tempo adjustment
    const bpmDifference = masterDeck.bpm - slaveDeck.bpm;
    const tempoAdjustment = (bpmDifference / slaveDeck.bpm) * 100;
    
    // Apply gradual tempo adjustment to slave deck
    this.setTempo(slaveId, tempoAdjustment);
    
    // Calculate beat alignment offset
    const beatTimeDiff = masterDeck.nextBeat - slaveDeck.nextBeat;
    const maxOffset = 0.1; // Maximum 100ms adjustment
    
    if (Math.abs(beatTimeDiff) > 0.01 && Math.abs(beatTimeDiff) < maxOffset) {
      // Apply micro-timing adjustment to align kicks
      const nodes = this.deckNodes.get(slaveId);
      if (nodes?.source?.playbackRate) {
        const microAdjustment = beatTimeDiff * 0.02; // Subtle timing nudge
        const currentRate = nodes.source.playbackRate.value;
        nodes.source.playbackRate.setValueAtTime(
          currentRate + microAdjustment, 
          this.context.currentTime
        );
        
        // Return to normal rate after adjustment
        nodes.source.playbackRate.setValueAtTime(
          currentRate, 
          this.context.currentTime + 0.05
        );
      }
    }
    
    console.log(`🎯 BEAT MATCH: Deck B synced to Deck A | BPM: ${masterDeck.bpm.toFixed(1)} | Offset: ${(beatTimeDiff * 1000).toFixed(1)}ms`);
  }

  // Manual sync trigger for SYNC button
  syncToMasterDeck(slaveDeckId: string, masterDeckId: string): void {
    const masterDeck = this.beatAlignment.get(masterDeckId);
    const slaveDeck = this.beatAlignment.get(slaveDeckId);
    
    if (!masterDeck || !slaveDeck || !this.context) return;
    
    // Calculate and apply BPM matching
    const bpmRatio = masterDeck.bpm / slaveDeck.bpm;
    const tempoAdjustment = (bpmRatio - 1) * 100;
    
    this.setTempo(slaveDeckId, tempoAdjustment);
    
    console.log(`🔄 MANUAL SYNC: Deck ${slaveDeckId} synced to Deck ${masterDeckId} | Target BPM: ${masterDeck.bpm.toFixed(1)}`);
  }

  // Reset sync when tracks stop
  resetBeatAlignment(deckId: string): void {
    this.beatAlignment.delete(deckId);
    this.syncEnabled = false;
  }

  setDelayEffect(deckId: string, level: number, delayTime?: number): void {
    const nodes = this.deckNodes.get(deckId);
    if (nodes && this.context) {
      const wetLevel = level / 100;
      const time = delayTime || 0.25;
      
      // Set delay time and wet level
      nodes.delayNode.delayTime.setTargetAtTime(time, this.context.currentTime, 0.01);
      nodes.delayGain.gain.setTargetAtTime(wetLevel * 0.8, this.context.currentTime, 0.01);
      
      // Adjust dry/wet balance
      if (nodes.dryGain && nodes.wetGain) {
        const dryLevel = Math.sqrt(1 - wetLevel * wetLevel);
        nodes.dryGain.gain.setTargetAtTime(dryLevel, this.context.currentTime, 0.01);
        nodes.wetGain.gain.setTargetAtTime(wetLevel * 0.3, this.context.currentTime, 0.01);
      }
      
      console.log(`[${deckId}] Delay: ${level}%, Time: ${time.toFixed(3)}s`);
    }
  }

  setEchoEffect(deckId: string, level: number, echoTime?: number): void {
    const nodes = this.deckNodes.get(deckId);
    if (nodes && this.context) {
      const wetLevel = level / 100;
      const time = echoTime || 0.375;
      
      // Set echo time and wet level  
      nodes.echoNode.delayTime.setTargetAtTime(time, this.context.currentTime, 0.01);
      nodes.echoGain.gain.setTargetAtTime(wetLevel * 0.7, this.context.currentTime, 0.01);
      
      // Adjust feedback for echo character
      if (nodes.echoFeedback) {
        nodes.echoFeedback.gain.setTargetAtTime(0.45 * wetLevel, this.context.currentTime, 0.01);
      }
      
      console.log(`[${deckId}] Echo: ${level}%, Time: ${time.toFixed(3)}s`);
    }
  }

  setReverbEffect(deckId: string, level: number): void {
    const nodes = this.deckNodes.get(deckId);
    if (nodes && this.context) {
      const wetLevel = level / 100;
      
      // Set reverb wet level
      nodes.reverbGain.gain.setTargetAtTime(wetLevel * 0.5, this.context.currentTime, 0.01);
      
      // Adjust overall wet gain for reverb
      if (nodes.wetGain) {
        nodes.wetGain.gain.setTargetAtTime(wetLevel * 0.4, this.context.currentTime, 0.01);
      }
      
      console.log(`[${deckId}] Reverb: ${level}%`);
    }
  }
}

export const audioEngine = new AudioEngine();
