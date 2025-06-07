export class BPMAnalyzer {
  private context: AudioContext;
  private analyser: AnalyserNode;
  private dataArray: Uint8Array;
  private sampleRate: number;

  constructor(context: AudioContext) {
    this.context = context;
    this.analyser = context.createAnalyser();
    this.analyser.fftSize = 2048;
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.sampleRate = context.sampleRate;
  }

  async analyzeBPM(audioBuffer: AudioBuffer): Promise<number> {
    try {
      const channelData = audioBuffer.getChannelData(0);
      const peaks = this.findPeaks(channelData);
      const intervals = this.calculateIntervals(peaks);
      const bpm = this.estimateBPM(intervals);
      
      return Math.round(bpm * 10) / 10; // Round to 1 decimal place
    } catch (error) {
      console.error('BPM analysis failed:', error);
      return 120.0; // Default BPM
    }
  }

  private findPeaks(channelData: Float32Array): number[] {
    const peaks: number[] = [];
    const threshold = 0.3;
    const minDistance = Math.floor(this.sampleRate * 0.1); // Minimum 100ms between peaks

    for (let i = minDistance; i < channelData.length - minDistance; i++) {
      if (Math.abs(channelData[i]) > threshold) {
        let isPeak = true;
        
        // Check if this is a local maximum
        for (let j = -minDistance; j <= minDistance; j++) {
          if (j !== 0 && Math.abs(channelData[i + j]) > Math.abs(channelData[i])) {
            isPeak = false;
            break;
          }
        }
        
        if (isPeak) {
          peaks.push(i / this.sampleRate); // Convert to seconds
          i += minDistance; // Skip ahead to avoid duplicate peaks
        }
      }
    }
    
    return peaks;
  }

  private calculateIntervals(peaks: number[]): number[] {
    const intervals: number[] = [];
    
    for (let i = 1; i < peaks.length; i++) {
      intervals.push(peaks[i] - peaks[i - 1]);
    }
    
    return intervals;
  }

  private estimateBPM(intervals: number[]): number {
    if (intervals.length === 0) return 120.0;

    // Group similar intervals
    const groups: { interval: number; count: number }[] = [];
    const tolerance = 0.05;

    intervals.forEach(interval => {
      let found = false;
      for (const group of groups) {
        if (Math.abs(group.interval - interval) < tolerance) {
          group.count++;
          group.interval = (group.interval * (group.count - 1) + interval) / group.count;
          found = true;
          break;
        }
      }
      
      if (!found) {
        groups.push({ interval, count: 1 });
      }
    });

    // Find the most common interval
    groups.sort((a, b) => b.count - a.count);
    const dominantInterval = groups[0]?.interval;

    if (!dominantInterval) return 120.0;

    // Convert interval to BPM
    const bpm = 60 / dominantInterval;
    
    // Ensure reasonable BPM range
    if (bpm < 60) return bpm * 2;
    if (bpm > 200) return bpm / 2;
    
    return bpm;
  }

  getAnalyser(): AnalyserNode {
    return this.analyser;
  }
}
