import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// BPM corrections for better beat matching
const bpmCorrections = [
  { id: '57c6086e-c574-491f-9e16-ab2eba28aa40', bpm: 128 }, // BLOW THE COVER - 126 to 128
  { id: 'fc9a3dbe-be2e-4789-b147-43ac50429c4d', bpm: 128 }, // BRAZILIAN SHAWTIES INTRO - 120 to 128  
  { id: '8b8b8f3b-2483-4284-80c3-31153919feb7', bpm: 170 }, // BROOKLYN SPECIAL - 85 to 170 (double time)
  { id: 'ab1457ce-1c2c-4d6a-8fa4-3750f5b73783', bpm: 150 }, // CASH BED - 75 to 150 (double time)
  { id: 'ce4c36d5-b5f7-48fb-aa07-e27800cbfcff', bpm: 128 }, // FREAK - 126 to 128
  { id: 'fa6a43da-ac18-435d-a70a-fb5fb92ffd84', bpm: 128 }  // REACHING FOR MACHINE - 126 to 128
];

async function fixTrackBPMs() {
  console.log('Correcting BPM values for better beat matching...');
  
  for (const correction of bpmCorrections) {
    try {
      // First get current track info
      const { data: track, error: fetchError } = await supabase
        .from('tracks')
        .select('name, bpm')
        .eq('id', correction.id)
        .single();
      
      if (fetchError) {
        console.error(`Failed to fetch track ${correction.id}:`, fetchError);
        continue;
      }
      
      // Update BPM
      const { error: updateError } = await supabase
        .from('tracks')
        .update({ bpm: correction.bpm })
        .eq('id', correction.id);
      
      if (updateError) {
        console.error(`Failed to update ${track.name}:`, updateError);
      } else {
        console.log(`✓ ${track.name}: ${track.bpm} → ${correction.bpm} BPM`);
      }
    } catch (err) {
      console.error(`Error processing correction:`, err);
    }
  }
  
  console.log('\nBPM corrections completed! Beat matching should work better now.');
  
  // Show final BPM distribution
  console.log('\nFinal BPM Distribution:');
  console.log('======================');
  
  const { data: allTracks } = await supabase
    .from('tracks')
    .select('name, bpm, genre')
    .order('bpm');
  
  if (allTracks) {
    allTracks.forEach(track => {
      console.log(`${track.bpm} BPM - ${track.name} (${track.genre})`);
    });
  }
}

fixTrackBPMs();