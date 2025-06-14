import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addReleasesContent() {
  console.log('Adding releases content...');
  
  const releasesContent = {
    key: 'releases_album_info',
    section: 'releases',
    title: 'Album TUTTO PASSA will be out 06/18/25 - go to N4G-1000 to play the songs',
    position: 1,
    is_active: true
  };
  
  const { data, error } = await supabase
    .from('site_content')
    .insert(releasesContent);
    
  if (error) {
    console.error('Error adding releases content:', error);
  } else {
    console.log('Successfully added releases content');
  }
  
  console.log('Releases update complete!');
}

addReleasesContent();