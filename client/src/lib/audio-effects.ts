export class AudioEffects {
  private context: AudioContext;
  
  // Reverb components
  private reverbConvolver: ConvolverNode | null = null;
  private reverbWetGain: GainNode | null = null;
  private reverbDryGain: GainNode | null = null;
  private reverbInputGain: GainNode | null = null;
  private reverbOutputGain: GainNode | null = null;
  
  // Delay components
  private delayNode: DelayNode | null = null;
  private delayFeedbackGain: GainNode | null = null;
  private delayWetGain: GainNode | null = null;
  private delayDryGain: GainNode | null = null;
  private delayInputGain: GainNode | null = null;
  private delayOutputGain: GainNode | null = null;
  
  // Echo components (separate from delay)
  private echoDelay: DelayNode | null = null;
  private echoFeedbackGain: GainNode | null = null;
  private echoWetGain: GainNode | null = null;
  private echoDryGain: GainNode | null = null;
  private echoInputGain: GainNode | null = null;
  private echoOutputGain: GainNode | null = null;
  private echoFilter: BiquadFilterNode | null = null;

  constructor(context: AudioContext) {
    this.context = context;
    this.initializeEffects();
  }

  private async initializeEffects(): Promise<void> {
    this.createReverbEffect();
    this.createDelayEffect();
    this.createEchoEffect();
  }

  private createReverbEffect(): void {
    // Create reverb chain
    this.reverbConvolver = this.context.createConvolver();
    this.reverbConvolver.buffer = this.createReverbImpulse(3.0, 0.4); // 3 second decay, 40% density
    
    this.reverbInputGain = this.context.createGain();
    this.reverbWetGain = this.context.createGain();
    this.reverbDryGain = this.context.createGain();
    this.reverbOutputGain = this.context.createGain();
    
    // Set initial levels
    this.reverbWetGain.gain.setValueAtTime(0, this.context.currentTime);
    this.reverbDryGain.gain.setValueAtTime(1, this.context.currentTime);
    this.reverbOutputGain.gain.setValueAtTime(1, this.context.currentTime);
    
    // Connect reverb chain
    this.reverbInputGain.connect(this.reverbDryGain);
    this.reverbInputGain.connect(this.reverbConvolver);
    this.reverbConvolver.connect(this.reverbWetGain);
    
    this.reverbWetGain.connect(this.reverbOutputGain);
    this.reverbDryGain.connect(this.reverbOutputGain);
  }

  private createDelayEffect(): void {
    // Create delay chain with feedback
    this.delayNode = this.context.createDelay(2.0);
    this.delayFeedbackGain = this.context.createGain();
    this.delayWetGain = this.context.createGain();
    this.delayDryGain = this.context.createGain();
    this.delayInputGain = this.context.createGain();
    this.delayOutputGain = this.context.createGain();
    
    // Set initial values
    this.delayNode.delayTime.setValueAtTime(0.25, this.context.currentTime);
    this.delayFeedbackGain.gain.setValueAtTime(0, this.context.currentTime);
    this.delayWetGain.gain.setValueAtTime(0, this.context.currentTime);
    this.delayDryGain.gain.setValueAtTime(1, this.context.currentTime);
    this.delayOutputGain.gain.setValueAtTime(1, this.context.currentTime);
    
    // Connect delay chain
    this.delayInputGain.connect(this.delayDryGain);
    this.delayInputGain.connect(this.delayNode);
    
    this.delayNode.connect(this.delayWetGain);
    this.delayNode.connect(this.delayFeedbackGain);
    this.delayFeedbackGain.connect(this.delayNode);
    
    this.delayWetGain.connect(this.delayOutputGain);
    this.delayDryGain.connect(this.delayOutputGain);
  }

  private createEchoEffect(): void {
    // Create echo chain with filtered feedback
    this.echoDelay = this.context.createDelay(1.5);
    this.echoFeedbackGain = this.context.createGain();
    this.echoWetGain = this.context.createGain();
    this.echoDryGain = this.context.createGain();
    this.echoInputGain = this.context.createGain();
    this.echoOutputGain = this.context.createGain();
    this.echoFilter = this.context.createBiquadFilter();
    
    // Configure echo filter for natural sound
    this.echoFilter.type = 'lowpass';
    this.echoFilter.frequency.setValueAtTime(8000, this.context.currentTime);
    this.echoFilter.Q.setValueAtTime(0.5, this.context.currentTime);
    
    // Set initial values
    this.echoDelay.delayTime.setValueAtTime(0.375, this.context.currentTime);
    this.echoFeedbackGain.gain.setValueAtTime(0, this.context.currentTime);
    this.echoWetGain.gain.setValueAtTime(0, this.context.currentTime);
    this.echoDryGain.gain.setValueAtTime(1, this.context.currentTime);
    this.echoOutputGain.gain.setValueAtTime(1, this.context.currentTime);
    
    // Connect echo chain with filtering
    this.echoInputGain.connect(this.echoDryGain);
    this.echoInputGain.connect(this.echoDelay);
    
    this.echoDelay.connect(this.echoFilter);
    this.echoFilter.connect(this.echoWetGain);
    this.echoFilter.connect(this.echoFeedbackGain);
    this.echoFeedbackGain.connect(this.echoDelay);
    
    this.echoWetGain.connect(this.echoOutputGain);
    this.echoDryGain.connect(this.echoOutputGain);
  }

  private createReverbImpulse(decayTime: number = 2.0, density: number = 0.3): AudioBuffer {
    const length = this.context.sampleRate * decayTime;
    const impulse = this.context.createBuffer(2, length, this.context.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const progress = i / length;
        const decay = Math.pow(1 - progress, 3); // Exponential decay
        const noise = (Math.random() * 2 - 1) * density;
        
        // Add some early reflections for realism
        let earlyReflections = 0;
        if (progress < 0.1) {
          earlyReflections = Math.sin(progress * Math.PI * 50) * 0.3;
        }
        
        channelData[i] = (noise + earlyReflections) * decay;
      }
    }
    
    return impulse;
  }

  // Connect effect chains
  connectReverb(inputNode: AudioNode): AudioNode {
    if (this.reverbInputGain && this.reverbOutputGain) {
      inputNode.connect(this.reverbInputGain);
      return this.reverbOutputGain;
    }
    return inputNode;
  }

  connectDelay(inputNode: AudioNode): AudioNode {
    if (this.delayInputGain && this.delayOutputGain) {
      inputNode.connect(this.delayInputGain);
      return this.delayOutputGain;
    }
    return inputNode;
  }

  connectEcho(inputNode: AudioNode): AudioNode {
    if (this.echoInputGain && this.echoOutputGain) {
      inputNode.connect(this.echoInputGain);
      return this.echoOutputGain;
    }
    return inputNode;
  }

  // Effect level controls (0-100)
  setReverbLevel(level: number): void {
    if (this.reverbWetGain && this.reverbDryGain) {
      const wetLevel = level / 100;
      const dryLevel = Math.sqrt(1 - wetLevel * wetLevel); // Equal power crossfade
      
      this.reverbWetGain.gain.setTargetAtTime(wetLevel * 0.6, this.context.currentTime, 0.01);
      this.reverbDryGain.gain.setTargetAtTime(dryLevel, this.context.currentTime, 0.01);
    }
  }

  setDelayLevel(level: number): void {
    if (this.delayWetGain && this.delayDryGain && this.delayFeedbackGain) {
      const wetLevel = level / 100;
      const dryLevel = Math.sqrt(1 - wetLevel * wetLevel);
      const feedbackLevel = Math.min(wetLevel * 0.7, 0.6); // Prevent runaway feedback
      
      this.delayWetGain.gain.setTargetAtTime(wetLevel * 0.8, this.context.currentTime, 0.01);
      this.delayDryGain.gain.setTargetAtTime(dryLevel, this.context.currentTime, 0.01);
      this.delayFeedbackGain.gain.setTargetAtTime(feedbackLevel, this.context.currentTime, 0.01);
    }
  }

  setEchoLevel(level: number): void {
    if (this.echoWetGain && this.echoDryGain && this.echoFeedbackGain) {
      const wetLevel = level / 100;
      const dryLevel = Math.sqrt(1 - wetLevel * wetLevel);
      const feedbackLevel = Math.min(wetLevel * 0.8, 0.7); // More feedback for echo
      
      this.echoWetGain.gain.setTargetAtTime(wetLevel * 0.7, this.context.currentTime, 0.01);
      this.echoDryGain.gain.setTargetAtTime(dryLevel, this.context.currentTime, 0.01);
      this.echoFeedbackGain.gain.setTargetAtTime(feedbackLevel, this.context.currentTime, 0.01);
    }
  }

  // Musical timing controls based on BPM
  setDelayToMusicalTime(bpm: number, noteValue: '1/4' | '1/8' | '1/2' | '1/16' | '3/8'): void {
    const beatTime = 60 / bpm; // Time for one quarter note
    let delayTime: number;
    
    switch (noteValue) {
      case '1/16':
        delayTime = beatTime / 4;
        break;
      case '1/8':
        delayTime = beatTime / 2;
        break;
      case '1/4':
        delayTime = beatTime;
        break;
      case '3/8':
        delayTime = beatTime * 1.5;
        break;
      case '1/2':
        delayTime = beatTime * 2;
        break;
      default:
        delayTime = beatTime;
    }
    
    if (this.delayNode) {
      this.delayNode.delayTime.setTargetAtTime(delayTime, this.context.currentTime, 0.01);
    }
  }

  setEchoToMusicalTime(bpm: number, noteValue: '1/4' | '1/8' | '1/2' | '1/16' | '3/8'): void {
    const beatTime = 60 / bpm;
    let echoTime: number;
    
    switch (noteValue) {
      case '1/16':
        echoTime = beatTime / 4;
        break;
      case '1/8':
        echoTime = beatTime / 2;
        break;
      case '1/4':
        echoTime = beatTime;
        break;
      case '3/8':
        echoTime = beatTime * 1.5;
        break;
      case '1/2':
        echoTime = beatTime * 2;
        break;
      default:
        echoTime = beatTime * 0.75; // Slightly shorter for echo
    }
    
    if (this.echoDelay) {
      this.echoDelay.delayTime.setTargetAtTime(echoTime, this.context.currentTime, 0.01);
    }
  }

  // Manual time controls (fallback)
  setDelayTime(timeInSeconds: number): void {
    if (this.delayNode) {
      this.delayNode.delayTime.setTargetAtTime(
        Math.max(0.01, Math.min(2.0, timeInSeconds)), 
        this.context.currentTime, 
        0.01
      );
    }
  }

  setEchoTime(timeInSeconds: number): void {
    if (this.echoDelay) {
      this.echoDelay.delayTime.setTargetAtTime(
        Math.max(0.01, Math.min(1.5, timeInSeconds)), 
        this.context.currentTime, 
        0.01
      );
    }
  }

  // Cleanup
  disconnect(): void {
    [this.reverbInputGain, this.reverbOutputGain, this.delayInputGain, 
     this.delayOutputGain, this.echoInputGain, this.echoOutputGain].forEach(node => {
      if (node) {
        node.disconnect();
      }
    });
  }
}
