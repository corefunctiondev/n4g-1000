import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

// Extract URL from environment variable that might include prefix
const rawSupabaseUrl = process.env.SUPABASE_URL;
const supabaseUrl = rawSupabaseUrl?.includes('=') ? rawSupabaseUrl.split('=')[1] : rawSupabaseUrl;

const rawSupabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseAnonKey = rawSupabaseKey?.includes('=') ? rawSupabaseKey.split('=')[1] : rawSupabaseKey;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('SUPABASE_URL:', supabaseUrl ? 'Found' : 'Missing');
  console.log('SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Found' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSupabaseData() {
  console.log('🔍 Checking Supabase database...');
  console.log('📡 Supabase URL:', supabaseUrl);
  
  try {
    // Check music_tracks table
    console.log('\n📀 Checking music_tracks table...');
    const { data: tracks, error: tracksError } = await supabase
      .from('music_tracks')
      .select('*')
      .order('created_at', { ascending: true });

    if (tracksError) {
      console.error('❌ Error fetching tracks:', tracksError.message);
    } else {
      console.log(`✅ Found ${tracks.length} tracks in music_tracks table`);
      
      if (tracks.length > 0) {
        console.log('\n🎵 Sample tracks:');
        tracks.slice(0, 5).forEach((track, index) => {
          console.log(`${index + 1}. "${track.title}" by ${track.artist} (${track.bpm} BPM)`);
        });
        
        if (tracks.length > 5) {
          console.log(`... and ${tracks.length - 5} more tracks`);
        }
      }
    }

    // Check site_content table
    console.log('\n📝 Checking site_content table...');
    const { data: content, error: contentError } = await supabase
      .from('site_content')
      .select('*');

    if (contentError) {
      console.error('❌ Error fetching site content:', contentError.message);
    } else {
      console.log(`✅ Found ${content.length} content items in site_content table`);
      
      if (content.length > 0) {
        console.log('\n📄 Content sections:');
        const sections = [...new Set(content.map(item => item.section))];
        sections.forEach(section => {
          const sectionItems = content.filter(item => item.section === section);
          console.log(`- ${section}: ${sectionItems.length} items`);
        });
      }
    }

    // Check users table
    console.log('\n👤 Checking users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, is_admin, created_at');

    if (usersError) {
      console.error('❌ Error fetching users:', usersError.message);
    } else {
      console.log(`✅ Found ${users.length} users in users table`);
      
      if (users.length > 0) {
        console.log('\n👥 Users:');
        users.forEach(user => {
          console.log(`- ${user.username}${user.is_admin ? ' (Admin)' : ''}`);
        });
      }
    }

    // Check tracks table (local schema)
    console.log('\n🎶 Checking tracks table (local schema)...');
    const { data: localTracks, error: localTracksError } = await supabase
      .from('tracks')
      .select('*');

    if (localTracksError) {
      console.error('❌ Error fetching local tracks:', localTracksError.message);
    } else {
      console.log(`✅ Found ${localTracks.length} tracks in tracks table`);
    }

    // Check playlists table
    console.log('\n📚 Checking playlists table...');
    const { data: playlists, error: playlistsError } = await supabase
      .from('playlists')
      .select('*');

    if (playlistsError) {
      console.error('❌ Error fetching playlists:', playlistsError.message);
    } else {
      console.log(`✅ Found ${playlists.length} playlists in playlists table`);
    }

    // Check admin_sessions table
    console.log('\n🔐 Checking admin_sessions table...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('admin_sessions')
      .select('*');

    if (sessionsError) {
      console.error('❌ Error fetching admin sessions:', sessionsError.message);
    } else {
      console.log(`✅ Found ${sessions.length} admin sessions in admin_sessions table`);
    }

    console.log('\n🎯 Data Transfer Summary:');
    console.log('========================');
    console.log(`📀 Music Tracks: ${tracks?.length || 0}`);
    console.log(`📝 Site Content: ${content?.length || 0}`);
    console.log(`👤 Users: ${users?.length || 0}`);
    console.log(`🎶 Local Tracks: ${localTracks?.length || 0}`);
    console.log(`📚 Playlists: ${playlists?.length || 0}`);
    console.log(`🔐 Admin Sessions: ${sessions?.length || 0}`);

  } catch (error) {
    console.error('❌ Connection error:', error.message);
  }
}

checkSupabaseData();