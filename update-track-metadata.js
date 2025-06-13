import { createClient } from '@supabase/supabase-js';

const rawSupabaseUrl = process.env.SUPABASE_URL;
const supabaseUrl = rawSupabaseUrl?.includes('=') ? rawSupabaseUrl.split('=')[1] : rawSupabaseUrl;

const rawSupabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseAnonKey = rawSupabaseKey?.includes('=') ? rawSupabaseKey.split('=')[1] : rawSupabaseKey;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function updateTrackMetadata() {
  console.log('Updating track metadata with proper artist and genre info...');
  
  // Get all tracks
  const { data: tracks, error } = await supabase
    .from('music_tracks')
    .select('*');

  if (error) {
    console.error('Error fetching tracks:', error);
    return;
  }

  // Define genre mappings based on track names
  const genreMap = {
    'HOUSE IS THE RELIGION': 'House',
    'DISCO': 'Disco House',
    'CLUB LOVE': 'Club',
    'BRAZILIAN SHAWTIES': 'Brazilian Bass',
    'BROOKLYN SPECIAL': 'Hip Hop',
    'LOCO': 'Latin House',
    'FREAK': 'Tech House',
    'TEMPTATION': 'Deep House',
    'PULSE': 'Techno',
    'VIOLENT FLOW': 'Hard Techno',
    'LUNATIC': 'Psychedelic',
    'MELTING': 'Ambient House',
    'DUST': 'Minimal',
    'HORIZON': 'Progressive House',
    'GOBLIN GOLD': 'Bass House',
    'CASH BED': 'Trap',
    'PUDDLE': 'Experimental',
    'REACHING FOR MACHINE': 'Tech House',
    'SET ME FREE': 'Vocal House',
    'TAKE IT': 'Progressive House',
    'TE KLUBI': 'Euro House',
    'THE PATTERN OF FREEDOM': 'Deep House',
    'ALIVE': 'House',
    'BLOW THE COVER': 'Tech House'
  };

  // BPM mappings for different genres
  const bpmMap = {
    'House': 128,
    'Disco House': 118,
    'Club': 130,
    'Brazilian Bass': 128,
    'Hip Hop': 85,
    'Latin House': 125,
    'Tech House': 126,
    'Deep House': 120,
    'Techno': 130,
    'Hard Techno': 140,
    'Psychedelic': 135,
    'Ambient House': 110,
    'Minimal': 125,
    'Progressive House': 128,
    'Bass House': 128,
    'Trap': 75,
    'Experimental': 120,
    'Vocal House': 124,
    'Euro House': 132
  };

  for (const track of tracks) {
    const trackName = track.title.replace(' - NEED FOR GROOVE', '');
    const genre = genreMap[trackName] || 'Electronic';
    const bpm = bpmMap[genre] || 120;

    const { error: updateError } = await supabase
      .from('music_tracks')
      .update({
        artist: 'Need For Groove',
        genre: genre,
        bpm: bpm
      })
      .eq('id', track.id);

    if (updateError) {
      console.error(`Error updating ${track.title}:`, updateError);
    } else {
      console.log(`Updated: ${trackName} - ${genre} (${bpm} BPM)`);
    }
  }

  console.log('Track metadata update complete!');
}

updateTrackMetadata();