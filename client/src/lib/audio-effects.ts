export class AudioEffects {
  private context: AudioContext;
  private reverb: ConvolverNode | null = null;
  private delay: DelayNode | null = null;
  private filter: BiquadFilterNode | null = null;

  constructor(context: AudioContext) {
    this.context = context;
    this.initializeEffects();
  }

  private async initializeEffects(): Promise<void> {
    // Create reverb impulse response
    this.reverb = this.context.createConvolver();
    this.reverb.buffer = this.createReverbImpulse();

    // Create delay
    this.delay = this.context.createDelay(1.0);
    this.delay.delayTime.setValueAtTime(0.3, this.context.currentTime);

    // Create filter
    this.filter = this.context.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.setValueAtTime(1000, this.context.currentTime);
    this.filter.Q.setValueAtTime(1, this.context.currentTime);
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

  setDelayTime(time: number): void {
    if (this.delay) {
      this.delay.delayTime.setValueAtTime(time, this.context.currentTime);
    }
  }

  setFilterFrequency(frequency: number): void {
    if (this.filter) {
      this.filter.frequency.setValueAtTime(frequency, this.context.currentTime);
    }
  }

  // Set reverb level (0-100)
  setReverbLevel(level: number): void {
    // Reverb is controlled by wet/dry mix in the audio chain
    // This would be handled by gain nodes in the audio engine
  }

  // Set delay level and feedback for echo effect (0-100)
  setDelayLevel(level: number): void {
    if (this.delay) {
      const delayTime = (level / 100) * 0.5; // 0 to 0.5 seconds
      this.delay.delayTime.setValueAtTime(delayTime, this.context.currentTime);
    }
  }

  // Set echo effect (similar to delay but with feedback)
  setEchoLevel(level: number): void {
    if (this.delay) {
      const echoTime = (level / 100) * 0.3; // 0 to 0.3 seconds for echo
      this.delay.delayTime.setValueAtTime(echoTime, this.context.currentTime);
    }
  }

  // Create feedback delay chain for echo effect
  createEchoChain(inputNode: AudioNode, outputNode: AudioNode): GainNode {
    const feedbackGain = this.context.createGain();
    const wetGain = this.context.createGain();
    const dryGain = this.context.createGain();
    
    // Set initial values
    feedbackGain.gain.setValueAtTime(0.3, this.context.currentTime);
    wetGain.gain.setValueAtTime(0.5, this.context.currentTime);
    dryGain.gain.setValueAtTime(0.5, this.context.currentTime);
    
    // Connect the echo chain
    if (this.delay) {
      inputNode.connect(this.delay);
      inputNode.connect(dryGain);
      
      this.delay.connect(feedbackGain);
      this.delay.connect(wetGain);
      
      feedbackGain.connect(this.delay);
      
      wetGain.connect(outputNode);
      dryGain.connect(outputNode);
    }
    
    return wetGain;
  }
}
