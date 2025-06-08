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
      console.log('Starting BPM analysis...');
      const channelData = audioBuffer.getChannelData(0);
      const sampleRate = audioBuffer.sampleRate;
      
      // Use longer analysis for better accuracy
      const analysisLength = Math.min(channelData.length, sampleRate * 60);
      const analysisData = channelData.slice(0, analysisLength);
      
      // Multiple analysis methods for better accuracy
      const autocorrelationBPM = this.analyzeAutocorrelation(analysisData, sampleRate);
      const peakBPM = this.analyzePeaks(analysisData);
      const spectralBPM = this.analyzeSpectral(analysisData, sampleRate);
      
      console.log(`BPM methods: Autocorr=${autocorrelationBPM}, Peaks=${peakBPM}, Spectral=${spectralBPM}`);
      
      // Choose most reliable result
      const candidates = [autocorrelationBPM, peakBPM, spectralBPM].filter(bpm => bpm > 60 && bpm < 200);
      
      if (candidates.length === 0) {
        return 128.0; // Common electronic music BPM
      }
      
      // Return median of valid candidates
      candidates.sort((a, b) => a - b);
      const finalBPM = candidates[Math.floor(candidates.length / 2)];
      
      console.log(`Final BPM: ${finalBPM}`);
      return Math.round(finalBPM * 10) / 10;
    } catch (error) {
      console.error('BPM analysis failed:', error);
      return 128.0;
    }
  }

  private detectOnsets(channelData: Float32Array, sampleRate: number): number[] {
    const onsets: number[] = [];
    const windowSize = Math.floor(sampleRate * 0.05); // 50ms windows
    const hopSize = Math.floor(windowSize / 4);
    const threshold = 0.3;
    
    // Calculate spectral flux for onset detection
    for (let i = hopSize; i < channelData.length - windowSize; i += hopSize) {
      const currentWindow = channelData.slice(i, i + windowSize);
      const previousWindow = channelData.slice(i - hopSize, i - hopSize + windowSize);
      
      // Calculate energy difference
      const currentEnergy = this.calculateEnergy(currentWindow);
      const previousEnergy = this.calculateEnergy(previousWindow);
      
      const energyDiff = currentEnergy - previousEnergy;
      
      if (energyDiff > threshold) {
        // Ensure minimum distance between onsets
        if (onsets.length === 0 || (i - onsets[onsets.length - 1]) > sampleRate * 0.1) {
          onsets.push(i);
        }
      }
    }
    
    return onsets;
  }

  private calculateEnergy(window: Float32Array): number {
    let energy = 0;
    for (let i = 0; i < window.length; i++) {
      energy += window[i] * window[i];
    }
    return energy / window.length;
  }

  private findTempoFromIntervals(intervals: number[], sampleRate: number): number {
    if (intervals.length === 0) return 120.0;
    
    // Convert intervals to BPM
    const bpmCandidates: number[] = [];
    
    for (const interval of intervals) {
      const intervalSeconds = interval / sampleRate;
      if (intervalSeconds > 0.2 && intervalSeconds < 2.0) { // 30-300 BPM range
        const bpm = 60 / intervalSeconds;
        bpmCandidates.push(bpm);
        
        // Also consider half and double time
        if (bpm > 150) bpmCandidates.push(bpm / 2);
        if (bpm < 90) bpmCandidates.push(bpm * 2);
      }
    }
    
    if (bpmCandidates.length === 0) return 120.0;
    
    // Find most common BPM (with tolerance)
    const tolerance = 3;
    const bpmGroups: { [key: number]: number[] } = {};
    
    for (const bpm of bpmCandidates) {
      const roundedBPM = Math.round(bpm / tolerance) * tolerance;
      if (!bpmGroups[roundedBPM]) bpmGroups[roundedBPM] = [];
      bpmGroups[roundedBPM].push(bpm);
    }
    
    // Find group with most candidates
    let bestBPM = 120;
    let maxCount = 0;
    
    for (const [groupBPM, group] of Object.entries(bpmGroups)) {
      if (group.length > maxCount) {
        maxCount = group.length;
        const avgBPM = group.reduce((sum, bpm) => sum + bpm, 0) / group.length;
        bestBPM = avgBPM;
      }
    }
    
    return Math.max(60, Math.min(200, bestBPM)); // Clamp to reasonable range
  }

  private analyzePeaks(channelData: Float32Array): number {
    const peaks: number[] = [];
    const threshold = 0.4;
    const minDistance = Math.floor(this.sampleRate * 0.15); // 150ms minimum

    // Apply high-pass filter to focus on percussive elements
    const filtered = this.highPassFilter(channelData);

    for (let i = minDistance; i < filtered.length - minDistance; i++) {
      if (Math.abs(filtered[i]) > threshold) {
        let isPeak = true;
        
        for (let j = -minDistance; j <= minDistance; j++) {
          if (j !== 0 && Math.abs(filtered[i + j]) > Math.abs(filtered[i])) {
            isPeak = false;
            break;
          }
        }
        
        if (isPeak) {
          peaks.push(i / this.sampleRate);
          i += minDistance;
        }
      }
    }
    
    const intervals = this.calculateIntervals(peaks);
    return this.estimateBPM(intervals);
  }

  private analyzeSpectral(channelData: Float32Array, sampleRate: number): number {
    // Analyze tempo using FFT on onset detection function
    const windowSize = 2048;
    const hopSize = 512;
    const onsetStrength: number[] = [];
    
    for (let i = 0; i < channelData.length - windowSize; i += hopSize) {
      const window = channelData.slice(i, i + windowSize);
      const energy = this.calculateSpectralEnergy(window);
      onsetStrength.push(energy);
    }
    
    // Apply autocorrelation to find periodic patterns
    return this.findTempoFromOnsets(onsetStrength, sampleRate / hopSize);
  }

  private analyzeAutocorrelation(channelData: Float32Array, sampleRate: number): number {
    // Downsample for efficiency
    const downsampleFactor = 4;
    const downsampled = new Float32Array(Math.floor(channelData.length / downsampleFactor));
    
    for (let i = 0; i < downsampled.length; i++) {
      downsampled[i] = channelData[i * downsampleFactor];
    }
    
    const effectiveSampleRate = sampleRate / downsampleFactor;
    const minBPM = 60;
    const maxBPM = 200;
    const minLag = Math.floor(effectiveSampleRate * 60 / maxBPM);
    const maxLag = Math.floor(effectiveSampleRate * 60 / minBPM);
    
    let bestCorrelation = 0;
    let bestLag = minLag;
    
    for (let lag = minLag; lag < maxLag && lag < downsampled.length / 2; lag++) {
      let correlation = 0;
      let count = 0;
      
      for (let i = 0; i < downsampled.length - lag; i++) {
        correlation += downsampled[i] * downsampled[i + lag];
        count++;
      }
      
      correlation /= count;
      
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestLag = lag;
      }
    }
    
    return (effectiveSampleRate * 60) / bestLag;
  }

  private highPassFilter(data: Float32Array): Float32Array {
    const filtered = new Float32Array(data.length);
    const alpha = 0.97; // High-pass filter coefficient
    
    filtered[0] = data[0];
    for (let i = 1; i < data.length; i++) {
      filtered[i] = alpha * (filtered[i - 1] + data[i] - data[i - 1]);
    }
    
    return filtered;
  }

  private calculateSpectralEnergy(window: Float32Array): number {
    let energy = 0;
    for (let i = 0; i < window.length; i++) {
      energy += window[i] * window[i];
    }
    return Math.sqrt(energy / window.length);
  }

  private findTempoFromOnsets(onsets: number[], sampleRate: number): number {
    const minBPM = 60;
    const maxBPM = 200;
    const tempoRange = maxBPM - minBPM;
    const scores = new Array(tempoRange).fill(0);
    
    for (let bpm = minBPM; bpm < maxBPM; bpm++) {
      const period = sampleRate * 60 / bpm;
      let score = 0;
      
      for (let i = 0; i < onsets.length; i++) {
        const phase = (i % period) / period;
        score += onsets[i] * Math.cos(2 * Math.PI * phase);
      }
      
      scores[bpm - minBPM] = Math.abs(score);
    }
    
    const maxScore = Math.max(...scores);
    const bestBPM = scores.indexOf(maxScore) + minBPM;
    
    return bestBPM;
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
