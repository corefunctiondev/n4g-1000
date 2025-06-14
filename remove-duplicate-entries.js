import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Remove duplicate contact info from multiple sections - keep only in contact section
const itemsToUpdate = [
  // Remove phone from sets section
  { key: 'sets_phone', content: null },
  // Remove email from bookings section  
  { key: 'bookings_email', content: null },
  // Remove social from releases section
  { key: 'releases_social', content: null },
  // Remove location from mixes section
  { key: 'mixes_location', content: null },
  
  // Make section titles unique
  { key: 'sets_title', content: 'Live Sets & Performances' },
  { key: 'podcasts_title', content: 'Monthly Audio Journeys' },
  { key: 'bookings_title', content: 'Event Bookings' },
  { key: 'releases_title', content: 'Original Productions' },
  { key: 'mixes_title', content: 'Signature Sound Collections' },
  { key: 'contact_title', content: 'Connect With Us' }
];

async function removeDuplicateEntries() {
  console.log('Removing duplicate content across sections...');
  
  for (const item of itemsToUpdate) {
    try {
      if (item.content === null) {
        // Delete duplicate entries
        const { error } = await supabase
          .from('site_content')
          .delete()
          .eq('key', item.key);
        
        if (error) {
          console.error(`Error deleting ${item.key}:`, error);
        } else {
          console.log(`✓ Deleted duplicate ${item.key}`);
        }
      } else {
        // Update with unique content
        const { error } = await supabase
          .from('site_content')
          .update({ content: item.content, title: item.content })
          .eq('key', item.key);
        
        if (error) {
          console.error(`Error updating ${item.key}:`, error);
        } else {
          console.log(`✓ Updated ${item.key}`);
        }
      }
    } catch (err) {
      console.error(`Failed to process ${item.key}:`, err);
    }
  }
  
  console.log('Duplicate content removal completed!');
}

removeDuplicateEntries();