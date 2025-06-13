import { supabase } from './supabase';

export async function initializeSupabaseSchema() {
  try {
    console.log('Creating music_tracks table...');
    
    // Create the music_tracks table
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS music_tracks (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          title TEXT NOT NULL,
          artist TEXT NOT NULL,
          genre TEXT,
          bpm INTEGER,
          duration TEXT,
          file_url TEXT NOT NULL,
          waveform_data JSONB,
          is_active BOOLEAN DEFAULT true,
          plays INTEGER DEFAULT 0,
          file_size BIGINT,
          upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_music_tracks_artist ON music_tracks(artist);
        CREATE INDEX IF NOT EXISTS idx_music_tracks_genre ON music_tracks(genre);
        CREATE INDEX IF NOT EXISTS idx_music_tracks_bpm ON music_tracks(bpm);
        CREATE INDEX IF NOT EXISTS idx_music_tracks_is_active ON music_tracks(is_active);
      `
    });
    
    if (tableError) {
      console.error('Error creating table:', tableError);
      return;
    }
    
    console.log('Inserting sample tracks...');
    
    // Insert sample tracks
    const { error: insertError } = await supabase
      .from('music_tracks')
      .insert([
        {
          title: 'House Anthem',
          artist: 'DJ Producer',
          genre: 'House',
          bpm: 128,
          file_url: 'https://www.soundjay.com/misc/sounds/house-beat.mp3'
        },
        {
          title: 'Techno Drive',
          artist: 'Beat Master',
          genre: 'Techno',
          bpm: 130,
          file_url: 'https://www.soundjay.com/misc/sounds/techno-beat.mp3'
        },
        {
          title: 'Deep Vibes',
          artist: 'Sound Creator',
          genre: 'Deep House',
          bpm: 124,
          file_url: 'https://www.soundjay.com/misc/sounds/deep-house.mp3'
        }
      ]);
    
    if (insertError) {
      console.log('Sample tracks already exist or insert failed:', insertError.message);
    } else {
      console.log('Sample tracks inserted successfully');
    }
    
    console.log('Supabase schema initialized successfully');
    
  } catch (error) {
    console.error('Error initializing Supabase schema:', error);
  }
}