import { createClient } from '@supabase/supabase-js';

// Extract URL from environment variable that might include prefix
const rawSupabaseUrl = process.env.SUPABASE_URL;
const supabaseUrl = rawSupabaseUrl?.includes('=') ? rawSupabaseUrl.split('=')[1] : rawSupabaseUrl;

const rawSupabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseAnonKey = rawSupabaseKey?.includes('=') ? rawSupabaseKey.split('=')[1] : rawSupabaseKey;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      music_tracks: {
        Row: {
          id: string;
          title: string;
          artist: string;
          genre: string | null;
          bpm: number | null;
          duration: string | null;
          file_url: string;
          waveform_data: any | null;
          is_active: boolean;
          plays: number;
          file_size: number | null;
          upload_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          artist: string;
          genre?: string | null;
          bpm?: number | null;
          duration?: string | null;
          file_url: string;
          waveform_data?: any | null;
          is_active?: boolean;
          plays?: number;
          file_size?: number | null;
          upload_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          artist?: string;
          genre?: string | null;
          bpm?: number | null;
          duration?: string | null;
          file_url?: string;
          waveform_data?: any | null;
          is_active?: boolean;
          plays?: number;
          file_size?: number | null;
          upload_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};