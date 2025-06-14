import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAndForceUpdate() {
  console.log('Checking current content...');
  
  const { data: currentContent, error } = await supabase
    .from('site_content')
    .select('*')
    .in('section', ['podcasts', 'mixes', 'sets', 'releases', 'bookings'])
    .order('section', { ascending: true });
    
  if (error) {
    console.error('Error fetching:', error);
    return;
  }
  
  console.log('Current content count:', currentContent.length);
  currentContent.forEach(item => {
    console.log(`${item.section}: ${item.key} = "${item.title}"`);
  });
  
  // Force delete everything in these sections
  console.log('\nForce deleting all content...');
  const { error: deleteError } = await supabase
    .from('site_content')
    .delete()
    .in('section', ['podcasts', 'mixes', 'sets', 'releases', 'bookings']);
    
  if (deleteError) {
    console.error('Delete error:', deleteError);
    return;
  }
  
  console.log('All content deleted');
  
  // Add only minimal content
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
  
  const { data: insertData, error: insertError } = await supabase
    .from('site_content')
    .insert(minimalContent);
    
  if (insertError) {
    console.error('Insert error:', insertError);
  } else {
    console.log('Successfully inserted minimal content');
  }
  
  // Verify final state
  const { data: finalContent } = await supabase
    .from('site_content')
    .select('*')
    .in('section', ['podcasts', 'mixes', 'sets', 'releases', 'bookings'])
    .order('section', { ascending: true });
    
  console.log('\nFinal content:');
  finalContent.forEach(item => {
    console.log(`${item.section}: ${item.key} = "${item.title}"`);
  });
}

checkAndForceUpdate();