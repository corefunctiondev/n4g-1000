export interface AudioTrack {
  file: File;
  audioBuffer: AudioBuffer | null;
  name: string;
  duration: number;
  bpm: number;
  originalBpm?: number;
  waveformData: Float32Array | null;
}

export interface DatabaseTrack {
  id: number;
  name: string;
  artist: string;
  bpm: number;
  duration: string;
  genre: string;
  url: string;
  waveformData: any;
}

export interface DeckState {
  track: AudioTrack | null;
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  volume: number;
  tempo: number;
  pitch: number;
  eq: {
    high: number;
    mid: number;
    low: number;
  };
  effects: {
    reverb: number;
    delay: number;
    echo: number;
  };
  cuePoints: number[];
  isLooping: boolean;
  loopStart: number;
  loopEnd: number;
  isReady: boolean;
}

export interface MixerState {
  crossfader: number;
  masterVolume: number;
  cueVolume: number;
  effects: {
    reverb: boolean;
    delay: boolean;
    filter: boolean;
    flanger: boolean;
  };
}

export interface AudioNodeSetup {
  source: AudioBufferSourceNode | null;
  gainNode: GainNode;
  eqNodes: {
    high: BiquadFilterNode;
    mid: BiquadFilterNode;
    low: BiquadFilterNode;
  };
  effectsNodes?: {
    reverbGain: GainNode;
    delayGain: GainNode;
    echoGain: GainNode;
  };
  reverbGain?: GainNode;
  delayGain?: GainNode;
  echoGain?: GainNode;
  analyser: AnalyserNode;
}
