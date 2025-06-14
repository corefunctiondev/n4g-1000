import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const uniqueContent = [
  // Home section - brief intro
  {
    key: 'hero_description',
    content: "Two producers from Kosovo bringing our sound to New York. House, techno, minimal - music that connects people."
  },
  
  // About section - detailed story
  {
    key: 'about_description',
    content: "We're NEED FOR GROOVE - started making music in Kosovo, now calling New York home. Been crafting beats for almost 10 years, learning something new with every track. Our sound blends the underground energy we grew up with and the diverse NYC scene that shaped us."
  },
  {
    key: 'features_description', 
    content: "Deep house grooves, driving techno rhythms, stripped-down minimal beats. Each track is built to move bodies and connect souls on the dancefloor."
  },
  {
    key: 'origin_story',
    content: "Kosovo gave us our foundation - raw passion for electronic music. New York gave us the platform to evolve and share our vision with the world."
  },
  
  // Sets section - performance focus
  {
    key: 'sets_description',
    content: "Live performances where we tell stories through sound. From intimate basement vibes to packed warehouse energy - we adapt our style to match the room and take people on a journey."
  },
  
  // Podcasts section - curated content
  {
    key: 'podcasts_description',
    content: "Monthly audio journeys featuring tracks that inspire us. Deep cuts, fresh discoveries, and timeless classics - curated to showcase the evolution of electronic music."
  },
  
  // Bookings section - professional services
  {
    key: 'bookings_description',
    content: "Ready to bring the energy to your event? We adapt our sound to match your venue's vibe - whether it's an underground warehouse or upscale rooftop."
  },
  
  // Releases section - original music
  {
    key: 'releases_description',
    content: "Our original productions and carefully crafted remixes. TUTTO PASSA drops soon - 27 tracks representing years of growth, late-night studio sessions, and dancefloor magic."
  },
  
  // Contact section - connection focus
  {
    key: 'contact_description',
    content: "Let's connect. Whether you're booking a gig, discussing collaboration, or just want to share your love for electronic music - we're here to listen."
  },
  
  // Mixes section - signature sound
  {
    key: 'mixes_description',
    content: "Signature mixes that capture different moods and moments. Each one is a carefully crafted experience designed to transport you somewhere new."
  }
];

async function fixContentRepetition() {
  console.log('Creating unique content for each section...');
  
  for (const item of uniqueContent) {
    try {
      const { data, error } = await supabase
        .from('site_content')
        .update({ content: item.content })
        .eq('key', item.key);
      
      if (error) {
        console.error(`Error updating ${item.key}:`, error);
      } else {
        console.log(`✓ Updated ${item.key}`);
      }
    } catch (err) {
      console.error(`Failed to update ${item.key}:`, err);
    }
  }
  
  console.log('Content uniqueness updated successfully!');
}

fixContentRepetition();