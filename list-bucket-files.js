import { createClient } from '@supabase/supabase-js';

const rawSupabaseUrl = process.env.SUPABASE_URL;
const supabaseUrl = rawSupabaseUrl?.includes('=') ? rawSupabaseUrl.split('=')[1] : rawSupabaseUrl;

const rawSupabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseAnonKey = rawSupabaseKey?.includes('=') ? rawSupabaseKey.split('=')[1] : rawSupabaseKey;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listMusicFiles() {
  console.log('Checking your music bucket...');
  
  try {
    const { data, error } = await supabase.storage
      .from('music')
      .list('', {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error) {
      console.error('Error listing files:', error);
      return;
    }

    console.log(`Found ${data.length} files in your music bucket:`);
    
    const audioFiles = data.filter(file => {
      const ext = file.name.toLowerCase();
      return ext.endsWith('.mp3') || ext.endsWith('.wav') || ext.endsWith('.ogg') || ext.endsWith('.m4a') || ext.endsWith('.flac');
    });

    if (audioFiles.length === 0) {
      console.log('No audio files found. Please upload some music files (.mp3, .wav, .ogg, .m4a, .flac) to your music bucket.');
      return;
    }

    console.log('Audio files found:');
    audioFiles.forEach((file, index) => {
      console.log(`${index + 1}. ${file.name}`);
    });

    // Create tracks from your actual music files
    console.log('\nCreating track records for your music...');
    
    const tracks = audioFiles.map(file => {
      // Extract title from filename (remove extension)
      const title = file.name.replace(/\.[^/.]+$/, "");
      
      // Get public URL for the file
      const { data: { publicUrl } } = supabase.storage
        .from('music')
        .getPublicUrl(file.name);

      return {
        title: title,
        artist: 'Your Music', // You can update this manually later
        genre: 'Unknown',
        bpm: 120, // Default BPM, you can update this
        duration: '0:00', // Will be detected when loaded
        file_url: publicUrl
      };
    });

    // Clear existing sample tracks first
    console.log('Removing sample tracks...');
    await supabase
      .from('music_tracks')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    // Insert your actual music
    const { data: insertedTracks, error: insertError } = await supabase
      .from('music_tracks')
      .insert(tracks)
      .select();

    if (insertError) {
      console.error('Error inserting tracks:', insertError);
    } else {
      console.log(`Successfully added ${insertedTracks.length} tracks from your music bucket:`);
      insertedTracks.forEach(track => {
        console.log(`- ${track.title} by ${track.artist}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

listMusicFiles();