import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Corrected BPM values for better beat matching
const bpmFixes = [
  { name: 'BLOW THE COVER - NEED FOR GROOVE', bpm: 128 },
  { name: 'BRAZILIAN SHAWTIES (INTRO) - NEED FOR GROOVE', bpm: 128 },
  { name: 'BROOKLYN SPECIAL - NEED FOR GROOVE', bpm: 170 }, // Hip hop double time
  { name: 'CASH BED - NEED FOR GROOVE', bpm: 150 }, // Trap double time
  { name: 'FREAK - NEED FOR GROOVE', bpm: 128 },
  { name: 'REACHING FOR MACHINE - NEED FOR GROOVE', bpm: 128 }
];

async function fixBPMs() {
  console.log('Fixing BPM values for better beat matching...');
  
  for (const fix of bpmFixes) {
    try {
      const { error } = await supabase
        .from('tracks')
        .update({ bpm: fix.bpm })
        .eq('name', fix.name);
      
      if (error) {
        console.error(`Failed to update ${fix.name}:`, error);
      } else {
        console.log(`✓ Fixed ${fix.name}: ${fix.bpm} BPM`);
      }
    } catch (err) {
      console.error(`Error updating ${fix.name}:`, err);
    }
  }
  
  console.log('BPM corrections completed!');
}

fixBPMs();