import { createClient } from '@supabase/supabase-js';

// Extract URL from environment variable that might include prefix
const rawSupabaseUrl = process.env.SUPABASE_URL;
const supabaseUrl = rawSupabaseUrl?.includes('=') ? rawSupabaseUrl.split('=')[1] : rawSupabaseUrl;

const rawSupabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseAnonKey = rawSupabaseKey?.includes('=') ? rawSupabaseKey.split('=')[1] : rawSupabaseKey;

console.log('Supabase URL:', supabaseUrl?.substring(0, 30) + '...');
console.log('Supabase Key:', supabaseAnonKey?.substring(0, 30) + '...');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupDatabase() {
  try {
    console.log('Creating music_tracks table...');
    
    // First, insert sample tracks directly
    const { data, error } = await supabase
      .from('music_tracks')
      .insert([
        {
          title: 'House Anthem',
          artist: 'DJ Producer',
          genre: 'House',
          bpm: 128,
          duration: '4:32',
          file_url: 'https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Kangaroo_MusiQue_-_The_Neverwritten_Role_Playing_Game.mp3'
        },
        {
          title: 'Techno Drive',
          artist: 'Beat Master',
          genre: 'Techno',
          bpm: 130,
          duration: '5:15',
          file_url: 'https://commondatastorage.googleapis.com/codeskulptor-assets/Epoq-Lepidoptera.ogg'
        },
        {
          title: 'Deep Vibes',
          artist: 'Sound Creator',
          genre: 'Deep House',
          bpm: 124,
          duration: '6:45',
          file_url: 'https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Sevish_-__nbsp_.mp3'
        }
      ]);
    
    if (error) {
      console.error('Error inserting sample tracks:', error);
    } else {
      console.log('Sample tracks inserted successfully:', data);
    }
    
  } catch (error) {
    console.error('Setup error:', error);
  }
}

setupDatabase();