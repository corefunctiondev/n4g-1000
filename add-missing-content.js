import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const missingHomeContent = [
  {
    key: 'system_status_title',
    section: 'home',
    title: 'SYSTEM STATUS:',
    position: 5,
    is_active: true
  },
  {
    key: 'audio_engine_status',
    section: 'home',
    title: '✓ Audio Engine: ONLINE',
    position: 6,
    is_active: true
  },
  {
    key: 'dj_equipment_status',
    section: 'home',
    title: '✓ DJ Equipment: READY',
    position: 7,
    is_active: true
  },
  {
    key: 'music_library_status',
    section: 'home',
    title: '✓ Music Library: LOADED',
    position: 8,
    is_active: true
  },
  {
    key: 'network_status',
    section: 'home',
    title: '✓ Network: CONNECTED',
    position: 9,
    is_active: true
  },
  {
    key: 'active_members_title',
    section: 'home',
    title: 'ACTIVE MEMBERS:',
    position: 10,
    is_active: true
  },
  {
    key: 'member_alex',
    section: 'home',
    title: 'alex@brooklyn.nyc - ONLINE',
    position: 11,
    is_active: true
  },
  {
    key: 'member_jordan',
    section: 'home',
    title: 'jordan@manhattan.nyc - ONLINE',
    position: 12,
    is_active: true
  },
  {
    key: 'latest_notification_title',
    section: 'home',
    title: 'LATEST NOTIFICATION:',
    position: 13,
    is_active: true
  },
  {
    key: 'latest_notification',
    section: 'home',
    title: 'New booking confirmed: Brooklyn Warehouse, Saturday 11PM',
    position: 14,
    is_active: true
  }
];

async function addMissingContent() {
  try {
    console.log('Adding missing home content items...');
    
    for (const item of missingHomeContent) {
      const { data, error } = await supabase
        .from('site_content')
        .insert(item);
      
      if (error) {
        console.error(`Error adding ${item.key}:`, error.message);
      } else {
        console.log(`✓ Added ${item.key}`);
      }
    }
    
    console.log('Finished adding missing content items');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

addMissingContent();