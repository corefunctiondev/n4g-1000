export class AudioEffects {
  private context: AudioContext;
  private reverb: ConvolverNode | null = null;
  private delay: DelayNode | null = null;
  private delayFeedback: GainNode | null = null;
  private delayWet: GainNode | null = null;
  private reverbWet: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private initialized: boolean = false;

  constructor(context: AudioContext) {
    this.context = context;
    this.initializeEffects();
  }

  private async initializeEffects(): Promise<void> {
    if (this.initialized) return;

    // Create reverb with wet/dry control
    this.reverb = this.context.createConvolver();
    this.reverb.buffer = this.createReverbImpulse();
    this.reverbWet = this.context.createGain();
    this.reverbWet.gain.setValueAtTime(0, this.context.currentTime);

    // Create delay with feedback and wet/dry control
    this.delay = this.context.createDelay(1.0);
    this.delay.delayTime.setValueAtTime(0.25, this.context.currentTime);
    this.delayFeedback = this.context.createGain();
    this.delayFeedback.gain.setValueAtTime(0.3, this.context.currentTime);
    this.delayWet = this.context.createGain();
    this.delayWet.gain.setValueAtTime(0, this.context.currentTime);

    // Connect delay feedback loop
    this.delay.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delay);

    // Create filter
    this.filter = this.context.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.setValueAtTime(20000, this.context.currentTime);
    this.filter.Q.setValueAtTime(1, this.context.currentTime);

    this.initialized = true;
  }

  private createReverbImpulse(): AudioBuffer {
    const length = this.context.sampleRate * 2; // 2 seconds
    const impulse = this.context.createBuffer(2, length, this.context.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const decay = Math.pow(1 - i / length, 2);
        channelData[i] = (Math.random() * 2 - 1) * decay;
      }
    }
    
    return impulse;
  }

  getReverbNode(): ConvolverNode | null {
    return this.reverb;
  }

  getDelayNode(): DelayNode | null {
    return this.delay;
  }

  getFilterNode(): BiquadFilterNode | null {
    return this.filter;
  }

  getReverbWetNode(): GainNode | null {
    return this.reverbWet;
  }

  getDelayWetNode(): GainNode | null {
    return this.delayWet;
  }

  setDelayTime(time: number): void {
    if (this.delay) {
      this.delay.delayTime.setValueAtTime(time, this.context.currentTime);
    }
  }

  setDelayFeedback(feedback: number): void {
    if (this.delayFeedback) {
      this.delayFeedback.gain.setValueAtTime(feedback, this.context.currentTime);
    }
  }

  setDelayWet(wet: number): void {
    if (this.delayWet) {
      this.delayWet.gain.setValueAtTime(wet, this.context.currentTime);
    }
  }

  setReverbWet(wet: number): void {
    if (this.reverbWet) {
      this.reverbWet.gain.setValueAtTime(wet, this.context.currentTime);
    }
  }

  setFilterFrequency(frequency: number): void {
    if (this.filter) {
      this.filter.frequency.setValueAtTime(frequency, this.context.currentTime);
    }
  }

  // Connect effects chain
  connectEffects(source: AudioNode, destination: AudioNode): AudioNode {
    if (!this.initialized) return source;

    let currentNode = source;

    // Connect filter
    if (this.filter) {
      currentNode.connect(this.filter);
      currentNode = this.filter;
    }

    // Connect delay
    if (this.delay && this.delayWet) {
      currentNode.connect(this.delay);
      this.delay.connect(this.delayWet);
      this.delayWet.connect(destination);
    }

    // Connect reverb
    if (this.reverb && this.reverbWet) {
      currentNode.connect(this.reverb);
      this.reverb.connect(this.reverbWet);
      this.reverbWet.connect(destination);
    }

    // Connect dry signal
    currentNode.connect(destination);

    return currentNode;
  }
}
