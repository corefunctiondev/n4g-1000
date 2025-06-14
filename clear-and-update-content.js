import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function clearAndUpdateContent() {
  try {
    console.log('Clearing old content from pages...');
    
    // Delete all content from these sections
    const sectionsToClear = ['podcasts', 'mixes', 'sets', 'releases', 'bookings'];
    
    for (const section of sectionsToClear) {
      const { error } = await supabase
        .from('site_content')
        .delete()
        .eq('section', section);
        
      if (error) {
        console.error(`Error clearing ${section}:`, error);
      } else {
        console.log(`Cleared ${section} section`);
      }
    }
    
    console.log('Adding minimal content...');
    
    // Add minimal content
    const minimalContent = [
      {
        key: 'podcasts_coming_soon',
        section: 'podcasts',
        title: 'Coming Soon',
        position: 1,
        is_active: true
      },
      {
        key: 'mixes_coming_soon',
        section: 'mixes',
        title: 'Coming Soon',
        position: 1,
        is_active: true
      },
      {
        key: 'sets_coming_soon',
        section: 'sets',
        title: 'Coming Soon',
        position: 1,
        is_active: true
      },
      {
        key: 'bookings_email',
        section: 'bookings',
        title: 'needforgroove@gmail.com',
        position: 1,
        is_active: true
      },
      {
        key: 'bookings_social',
        section: 'bookings',
        title: 'Instagram: @needforgroove | SoundCloud: needforgroove',
        position: 2,
        is_active: true
      }
    ];
    
    const { data, error } = await supabase
      .from('site_content')
      .insert(minimalContent);
      
    if (error) {
      console.error('Error adding content:', error);
    } else {
      console.log('Successfully added minimal content');
    }
    
    console.log('Content update complete!');
    
  } catch (error) {
    console.error('Script error:', error);
  }
}

clearAndUpdateContent();