import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateHeroTitle() {
  console.log('Updating hero title and subtitle...');
  
  // Update hero title
  const { error: titleError } = await supabase
    .from('site_content')
    .update({ title: 'Need For Groove' })
    .eq('key', 'hero_title');
    
  if (titleError) {
    console.error('Error updating hero title:', titleError);
  } else {
    console.log('Updated hero title to "Need For Groove"');
  }
  
  // Update hero subtitle
  const { error: subtitleError } = await supabase
    .from('site_content')
    .update({ subtitle: 'New York Based' })
    .eq('key', 'hero_title');
    
  if (subtitleError) {
    console.error('Error updating hero subtitle:', subtitleError);
  } else {
    console.log('Updated hero subtitle to "New York Based"');
  }
  
  console.log('Hero title update complete!');
}

updateHeroTitle();