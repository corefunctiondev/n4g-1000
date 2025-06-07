export class AudioEngine {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;

  async initialize(): Promise<void> {
    try {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create master chain
      this.masterGain = this.context.createGain();
      this.compressor = this.context.createDynamicsCompressor();
      
      // Set up compressor
      this.compressor.threshold.setValueAtTime(-24, this.context.currentTime);
      this.compressor.knee.setValueAtTime(30, this.context.currentTime);
      this.compressor.ratio.setValueAtTime(12, this.context.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.context.currentTime);
      this.compressor.release.setValueAtTime(0.25, this.context.currentTime);
      
      // Connect master chain
      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.context.destination);
      
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

    // Connect the chain
    gainNode.connect(lowShelf);
    lowShelf.connect(midPeaking);
    midPeaking.connect(highShelf);
    highShelf.connect(analyser);
    analyser.connect(this.masterGain!);

    return {
      source: null,
      gainNode,
      eqNodes: {
        high: highShelf,
        mid: midPeaking,
        low: lowShelf,
      },
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

  setMasterVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(volume, this.context!.currentTime);
    }
  }

  getCurrentTime(): number {
    return this.context?.currentTime || 0;
  }
}

export const audioEngine = new AudioEngine();
