import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';

type Track = Database['public']['Tables']['music_tracks']['Row'];
type TrackInsert = Database['public']['Tables']['music_tracks']['Insert'];
type TrackUpdate = Database['public']['Tables']['music_tracks']['Update'];

export class TrackService {
  static async getAllTracks(): Promise<Track[]> {
    const { data, error } = await supabase
      .from('music_tracks')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getTrackById(id: string): Promise<Track | null> {
    const { data, error } = await supabase
      .from('music_tracks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async createTrack(track: TrackInsert): Promise<Track> {
    const { data, error } = await supabase
      .from('music_tracks')
      .insert(track)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async uploadAudioFile(file: File): Promise<string> {
    const fileName = `tracks/${Date.now()}-${file.name}`;
    
    const { data, error } = await supabase.storage
      .from('music')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('music')
      .getPublicUrl(fileName);

    return publicUrl;
  }

  static async analyzeAudioFile(audioBuffer: AudioBuffer): Promise<{
    bpm: number;
    duration: string;
    waveformData: number[];
  }> {
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    const bpm = await this.detectBPM(channelData, sampleRate);
    const duration = this.formatDuration(audioBuffer.duration);
    const waveformData = this.generateWaveformData(channelData);
    
    return { bpm, duration, waveformData };
  }

  private static async detectBPM(channelData: Float32Array, sampleRate: number): Promise<number> {
    const peaks = [];
    const windowSize = Math.floor(sampleRate * 0.1);
    
    for (let i = 0; i < channelData.length - windowSize; i += windowSize) {
      let sum = 0;
      for (let j = i; j < i + windowSize; j++) {
        sum += Math.abs(channelData[j]);
      }
      peaks.push(sum / windowSize);
    }
    
    const intervals = [];
    let lastPeak = 0;
    const threshold = Math.max(...peaks) * 0.6;
    
    for (let i = 1; i < peaks.length; i++) {
      if (peaks[i] > threshold && peaks[i] > peaks[i-1] && peaks[i] > peaks[i+1]) {
        if (lastPeak > 0) {
          intervals.push((i - lastPeak) * 0.1);
        }
        lastPeak = i;
      }
    }
    
    if (intervals.length === 0) return 120;
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const bpm = 60 / avgInterval;
    
    return Math.max(60, Math.min(200, bpm));
  }

  private static formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  private static generateWaveformData(channelData: Float32Array): number[] {
    const samples = 200;
    const samplesPerPixel = Math.floor(channelData.length / samples);
    const waveformData = new Array(samples);
    
    for (let i = 0; i < samples; i++) {
      let sum = 0;
      const start = i * samplesPerPixel;
      const end = Math.min(start + samplesPerPixel, channelData.length);
      
      for (let j = start; j < end; j++) {
        sum += Math.abs(channelData[j]);
      }
      waveformData[i] = sum / (end - start);
    }
    
    return waveformData;
  }
}

export type { Track, TrackInsert, TrackUpdate };