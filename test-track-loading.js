import { createClient } from '@supabase/supabase-js';

const rawSupabaseUrl = process.env.SUPABASE_URL;
const supabaseUrl = rawSupabaseUrl?.includes('=') ? rawSupabaseUrl.split('=')[1] : rawSupabaseUrl;

const rawSupabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseAnonKey = rawSupabaseKey?.includes('=') ? rawSupabaseKey.split('=')[1] : rawSupabaseKey;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testTrackAccess() {
  console.log('Testing track loading and access...');
  
  // Get a sample track
  const { data: tracks, error } = await supabase
    .from('music_tracks')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching tracks:', error);
    return;
  }

  if (!tracks || tracks.length === 0) {
    console.log('No tracks found');
    return;
  }

  const track = tracks[0];
  console.log(`Testing track: ${track.title}`);
  console.log(`URL: ${track.file_url}`);

  // Test if the URL is accessible
  try {
    const response = await fetch(track.file_url);
    console.log(`HTTP Status: ${response.status}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);
    console.log(`Content-Length: ${response.headers.get('content-length')}`);
    
    if (response.ok) {
      console.log('✓ Track URL is accessible');
    } else {
      console.log('✗ Track URL returned error status');
    }
  } catch (error) {
    console.error('✗ Error accessing track URL:', error);
  }

  // Check bucket permissions
  try {
    const { data: bucketData, error: bucketError } = await supabase.storage
      .from('music')
      .list('', { limit: 1 });

    if (bucketError) {
      console.error('Bucket access error:', bucketError);
    } else {
      console.log('✓ Bucket is accessible');
    }
  } catch (error) {
    console.error('Bucket permission error:', error);
  }
}

testTrackAccess();