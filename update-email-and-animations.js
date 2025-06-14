import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateEmailAndContent() {
  console.log('Updating email and adding development animations...');
  
  // Update email
  const { error: emailError } = await supabase
    .from('site_content')
    .update({ title: 'n4gsounds@gmail.com' })
    .eq('key', 'bookings_email');
    
  if (emailError) {
    console.error('Error updating email:', emailError);
  } else {
    console.log('Email updated to n4gsounds@gmail.com');
  }
  
  // Update "Coming Soon" to include development animation text
  const comingSoonUpdates = [
    { key: 'podcasts_coming_soon', title: 'Under Development...' },
    { key: 'mixes_coming_soon', title: 'Under Development...' },
    { key: 'sets_coming_soon', title: 'Under Development...' }
  ];
  
  for (const update of comingSoonUpdates) {
    const { error } = await supabase
      .from('site_content')
      .update({ title: update.title })
      .eq('key', update.key);
      
    if (error) {
      console.error(`Error updating ${update.key}:`, error);
    } else {
      console.log(`Updated ${update.key} to "${update.title}"`);
    }
  }
  
  console.log('Updates complete!');
}

updateEmailAndContent();