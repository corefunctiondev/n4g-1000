import { createClient } from '@supabase/supabase-js';

const rawSupabaseUrl = process.env.SUPABASE_URL;
const supabaseUrl = rawSupabaseUrl?.includes('=') ? rawSupabaseUrl.split('=')[1] : rawSupabaseUrl;

const rawSupabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseAnonKey = rawSupabaseKey?.includes('=') ? rawSupabaseKey.split('=')[1] : rawSupabaseKey;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTable() {
  try {
    console.log('Creating music_tracks table...');
    
    // Execute SQL to create table
    const { data, error } = await supabase.rpc('sql', {
      query: `
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
        
        ALTER TABLE music_tracks ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY IF NOT EXISTS "Allow public access" ON music_tracks FOR ALL USING (true);
        
        INSERT INTO music_tracks (title, artist, genre, bpm, duration, file_url) VALUES
          ('House Anthem', 'DJ Producer', 'House', 128, '4:32', 'https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Kangaroo_MusiQue_-_The_Neverwritten_Role_Playing_Game.mp3'),
          ('Techno Drive', 'Beat Master', 'Techno', 130, '5:15', 'https://commondatastorage.googleapis.com/codeskulptor-assets/Epoq-Lepidoptera.ogg'),
          ('Deep Vibes', 'Sound Creator', 'Deep House', 124, '6:45', 'https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Sevish_-__nbsp_.mp3')
        ON CONFLICT DO NOTHING;
      `
    });
    
    if (error) {
      console.error('Error creating table:', error);
    } else {
      console.log('Table created successfully');
    }
    
  } catch (error) {
    console.error('Setup error:', error);
  }
}

createTable();