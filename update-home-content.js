import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateHomeContent() {
  console.log('Updating home page content...');
  
  // Update hero title
  const { error: titleError } = await supabase
    .from('site_content')
    .update({ title: 'New York Based' })
    .eq('key', 'hero_title');
    
  if (titleError) {
    console.error('Error updating hero title:', titleError);
  } else {
    console.log('Updated hero title to "New York Based"');
  }
  
  // Update hero description
  const { error: descError } = await supabase
    .from('site_content')
    .update({ content: 'Two producers from Kosovo bringing our sound to New York. House, techno, minimal - and music that connects people.' })
    .eq('key', 'hero_description');
    
  if (descError) {
    console.error('Error updating hero description:', descError);
  } else {
    console.log('Updated hero description');
  }
  
  console.log('Home page update complete!');
}

updateHomeContent();