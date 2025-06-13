import { createClient } from '@supabase/supabase-js';

const rawSupabaseUrl = process.env.SUPABASE_URL;
const supabaseUrl = rawSupabaseUrl?.includes('=') ? rawSupabaseUrl.split('=')[1] : rawSupabaseUrl;

const rawSupabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseAnonKey = rawSupabaseKey?.includes('=') ? rawSupabaseKey.split('=')[1] : rawSupabaseKey;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function addSampleTracks() {
  console.log('Adding sample tracks to your database...');
  
  const sampleTracks = [
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
  ];

  try {
    const { data, error } = await supabase
      .from('music_tracks')
      .insert(sampleTracks)
      .select();

    if (error) {
      console.error('Error inserting tracks:', error);
    } else {
      console.log('Successfully added sample tracks:', data.length);
      data.forEach(track => {
        console.log(`- ${track.title} by ${track.artist} (${track.bpm} BPM)`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

addSampleTracks();