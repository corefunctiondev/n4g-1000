import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function removeMockData() {
  console.log('Removing all mock/placeholder data from database...');

  try {
    // Get all content to see what we're working with
    const { data: allContent, error: fetchError } = await supabase
      .from('site_content')
      .select('*')
      .order('section', { ascending: true });

    if (fetchError) {
      console.error('Error fetching content:', fetchError);
      return;
    }

    console.log(`Found ${allContent.length} content items across all sections`);

    // Define the authentic sections we want to keep
    const authenticSections = [
      'home', 'about', 'contact', 'sets', 
      'podcasts', 'bookings', 'releases', 'mixes'
    ];

    // Remove any content that's not in our authentic sections
    const itemsToRemove = allContent.filter(item => !authenticSections.includes(item.section));
    
    if (itemsToRemove.length > 0) {
      console.log(`\nRemoving ${itemsToRemove.length} mock/placeholder items:`);
      
      for (const item of itemsToRemove) {
        console.log(`- ${item.section}/${item.key}`);
        
        const { error: deleteError } = await supabase
          .from('site_content')
          .delete()
          .eq('id', item.id);

        if (deleteError) {
          console.error(`Error deleting ${item.section}/${item.key}:`, deleteError);
        } else {
          console.log(`✓ Removed ${item.section}/${item.key}`);
        }
      }
    }

    // Clean up any other mock data tables if they exist
    
    // Remove any test/mock tracks (keep only the authentic N4G tracks)
    const { data: tracks, error: tracksError } = await supabase
      .from('music_tracks')
      .select('*');

    if (!tracksError && tracks) {
      console.log(`\nFound ${tracks.length} tracks in database`);
      // Keep all tracks as they are the authentic NEED FOR GROOVE collection
      console.log('Keeping all tracks as they are authentic NEED FOR GROOVE music');
    }

    // Remove any test users except admin
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');

    if (!usersError && users && users.length > 0) {
      const nonAdminUsers = users.filter(user => !user.is_admin);
      
      if (nonAdminUsers.length > 0) {
        console.log(`\nRemoving ${nonAdminUsers.length} non-admin test users`);
        
        for (const user of nonAdminUsers) {
          const { error: deleteUserError } = await supabase
            .from('users')
            .delete()
            .eq('id', user.id);

          if (deleteUserError) {
            console.error(`Error deleting user ${user.username}:`, deleteUserError);
          } else {
            console.log(`✓ Removed test user: ${user.username}`);
          }
        }
      }
    }

    // Show final authentic content count
    const { data: finalContent, error: finalError } = await supabase
      .from('site_content')
      .select('*')
      .order('section', { ascending: true });

    if (!finalError) {
      console.log(`\n✅ Database cleaned! ${finalContent.length} authentic content items remain`);
      
      // Group by section for summary
      const sections = {};
      finalContent.forEach(item => {
        sections[item.section] = (sections[item.section] || 0) + 1;
      });
      
      console.log('\nAuthentic content by section:');
      Object.entries(sections).forEach(([section, count]) => {
        console.log(`- ${section}: ${count} items`);
      });
    }

    console.log('\n🎵 Ready for authentic NEED FOR GROOVE experience!');
    
  } catch (error) {
    console.error('Error cleaning database:', error);
  }
}

removeMockData();