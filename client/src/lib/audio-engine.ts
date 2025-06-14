export class AudioEngine {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private deckNodes: Map<string, any> = new Map();
  private crossfaderGainA: GainNode | null = null;
  private crossfaderGainB: GainNode | null = null;

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
    
    // Connect effects sends from EQ output
    highShelf.connect(reverbNode);
    reverbNode.connect(reverbGain);
    
    highShelf.connect(delayNode);
    delayNode.connect(delayGain);
    
    highShelf.connect(echoNode);
    echoNode.connect(echoGain);

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
}

export const audioEngine = new AudioEngine();
