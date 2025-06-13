import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
      site_config: {
        Row: {
          id: string;
          config: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          config: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          config?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};