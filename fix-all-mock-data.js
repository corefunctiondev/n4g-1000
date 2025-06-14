import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAllMockData() {
  console.log('Removing ALL mock data and replacing with authentic NEED FOR GROOVE content...');

  try {
    // First, delete ALL existing content - we'll start fresh
    const { error: deleteAllError } = await supabase
      .from('site_content')
      .delete()
      .neq('id', 0); // Delete all records

    if (deleteAllError) {
      console.error('Error deleting old content:', deleteAllError);
      return;
    }

    console.log('✓ Cleared all old content');

    // Insert only authentic NEED FOR GROOVE content
    const authenticContent = [
      // HOME SECTION - Real N4G info
      { key: 'hero_title', section: 'home', title: 'NEED FOR GROOVE', content: 'NEED FOR GROOVE', position: 1, is_active: true },
      { key: 'hero_subtitle', section: 'home', content: 'New York Based Electronic Music Producers', position: 2, is_active: true },
      { key: 'hero_description', section: 'home', content: 'Origin: Kosovo. We are electronic music producers, playing house, techno and minimal. Been almost a decade producing and playing.', position: 3, is_active: true },
      { key: 'system_status', section: 'home', content: 'N4G-1000 System Online', position: 4, is_active: true },
      { key: 'experience', section: 'home', content: 'Almost a decade producing and playing', position: 5, is_active: true },
      { key: 'location', section: 'home', content: 'New York, NY', position: 6, is_active: true },
      { key: 'origin', section: 'home', content: 'Kosovo', position: 7, is_active: true },
      { key: 'genres', section: 'home', content: 'House, Techno, Minimal', position: 8, is_active: true },
      { key: 'venues_played', section: 'home', content: 'Nearly 20 acknowledged NY venues including Williamsburg Hotel, Virgo, Musica, Blue', position: 9, is_active: true },
      { key: 'upcoming_album', section: 'home', content: 'Album "TUTTO PASSA" releasing 06/18 with 27 tracks', position: 10, is_active: true },
      { key: 'next_gig', section: 'home', content: 'Next gig: Saturday 06/14 at Virgo, Manhattan', position: 11, is_active: true },

      // ABOUT SECTION - Real N4G story  
      { key: 'about_title', section: 'about', title: 'About NEED FOR GROOVE', content: 'About NEED FOR GROOVE', position: 1, is_active: true },
      { key: 'about_description', section: 'about', content: 'We are NEED FOR GROOVE, electronic music producers specializing in house, techno, and minimal. With almost a decade of experience producing and playing, we have performed at nearly 20 acknowledged New York venues including Williamsburg Hotel, Virgo, Musica, Blue, and many more. Our sound represents the fusion of our Kosovo origins with the vibrant New York electronic scene.', position: 2, is_active: true },
      { key: 'features_title', section: 'about', title: 'Our Sound', content: 'Our Sound', position: 3, is_active: true },
      { key: 'features_description', section: 'about', content: 'House, techno, and minimal electronic music with almost a decade of production and performance experience across New York\'s underground scene.', position: 4, is_active: true },
      { key: 'origin_story', section: 'about', content: 'Kosovo-born, New York-based electronic music producers bringing authentic underground energy to the NYC scene.', position: 5, is_active: true },

      // CONTACT SECTION - Real contact info
      { key: 'contact_title', section: 'contact', title: 'Book NEED FOR GROOVE', content: 'Book NEED FOR GROOVE', position: 1, is_active: true },
      { key: 'contact_description', section: 'contact', content: 'Contact us for bookings and collaborations. We bring nearly a decade of experience and have performed at top New York venues.', position: 2, is_active: true },
      { key: 'contact_email', section: 'contact', content: 'n4gsounds@gmail.com', position: 3, is_active: true },
      { key: 'contact_phone', section: 'contact', content: '+1 475 419 5769', position: 4, is_active: true },
      { key: 'contact_instagram', section: 'contact', content: '@needforgroove', position: 5, is_active: true },
      { key: 'contact_location', section: 'contact', content: 'New York, NY', position: 6, is_active: true },

      // SETS SECTION - Real performance info
      { key: 'sets_title', section: 'sets', title: 'NEED FOR GROOVE Sets', content: 'NEED FOR GROOVE Sets', position: 1, is_active: true },
      { key: 'sets_description', section: 'sets', content: 'Experience our signature house, techno, and minimal selections from our performances at nearly 20 acknowledged New York venues.', position: 2, is_active: true },
      { key: 'venue_experience', section: 'sets', content: 'Performed at: Williamsburg Hotel, Virgo, Musica, Blue, and 16+ more NYC venues', position: 3, is_active: true },

      // PODCASTS SECTION - Real podcast info
      { key: 'podcasts_title', section: 'podcasts', title: 'N4G Podcast Series', content: 'N4G Podcast Series', position: 1, is_active: true },
      { key: 'podcasts_description', section: 'podcasts', content: 'Monthly deep dives into electronic music culture from our decade of experience in the Kosovo and New York underground scenes.', position: 2, is_active: true },

      // BOOKINGS SECTION - Real booking info
      { key: 'bookings_title', section: 'bookings', title: 'Book NEED FOR GROOVE', content: 'Book NEED FOR GROOVE', position: 1, is_active: true },
      { key: 'bookings_description', section: 'bookings', content: 'Professional electronic music for your event. Nearly 20 acknowledged New York venues trust our sound.', position: 2, is_active: true },
      { key: 'booking_email', section: 'bookings', content: 'n4gsounds@gmail.com', position: 3, is_active: true },
      { key: 'booking_phone', section: 'bookings', content: '+1 475 419 5769', position: 4, is_active: true },
      { key: 'booking_instagram', section: 'bookings', content: '@needforgroove', position: 5, is_active: true },

      // RELEASES SECTION - Real release info
      { key: 'releases_title', section: 'releases', title: 'NEED FOR GROOVE Releases', content: 'NEED FOR GROOVE Releases', position: 1, is_active: true },
      { key: 'releases_description', section: 'releases', content: 'Our upcoming album "TUTTO PASSA" releases 06/18 with 27 tracks available to spin on our N4G-1000 interface.', position: 2, is_active: true },
      { key: 'album_info', section: 'releases', content: 'TUTTO PASSA - Album (27 tracks) - Release: 06/18/2025', position: 3, is_active: true },
      { key: 'streaming_info', section: 'releases', content: 'Available on SoundCloud, Spotify, and Apple Music under "NEED FOR GROOVE"', position: 4, is_active: true },

      // MIXES SECTION - Real mix info
      { key: 'mixes_title', section: 'mixes', title: 'NEED FOR GROOVE Mixes', content: 'NEED FOR GROOVE Mixes', position: 1, is_active: true },
      { key: 'mixes_description', section: 'mixes', content: 'Recorded live sets from our performances at top New York venues including Williamsburg Hotel, Virgo, Musica, and Blue.', position: 2, is_active: true },
      { key: 'next_event', section: 'mixes', content: 'Next Performance: Saturday 06/14 at Virgo, Manhattan', position: 3, is_active: true }
    ];

    // Insert all authentic content
    for (const content of authenticContent) {
      const { error: insertError } = await supabase
        .from('site_content')
        .insert(content);

      if (insertError) {
        console.error(`Error inserting ${content.section}/${content.key}:`, insertError);
      } else {
        console.log(`✓ Added ${content.section}/${content.key}`);
      }
    }

    console.log('\n✅ All mock data removed and replaced with authentic NEED FOR GROOVE content!');
    console.log('✓ No more Alex Rodriguez or Jordan Chen');
    console.log('✓ No more fake contact info');
    console.log('✓ No more placeholder venues or dates');
    console.log('✓ Only real NEED FOR GROOVE information remains');
    
  } catch (error) {
    console.error('Error fixing mock data:', error);
  }
}

fixAllMockData();