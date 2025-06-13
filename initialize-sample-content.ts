import { db } from './server/db';
import { siteContent } from './shared/schema';

async function initializeSampleContent() {
  try {
    console.log('Initializing sample website content...');
    
    const sampleContent = [
      // Header Section
      {
        key: 'site_title',
        section: 'header',
        title: 'Need For Groove',
        subtitle: 'Professional DJ & Music Producer',
        position: 1,
        fontSize: 'xl',
        textColor: '#00D9FF',
        isActive: true
      },
      {
        key: 'header_tagline',
        section: 'header',
        content: 'Crafting sonic experiences that move the soul',
        position: 2,
        fontSize: 'medium',
        textColor: '#FFFFFF',
        isActive: true
      },
      
      // Navigation Menu
      {
        key: 'nav_home',
        section: 'navigation',
        title: 'Home',
        linkUrl: '/',
        position: 1,
        isActive: true
      },
      {
        key: 'nav_about',
        section: 'navigation',
        title: 'About',
        linkUrl: '/about',
        position: 2,
        isActive: true
      },
      {
        key: 'nav_mixes',
        section: 'navigation',
        title: 'Mixes',
        linkUrl: '/mixes',
        position: 3,
        isActive: true
      },
      {
        key: 'nav_equipment',
        section: 'navigation',
        title: 'N4G-1000',
        linkUrl: '/n4g-1000',
        position: 4,
        textColor: '#00D9FF',
        isActive: true
      },
      
      // Hero Section
      {
        key: 'hero_main',
        section: 'hero',
        title: 'Welcome to Need For Groove',
        subtitle: 'Digital DJ Experience',
        content: 'Experience professional DJ equipment in your browser with our authentic CDJ-3000 replica featuring your complete music collection.',
        buttonText: 'Launch N4G-1000',
        linkUrl: '/n4g-1000',
        backgroundColor: '#000000',
        textColor: '#FFFFFF',
        fontSize: 'xl',
        position: 1,
        isActive: true
      },
      
      // About Section
      {
        key: 'about_intro',
        section: 'about',
        title: 'About Need For Groove',
        content: 'Need For Groove represents the intersection of technology and musical artistry. Our digital platform recreates the authentic feel of professional DJ equipment while providing access to your complete music library.',
        fontSize: 'large',
        position: 1,
        isActive: true
      },
      {
        key: 'about_features',
        section: 'about',
        title: 'Professional Features',
        content: 'Real-time BPM analysis, beatmatching, 3-band EQ, crossfading, waveform visualization, and seamless track switching - all powered by your Supabase music collection.',
        fontSize: 'medium',
        position: 2,
        isActive: true
      },
      
      // Services Section  
      {
        key: 'services_mixing',
        section: 'services',
        title: 'Live Mixing',
        content: 'Professional mixing capabilities with dual-deck control, tempo adjustment, and real-time effects.',
        position: 1,
        isActive: true
      },
      {
        key: 'services_library',
        section: 'services',
        title: 'Music Library',
        content: 'Access your complete collection of 25 Need For Groove tracks stored securely in Supabase.',
        position: 2,
        isActive: true
      },
      
      // Contact Section
      {
        key: 'contact_info',
        section: 'contact',
        title: 'Get In Touch',
        content: 'Ready to experience the future of digital DJing? Connect with Need For Groove today.',
        buttonText: 'Contact Us',
        fontSize: 'large',
        position: 1,
        isActive: true
      },
      
      // Footer
      {
        key: 'footer_copyright',
        section: 'footer',
        content: '© 2025 Need For Groove. All rights reserved.',
        fontSize: 'small',
        textColor: '#999999',
        position: 1,
        isActive: true
      }
    ];

    // Insert all sample content
    for (const content of sampleContent) {
      await db.insert(siteContent).values(content).onConflictDoNothing();
    }

    console.log('✅ Sample content initialized successfully!');
    console.log(`Created ${sampleContent.length} content pieces across multiple sections:`);
    console.log('- Header: Site title and tagline');
    console.log('- Navigation: Menu items with links');
    console.log('- Hero: Main landing content with call-to-action');
    console.log('- About: Introduction and features');
    console.log('- Services: Mixing and library information');
    console.log('- Contact: Contact information');
    console.log('- Footer: Copyright and legal');
    console.log('');
    console.log('🎛️ Access your admin panel at /admin/login to edit all content');
    console.log('Everything users see is now editable through the admin interface!');
    
  } catch (error) {
    console.error('Failed to initialize sample content:', error);
  }
}

initializeSampleContent();