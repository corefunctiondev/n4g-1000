class AudioFeedback {
  private context: AudioContext | null = null;
  private isEnabled: boolean = true;

  constructor() {
    this.init();
  }

  private async init() {
    try {
      this.context = new AudioContext();
    } catch (error) {
      console.warn('AudioContext not supported:', error);
    }
  }

  private async resumeContext() {
    if (this.context && this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  // Create different types of beeps
  private createBeep(frequency: number, duration: number, volume: number = 0.1) {
    if (!this.context) return;

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
  }

  // Different sound effects
  async playClick() {
    await this.resumeContext();
    this.createBeep(800, 0.1, 0.05);
  }

  async playHover() {
    await this.resumeContext();
    this.createBeep(1200, 0.05, 0.03);
  }

  async playSuccess() {
    await this.resumeContext();
    // Two-tone success sound
    this.createBeep(800, 0.1, 0.05);
    setTimeout(() => this.createBeep(1000, 0.1, 0.05), 100);
  }

  async playError() {
    await this.resumeContext();
    // Lower, longer error sound
    this.createBeep(300, 0.3, 0.08);
  }

  async playEdit() {
    await this.resumeContext();
    // Quick chirp for edit mode
    this.createBeep(1500, 0.08, 0.04);
  }

  async playNavigate() {
    await this.resumeContext();
    // Subtle navigation sound
    this.createBeep(600, 0.12, 0.04);
  }

  async playToggle() {
    await this.resumeContext();
    // Two quick beeps
    this.createBeep(1000, 0.06, 0.04);
    setTimeout(() => this.createBeep(1200, 0.06, 0.04), 80);
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }
}

export const audioFeedback = new AudioFeedback();