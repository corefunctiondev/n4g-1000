class AudioFeedback {
  private context: AudioContext | null = null;
  private isEnabled: boolean = true;
  private isInitialized: boolean = false;

  constructor() {
    // Don't initialize immediately, wait for user interaction
  }

  private async init() {
    if (this.isInitialized) return;
    
    try {
      this.context = new AudioContext();
      this.isInitialized = true;
    } catch (error) {
      console.warn('AudioContext not supported:', error);
      this.isEnabled = false;
    }
  }

  private async resumeContext() {
    if (this.context && this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  // Create different types of beeps
  private createBeep(frequency: number, duration: number, volume: number = 0.1) {
    if (!this.context || !this.isEnabled) return;

    try {
      const oscillator = this.context.createOscillator();
      const gainNode = this.context.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.context.destination);

      oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0, this.context.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, this.context.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);

      oscillator.start(this.context.currentTime);
      oscillator.stop(this.context.currentTime + duration);
    } catch (error) {
      console.warn('Audio feedback error:', error);
      this.isEnabled = false;
    }
  }

  // Different sound effects
  async playClick() {
    if (!this.isEnabled) return;
    await this.init();
    await this.resumeContext();
    this.createBeep(800, 0.1, 0.05);
  }

  async playHover() {
    if (!this.isEnabled) return;
    await this.init();
    await this.resumeContext();
    this.createBeep(1200, 0.05, 0.03);
  }

  async playSuccess() {
    if (!this.isEnabled) return;
    await this.init();
    await this.resumeContext();
    // Two-tone success sound
    this.createBeep(800, 0.1, 0.05);
    setTimeout(() => this.createBeep(1000, 0.1, 0.05), 100);
  }

  async playError() {
    if (!this.isEnabled) return;
    await this.init();
    await this.resumeContext();
    // Lower, longer error sound
    this.createBeep(300, 0.3, 0.08);
  }

  async playEdit() {
    if (!this.isEnabled) return;
    await this.init();
    await this.resumeContext();
    // Quick chirp for edit mode
    this.createBeep(1500, 0.08, 0.04);
  }

  async playNavigate() {
    if (!this.isEnabled) return;
    await this.init();
    await this.resumeContext();
    // Subtle navigation sound
    this.createBeep(600, 0.12, 0.04);
  }

  async playToggle() {
    if (!this.isEnabled) return;
    await this.init();
    await this.resumeContext();
    // Two quick beeps
    this.createBeep(1000, 0.06, 0.04);
    setTimeout(() => this.createBeep(1200, 0.06, 0.04), 80);
  }

  async playSystemInit() {
    if (!this.isEnabled) return;
    await this.init();
    await this.resumeContext();
    
    // Futuristic system initialization sequence
    // Low bass foundation
    this.createBeep(120, 0.8, 0.08);
    
    // Rising sweep
    setTimeout(() => {
      for (let i = 0; i < 8; i++) {
        setTimeout(() => {
          const freq = 200 + (i * 100);
          this.createBeep(freq, 0.15, 0.03);
        }, i * 80);
      }
    }, 200);
    
    // High confirmation tones
    setTimeout(() => {
      this.createBeep(1200, 0.2, 0.05);
      setTimeout(() => this.createBeep(1500, 0.2, 0.05), 150);
      setTimeout(() => this.createBeep(1800, 0.3, 0.06), 300);
    }, 800);
  }

  async playDJModeActivate() {
    if (!this.isEnabled) return;
    await this.init();
    await this.resumeContext();
    
    // DJ mode activation sound - three ascending chords
    const playChord = (frequencies: number[], delay: number) => {
      setTimeout(() => {
        frequencies.forEach(freq => {
          this.createBeep(freq, 0.4, 0.04);
        });
      }, delay);
    };
    
    playChord([440, 554, 659], 0);     // A major chord
    playChord([493, 622, 740], 200);   // B major chord  
    playChord([523, 659, 784], 400);   // C major chord
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }
}

export const audioFeedback = new AudioFeedback();