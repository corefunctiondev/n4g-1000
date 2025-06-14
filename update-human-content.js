import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const humanContent = [
  {
    key: 'about_description',
    content: "We're NEED FOR GROOVE - two guys from Kosovo who fell in love with electronic music and ended up in New York. Been making beats and playing gigs for almost 10 years now. Our sound? House, techno, minimal - whatever moves people on the dancefloor. We've played at some amazing spots around NYC like Williamsburg Hotel, Virgo, Musica, Blue... each gig teaches us something new."
  },
  {
    key: 'features_description', 
    content: "Our music comes from the heart - mixing those deep Kosovo roots with the energy of New York's underground scene. No fancy words needed - just beats that make you move."
  },
  {
    key: 'origin_story',
    content: "Started in Kosovo, grew up with electronic music in our ears. New York gave us the platform to share what we love - making people dance and feel something real."
  },
  {
    key: 'hero_description',
    content: "Two producers from Kosovo bringing our sound to New York. House, techno, minimal - music that connects people. Almost a decade of beats, countless nights, one passion."
  },
  {
    key: 'sets_description',
    content: "Every set tells a story. From intimate basement parties to packed warehouse floors - we read the room and deliver the energy. Check out some of our recent performances."
  },
  {
    key: 'podcasts_description',
    content: "Monthly mixes where we share the tracks we're loving right now. Deep dives into house, techno, and minimal - the sounds that inspire us and might inspire you too."
  },
  {
    key: 'bookings_description',
    content: "Looking to book us? We bring the energy whether it's an intimate venue or a massive floor. Hit us up and let's make some magic happen."
  },
  {
    key: 'releases_description',
    content: "Our original tracks and remixes. Each release is a piece of our journey - from late-night studio sessions to dancefloor moments. TUTTO PASSA dropping soon with 27 tracks."
  },
  {
    key: 'contact_description',
    content: "Want to connect? Whether you're a fan, venue owner, or fellow producer - we love hearing from people who share the passion for good music."
  },
  {
    key: 'mixes_description',
    content: "Our signature mixes - carefully crafted journeys through sound. Each one captures a mood, a moment, a feeling we want to share with you."
  }
];

async function updateHumanContent() {
  console.log('Updating content to sound more human...');
  
  for (const item of humanContent) {
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
  
  console.log('Content updated successfully!');
}

updateHumanContent();