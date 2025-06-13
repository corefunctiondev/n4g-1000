import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateBusinessInfo() {
  console.log('Updating business information...');

  const updates = [
    // Update company name and remove member references
    { key: 'hero_title', title: 'Welcome to Need For Groove' },
    { key: 'hero_subtitle', title: 'NYC Digital DJ Experience' },
    
    // Update contact information
    { key: 'contact_email', value: 'n4gsounds@gmail.com' },
    { key: 'contact_location', value: 'New York City' },
    
    // Update about section to remove member references
    { key: 'about_title', title: 'About Need For Groove' },
    { key: 'about_description', content: 'Need For Groove is a cutting-edge digital DJ experience based in NYC, bringing you the latest in electronic music and professional mixing technology.' },
    
    // Add upcoming show information
    { key: 'upcoming_show', title: 'Saturday June 14th at Virgo in Manhattan', link_url: '', image_url: '' },
    
    // Update footer and other references
    { key: 'footer_company', title: 'Need For Groove' },
    { key: 'footer_location', title: 'New York City' },
  ];

  for (const update of updates) {
    try {
      // Check if content exists
      const { data: existing } = await supabase
        .from('site_content')
        .select('*')
        .eq('key', update.key)
        .single();

      if (existing) {
        // Update existing content
        const updateData = {};
        if (update.title) updateData.title = update.title;
        if (update.content) updateData.content = update.content;
        if (update.value) updateData.value = update.value;
        if (update.link_url !== undefined) updateData.link_url = update.link_url;
        if (update.image_url !== undefined) updateData.image_url = update.image_url;

        const { error } = await supabase
          .from('site_content')
          .update(updateData)
          .eq('key', update.key);

        if (error) {
          console.error(`Error updating ${update.key}:`, error);
        } else {
          console.log(`Updated ${update.key}`);
        }
      } else {
        // Create new content if it doesn't exist
        const { error } = await supabase
          .from('site_content')
          .insert({
            key: update.key,
            section: update.key.includes('contact') ? 'contact' : 
                    update.key.includes('about') ? 'about' :
                    update.key.includes('footer') ? 'home' :
                    update.key.includes('show') ? 'home' : 'home',
            title: update.title,
            content: update.content,
            value: update.value,
            link_url: update.link_url,
            image_url: update.image_url,
            position: 1,
            is_active: true
          });

        if (error) {
          console.error(`Error creating ${update.key}:`, error);
        } else {
          console.log(`Created ${update.key}`);
        }
      }
    } catch (error) {
      console.error(`Error processing ${update.key}:`, error);
    }
  }

  // Remove old member references if they exist
  const memberKeys = ['member_alex', 'member_sarah', 'member_mike', 'team_member'];
  for (const key of memberKeys) {
    try {
      const { error } = await supabase
        .from('site_content')
        .delete()
        .eq('key', key);
      
      if (!error) {
        console.log(`Removed old member reference: ${key}`);
      }
    } catch (error) {
      console.log(`Member key ${key} didn't exist (this is expected)`);
    }
  }

  console.log('Business information update completed!');
}

updateBusinessInfo().catch(console.error);