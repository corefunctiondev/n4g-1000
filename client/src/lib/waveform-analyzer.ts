export class WaveformAnalyzer {
  private context: AudioContext;
  private analyser: AnalyserNode;
  private frequencyData: Uint8Array;
  private timeData: Uint8Array;
  private sampleRate: number;
  private fftSize: number;

  constructor(context: AudioContext) {
    this.context = context;
    this.sampleRate = context.sampleRate;
    this.fftSize = 4096; // High resolution for precise frequency analysis
    
    this.analyser = context.createAnalyser();
    this.analyser.fftSize = this.fftSize;
    this.analyser.smoothingTimeConstant = 0.0; // No smoothing for accurate energy readings
    this.analyser.minDecibels = -100;
    this.analyser.maxDecibels = -10;
    
    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    this.timeData = new Uint8Array(this.fftSize);
  }

  getAnalyser(): AnalyserNode {
    return this.analyser;
  }

  // Connect the analyzer to an audio source for live analysis
  connectToSource(source: AudioNode): void {
    source.connect(this.analyser);
  }

  // Analyze audio buffer and generate waveform data with frequency bands
  async analyzeAudioBuffer(audioBuffer: AudioBuffer, pixelsPerSecond: number = 100): Promise<{
    low: Float32Array;
    mid: Float32Array; 
    high: Float32Array;
    combined: Float32Array;
  }> {
    const channelData = audioBuffer.getChannelData(0); // Use first channel
    const duration = audioBuffer.duration;
    const sampleRate = audioBuffer.sampleRate;
    const samplesPerPixel = Math.floor(sampleRate / pixelsPerSecond);
    const totalPixels = Math.floor(duration * pixelsPerSecond);
    
    // Frequency band ranges (Hz) - optimized for DJ mixing
    const lowRange = { start: 20, end: 250 };      // Bass/Sub-bass
    const midRange = { start: 250, end: 4000 };    // Mids/Vocals  
    const highRange = { start: 4000, end: 20000 }; // Highs/Treble
    
    // Convert frequency ranges to FFT bin indices
    const binSize = sampleRate / 2 / (this.fftSize / 2);
    const lowBins = {
      start: Math.floor(lowRange.start / binSize),
      end: Math.floor(lowRange.end / binSize)
    };
    const midBins = {
      start: Math.floor(midRange.start / binSize),
      end: Math.floor(midRange.end / binSize)
    };
    const highBins = {
      start: Math.floor(highRange.start / binSize),
      end: Math.floor(highRange.end / binSize)
    };

    // Initialize result arrays
    const lowBand = new Float32Array(totalPixels);
    const midBand = new Float32Array(totalPixels);
    const highBand = new Float32Array(totalPixels);
    const combinedBand = new Float32Array(totalPixels);

    // Process audio in chunks
    for (let pixel = 0; pixel < totalPixels; pixel++) {
      const startSample = pixel * samplesPerPixel;
      const endSample = Math.min(startSample + samplesPerPixel, channelData.length);
      
      if (startSample >= channelData.length) break;
      
      // Extract chunk for FFT analysis
      const chunkSize = this.fftSize;
      const chunk = new Float32Array(chunkSize);
      
      // Copy audio data to chunk (pad with zeros if needed)
      for (let i = 0; i < chunkSize; i++) {
        const sampleIndex = startSample + i;
        chunk[i] = sampleIndex < channelData.length ? channelData[sampleIndex] : 0;
      }
      
      // Apply window function (Hanning) to reduce spectral leakage
      for (let i = 0; i < chunkSize; i++) {
        const windowValue = 0.5 * (1 - Math.cos(2 * Math.PI * i / (chunkSize - 1)));
        chunk[i] *= windowValue;
      }
      
      // Perform FFT
      const fftResult = this.performFFT(chunk);
      const magnitudes = this.calculateMagnitudes(fftResult);
      
      // Calculate energy for each frequency band
      let lowEnergy = 0, midEnergy = 0, highEnergy = 0;
      
      // Low frequencies
      for (let bin = lowBins.start; bin <= lowBins.end && bin < magnitudes.length; bin++) {
        lowEnergy += magnitudes[bin] * magnitudes[bin];
      }
      lowEnergy = Math.sqrt(lowEnergy / (lowBins.end - lowBins.start + 1));
      
      // Mid frequencies  
      for (let bin = midBins.start; bin <= midBins.end && bin < magnitudes.length; bin++) {
        midEnergy += magnitudes[bin] * magnitudes[bin];
      }
      midEnergy = Math.sqrt(midEnergy / (midBins.end - midBins.start + 1));
      
      // High frequencies
      for (let bin = highBins.start; bin <= highBins.end && bin < magnitudes.length; bin++) {
        highEnergy += magnitudes[bin] * magnitudes[bin];
      }
      highEnergy = Math.sqrt(highEnergy / (highBins.end - highBins.start + 1));
      
      // Also calculate RMS amplitude for combined waveform
      let rmsSum = 0;
      const sampleCount = endSample - startSample;
      for (let i = startSample; i < endSample; i++) {
        rmsSum += channelData[i] * channelData[i];
      }
      const rmsAmplitude = Math.sqrt(rmsSum / sampleCount);
      
      // Store normalized energy values
      lowBand[pixel] = Math.min(lowEnergy / 0.5, 1.0);
      midBand[pixel] = Math.min(midEnergy / 0.5, 1.0);
      highBand[pixel] = Math.min(highEnergy / 0.5, 1.0);
      combinedBand[pixel] = Math.min(rmsAmplitude * 4, 1.0);
    }

    return {
      low: lowBand,
      mid: midBand,
      high: highBand,
      combined: combinedBand
    };
  }

  // Simple FFT implementation for frequency analysis
  private performFFT(signal: Float32Array): { real: Float32Array; imag: Float32Array } {
    const N = signal.length;
    const real = new Float32Array(N);
    const imag = new Float32Array(N);
    
    // Copy input signal to real part
    for (let i = 0; i < N; i++) {
      real[i] = signal[i];
      imag[i] = 0;
    }
    
    // Bit-reverse permutation
    let j = 0;
    for (let i = 1; i < N; i++) {
      let bit = N >> 1;
      while (j & bit) {
        j ^= bit;
        bit >>= 1;
      }
      j ^= bit;
      
      if (i < j) {
        [real[i], real[j]] = [real[j], real[i]];
        [imag[i], imag[j]] = [imag[j], imag[i]];
      }
    }
    
    // Cooley-Tukey FFT
    for (let len = 2; len <= N; len <<= 1) {
      const ang = 2 * Math.PI / len;
      const wlen_real = Math.cos(ang);
      const wlen_imag = Math.sin(ang);
      
      for (let i = 0; i < N; i += len) {
        let w_real = 1;
        let w_imag = 0;
        
        for (let j = 0; j < len / 2; j++) {
          const u_real = real[i + j];
          const u_imag = imag[i + j];
          const v_real = real[i + j + len / 2] * w_real - imag[i + j + len / 2] * w_imag;
          const v_imag = real[i + j + len / 2] * w_imag + imag[i + j + len / 2] * w_real;
          
          real[i + j] = u_real + v_real;
          imag[i + j] = u_imag + v_imag;
          real[i + j + len / 2] = u_real - v_real;
          imag[i + j + len / 2] = u_imag - v_imag;
          
          const next_w_real = w_real * wlen_real - w_imag * wlen_imag;
          const next_w_imag = w_real * wlen_imag + w_imag * wlen_real;
          w_real = next_w_real;
          w_imag = next_w_imag;
        }
      }
    }
    
    return { real, imag };
  }

  // Calculate magnitude spectrum from FFT result
  private calculateMagnitudes(fftResult: { real: Float32Array; imag: Float32Array }): Float32Array {
    const { real, imag } = fftResult;
    const magnitudes = new Float32Array(real.length / 2); // Only use positive frequencies
    
    for (let i = 0; i < magnitudes.length; i++) {
      magnitudes[i] = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]);
    }
    
    return magnitudes;
  }

  // Get real-time frequency data for live analysis
  getLiveFrequencyData(): {
    lowEnergy: number;
    midEnergy: number; 
    highEnergy: number;
    combinedRMS: number;
  } {
    this.analyser.getByteFrequencyData(this.frequencyData);
    this.analyser.getByteTimeDomainData(this.timeData);
    
    const sampleRate = this.context.sampleRate;
    const binSize = sampleRate / 2 / this.frequencyData.length;
    
    // Frequency band ranges
    const lowBins = {
      start: Math.floor(20 / binSize),
      end: Math.floor(250 / binSize)
    };
    const midBins = {
      start: Math.floor(250 / binSize),
      end: Math.floor(4000 / binSize)
    };
    const highBins = {
      start: Math.floor(4000 / binSize),
      end: Math.floor(20000 / binSize)
    };
    
    // Calculate energy for each band
    let lowEnergy = 0, midEnergy = 0, highEnergy = 0;
    
    for (let i = lowBins.start; i <= lowBins.end && i < this.frequencyData.length; i++) {
      const value = this.frequencyData[i] / 255;
      lowEnergy += value * value;
    }
    lowEnergy = Math.sqrt(lowEnergy / (lowBins.end - lowBins.start + 1));
    
    for (let i = midBins.start; i <= midBins.end && i < this.frequencyData.length; i++) {
      const value = this.frequencyData[i] / 255;
      midEnergy += value * value;
    }
    midEnergy = Math.sqrt(midEnergy / (midBins.end - midBins.start + 1));
    
    for (let i = highBins.start; i <= highBins.end && i < this.frequencyData.length; i++) {
      const value = this.frequencyData[i] / 255;
      highEnergy += value * value;
    }
    highEnergy = Math.sqrt(highEnergy / (highBins.end - highBins.start + 1));
    
    // Calculate RMS from time domain data
    let rmsSum = 0;
    for (let i = 0; i < this.timeData.length; i++) {
      const sample = (this.timeData[i] - 128) / 128;
      rmsSum += sample * sample;
    }
    const combinedRMS = Math.sqrt(rmsSum / this.timeData.length);
    
    return {
      lowEnergy,
      midEnergy,
      highEnergy,
      combinedRMS
    };
  }
}