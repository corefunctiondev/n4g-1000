// Script to migrate existing content to Supabase
const content = [
  // Home page content
  {
    key: "hero_title",
    section: "home",
    title: "Welcome to N4G Terminal OS",
    position: 1,
    is_active: true
  },
  {
    key: "hero_subtitle", 
    section: "home",
    title: "Digital DJ Experience",
    position: 2,
    is_active: true
  },
  {
    key: "hero_description",
    section: "home", 
    content: "Experience DJ Stimulator in your browser with our authentic N4G-1000 featuring our complete music collection.",
    position: 3,
    is_active: true
  },
  {
    key: "cta_button",
    section: "home",
    button_text: "Launch N4G-1000",
    link_url: "/n4g-1000", 
    position: 4,
    is_active: true
  },

  // About page content
  {
    key: "about_title",
    section: "about",
    title: "About Need For Groove",
    position: 1,
    is_active: true
  },
  {
    key: "about_description",
    section: "about",
    content: "Need For Groove represents the intersection of technology and musical artistry. Our digital platform recreates the authentic feel of professional DJ equipment while providing access to our music library.",
    position: 2,
    is_active: true
  },
  {
    key: "features_title",
    section: "about",
    title: "Professional Features",
    position: 3,
    is_active: true
  },
  {
    key: "features_description",
    section: "about",
    content: "Real-time BPM analysis, beatmatching, 3-band EQ, crossfading, waveform visualization, and seamless track switching - all powered by N4G.",
    position: 4,
    is_active: true
  },
  {
    key: "mixing_title",
    section: "about", 
    title: "Live Mixing",
    position: 5,
    is_active: true
  },
  {
    key: "mixing_description",
    section: "about",
    content: "Professional mixing capabilities with dual-deck control, tempo adjustment, and real-time effects.",
    position: 6,
    is_active: true
  },
  {
    key: "library_title",
    section: "about",
    title: "Music Library", 
    position: 7,
    is_active: true
  },
  {
    key: "library_description",
    section: "about",
    content: "Access our music collection of 25 Need For Groove tracks.",
    position: 8,
    is_active: true
  },

  // Contact page content
  {
    key: "contact_title",
    section: "contact",
    title: "Get In Touch",
    position: 1,
    is_active: true
  },
  {
    key: "contact_description", 
    section: "contact",
    content: "Ready to experience the future of digital DJing? Connect with Need For Groove today.",
    position: 2,
    is_active: true
  },

  // Sets page content
  {
    key: "sets_title",
    section: "sets",
    title: "DJ Sets & Performances",
    position: 1,
    is_active: true
  },
  {
    key: "sets_description",
    section: "sets", 
    content: "Explore our collection of live DJ sets and recorded performances featuring the N4G-1000 digital turntable system.",
    position: 2,
    is_active: true
  },

  // Podcasts page content
  {
    key: "podcasts_title",
    section: "podcasts",
    title: "N4G Podcast Series",
    position: 1,
    is_active: true
  },
  {
    key: "podcasts_description",
    section: "podcasts",
    content: "Deep dives into electronic music production, DJ techniques, and the future of digital music technology.",
    position: 2,
    is_active: true
  },

  // Bookings page content  
  {
    key: "bookings_title",
    section: "bookings",
    title: "Book Need For Groove",
    position: 1,
    is_active: true
  },
  {
    key: "bookings_description",
    section: "bookings",
    content: "Available for live performances, club bookings, private events, and music production collaborations.",
    position: 2,
    is_active: true
  },

  // Releases page content
  {
    key: "releases_title", 
    section: "releases",
    title: "Music Releases",
    position: 1,
    is_active: true
  },
  {
    key: "releases_description",
    section: "releases",
    content: "Original tracks, remixes, and collaborative works from the Need For Groove collective.",
    position: 2,
    is_active: true
  },

  // Mixes page content
  {
    key: "mixes_title",
    section: "mixes", 
    title: "DJ Mixes",
    position: 1,
    is_active: true
  },
  {
    key: "mixes_description",
    section: "mixes",
    content: "Curated DJ mixes showcasing the latest in electronic music and exclusive N4G productions.",
    position: 2,
    is_active: true
  }
];

console.log('Content ready for migration:');
console.log(JSON.stringify(content, null, 2));