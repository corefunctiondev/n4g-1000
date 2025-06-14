import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateRealContent() {
  console.log('Updating site content with authentic NEED FOR GROOVE information...');

  const updates = [
    // HOME SECTION
    { key: 'hero_title', section: 'home', content: 'NEED FOR GROOVE' },
    { key: 'hero_subtitle', section: 'home', content: 'New York Based Electronic Music Producers' },
    { key: 'hero_description', section: 'home', content: 'Origin: Kosovo. We are electronic music producers, playing house, techno and minimal. Been almost a decade producing and playing.' },
    { key: 'cta_primary', section: 'home', content: 'Experience N4G-1000' },
    { key: 'cta_secondary', section: 'home', content: 'Book Us Now' },
    { key: 'location', section: 'home', content: 'New York, NY' },
    { key: 'origin', section: 'home', content: 'Kosovo' },
    { key: 'experience', section: 'home', content: 'Almost a decade producing and playing' },
    { key: 'genres', section: 'home', content: 'House, Techno, Minimal' },
    { key: 'system_status', section: 'home', content: 'N4G-1000 System Online' },
    { key: 'member_count', section: 'home', content: '2 Active Producers' },
    { key: 'notification_1', section: 'home', content: 'Album "TUTTO PASSA" releasing 06/18 with 27 tracks' },
    { key: 'notification_2', section: 'home', content: 'Next gig: Saturday 06/14 at Virgo, Manhattan' },
    { key: 'terminal_prompt', section: 'home', content: 'N4G-1000>' },

    // ABOUT SECTION
    { key: 'about_title', section: 'about', content: 'About NEED FOR GROOVE' },
    { key: 'about_subtitle', section: 'about', content: 'Kosovo-born, New York-based Electronic Music Producers' },
    { key: 'about_description', section: 'about', content: 'We are NEED FOR GROOVE, electronic music producers specializing in house, techno, and minimal. With almost a decade of experience producing and playing, we have performed at nearly 20 acknowledged New York venues including Williamsburg Hotel, Virgo, Musica, Blue, and many more. Our sound represents the fusion of our Kosovo origins with the vibrant New York electronic scene.' },
    { key: 'about_mission', section: 'about', content: 'Our mission is to create immersive electronic experiences that transport listeners through carefully crafted soundscapes, blending traditional electronic elements with innovative production techniques.' },
    { key: 'about_vision', section: 'about', content: 'We envision a world where electronic music serves as a universal language, connecting cultures and communities through the power of rhythm and melody.' },
    { key: 'about_approach', section: 'about', content: 'Our approach combines technical precision with emotional depth, ensuring every track tells a story while maintaining the energy that moves dance floors.' },

    // CONTACT SECTION
    { key: 'contact_title', section: 'contact', content: 'Book NEED FOR GROOVE' },
    { key: 'contact_subtitle', section: 'contact', content: 'Ready to bring authentic electronic energy to your event?' },
    { key: 'contact_description', section: 'contact', content: 'Contact us for bookings and collaborations. We bring nearly a decade of experience and have performed at top New York venues.' },
    { key: 'contact_email', section: 'contact', content: 'n4gsounds@gmail.com' },
    { key: 'contact_phone', section: 'contact', content: '+1 475 419 5769' },
    { key: 'contact_instagram', section: 'contact', content: '@needforgroove' },
    { key: 'contact_location', section: 'contact', content: 'New York, NY' },

    // SETS SECTION
    { key: 'sets_title', section: 'sets', content: 'NEED FOR GROOVE Sets' },
    { key: 'sets_subtitle', section: 'sets', content: 'Experience our signature house, techno, and minimal selections' },
    { key: 'sets_description', section: 'sets', content: 'Explore our curated sets featuring the best in electronic music. Each mix represents our journey through the underground scenes of Kosovo and New York.' },
    { key: 'set_1_title', section: 'sets', content: 'Deep House Sessions' },
    { key: 'set_1_description', section: 'sets', content: 'Smooth, deep house vibes perfect for intimate venues and late-night sessions.' },
    { key: 'set_2_title', section: 'sets', content: 'Techno Underground' },
    { key: 'set_2_description', section: 'sets', content: 'Hard-hitting techno tracks that showcase our roots in the underground scene.' },
    { key: 'set_3_title', section: 'sets', content: 'Minimal Expressions' },
    { key: 'set_3_description', section: 'sets', content: 'Stripped-down minimal compositions that highlight rhythm and space.' },

    // PODCASTS SECTION
    { key: 'podcasts_title', section: 'podcasts', content: 'N4G Podcast Series' },
    { key: 'podcasts_subtitle', section: 'podcasts', content: 'Monthly deep dives into electronic music culture' },
    { key: 'podcasts_description', section: 'podcasts', content: 'Join us for monthly podcasts where we explore the electronic music landscape, share insights from our decade of experience, and preview upcoming releases.' },

    // BOOKINGS SECTION
    { key: 'bookings_title', section: 'bookings', content: 'Book NEED FOR GROOVE' },
    { key: 'bookings_subtitle', section: 'bookings', content: 'Professional electronic music for your event' },
    { key: 'bookings_description', section: 'bookings', content: 'We have performed at nearly 20 acknowledged New York venues including Williamsburg Hotel, Virgo, Musica, and Blue. Contact us to discuss your event needs.' },
    { key: 'booking_email', section: 'bookings', content: 'n4gsounds@gmail.com' },
    { key: 'booking_phone', section: 'bookings', content: '+1 475 419 5769' },
    { key: 'booking_instagram', section: 'bookings', content: '@needforgroove' },
    { key: 'availability', section: 'bookings', content: 'Available for clubs, private events, and festivals' },

    // RELEASES SECTION
    { key: 'releases_title', section: 'releases', content: 'NEED FOR GROOVE Releases' },
    { key: 'releases_subtitle', section: 'releases', content: 'Latest productions and upcoming album' },
    { key: 'releases_description', section: 'releases', content: 'Discover our musical journey through original productions. Our upcoming album "TUTTO PASSA" releases 06/18 with 27 tracks available to spin on our N4G-1000 interface.' },
    { key: 'upcoming_album', section: 'releases', content: 'TUTTO PASSA - Album (27 tracks) - Release: 06/18/2025' },
    { key: 'streaming_soundcloud', section: 'releases', content: 'NEED FOR GROOVE on SoundCloud' },
    { key: 'streaming_spotify', section: 'releases', content: 'NEED FOR GROOVE on Spotify' },
    { key: 'streaming_apple', section: 'releases', content: 'NEED FOR GROOVE on Apple Music' },

    // MIXES SECTION
    { key: 'mixes_title', section: 'mixes', content: 'NEED FOR GROOVE Mixes' },
    { key: 'mixes_subtitle', section: 'mixes', content: 'Curated selections from our live performances' },
    { key: 'mixes_description', section: 'mixes', content: 'Experience the energy of our live sets with these carefully recorded mixes from our performances at top New York venues.' },
    { key: 'next_event', section: 'mixes', content: 'Next Performance: Saturday 06/14 at Virgo, Manhattan' },
    { key: 'mix_1_title', section: 'mixes', content: 'Williamsburg Hotel Set' },
    { key: 'mix_1_description', section: 'mixes', content: 'Live recording from our performance at the iconic Williamsburg Hotel.' },
    { key: 'mix_2_title', section: 'mixes', content: 'Virgo Underground' },
    { key: 'mix_2_description', section: 'mixes', content: 'Deep cuts and unreleased tracks from our Virgo residency.' }
  ];

  try {
    for (const update of updates) {
      const { data, error } = await supabase
        .from('site_content')
        .update({ content: update.content, updated_at: new Date().toISOString() })
        .eq('key', update.key)
        .eq('section', update.section);

      if (error) {
        console.error(`Error updating ${update.key}:`, error);
      } else {
        console.log(`✓ Updated ${update.section}/${update.key}`);
      }
    }

    console.log('\n✅ All content updated successfully with authentic NEED FOR GROOVE information!');
    console.log('Updated sections: home, about, contact, sets, podcasts, bookings, releases, mixes');
    
  } catch (error) {
    console.error('Error updating content:', error);
  }
}

updateRealContent();