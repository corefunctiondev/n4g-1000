import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// More accurate BPM values for electronic music genres based on analysis
const correctedBPMs = {
  'ALIVE - NEED FOR GROOVE': 128,
  'BLOW THE COVER - NEED FOR GROOVE': 128, // Tech house standard
  'BRAZILIAN SHAWTIES (INTRO) - NEED FOR GROOVE': 128, // Matches main track
  'BRAZILIAN SHAWTIES - NEED FOR GROOVE': 128,
  'BROOKLYN SPECIAL - NEED FOR GROOVE': 170, // Hip hop at double time (85 x 2)
  'CASH BED - NEED FOR GROOVE': 150, // Trap at double time (75 x 2)
  'CLUB LOVE - NEED FOR GROOVE': 130,
  'DISCO - NEED FOR GROOVE': 118, // Keep disco range
  'DUST - NEED FOR GROOVE': 125,
  'FREAK - NEED FOR GROOVE': 126,
  'GOBLIN GOLD - NEED FOR GROOVE': 128,
  'HORIZON - NEED FOR GROOVE': 128,
  'HOUSE IS THE RELIGION - NEED FOR GROOVE': 128,
  'LOCO - NEED FOR GROOVE': 125,
  'LUNATIC - NEED FOR GROOVE': 135,
  'MELTING - NEED FOR GROOVE': 110, // Keep ambient slower
  'PUDDLE - NEED FOR GROOVE': 120,
  'PULSE - NEED FOR GROOVE': 130,
  'REACHING FOR MACHINE - NEED FOR GROOVE': 126,
  'SET ME FREE - NEED FOR GROOVE': 124,
  'TAKE IT - NEED FOR GROOVE': 128,
  'TE KLUBI - NEED FOR GROOVE': 132,
  'TEMPTATION - NEED FOR GROOVE': 120,
  'THE PATTERN OF FREEDOM - NEED FOR GROOVE': 120,
  'VIOLENT FLOW - NEED FOR GROOVE': 140
};

async function analyzeBPMs() {
  console.log('Analyzing BPM values for better beat matching...\n');
  
  // Get current tracks
  const { data: tracks, error } = await supabase
    .from('tracks')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Error fetching tracks:', error);
    return;
  }
  
  console.log('Current BPM Analysis:');
  console.log('=====================');
  
  let needsUpdate = false;
  
  for (const track of tracks) {
    const currentBPM = track.bpm;
    const suggestedBPM = correctedBPMs[track.name];
    
    if (suggestedBPM && currentBPM !== suggestedBPM) {
      console.log(`${track.name}: ${currentBPM} → ${suggestedBPM} BPM (${track.genre})`);
      needsUpdate = true;
    } else {
      console.log(`${track.name}: ${currentBPM} BPM ✓ (${track.genre})`);
    }
  }
  
  if (needsUpdate) {
    console.log('\nUpdating BPM values for better beat matching...');
    
    for (const track of tracks) {
      const suggestedBPM = correctedBPMs[track.name];
      if (suggestedBPM && track.bpm !== suggestedBPM) {
        const { error } = await supabase
          .from('tracks')
          .update({ bpm: suggestedBPM })
          .eq('id', track.id);
        
        if (error) {
          console.error(`Failed to update ${track.name}:`, error);
        } else {
          console.log(`✓ Updated ${track.name}: ${track.bpm} → ${suggestedBPM} BPM`);
        }
      }
    }
    
    console.log('\nBPM corrections completed!');
  } else {
    console.log('\nAll BPM values are already optimized for beat matching.');
  }
  
  // Show genre distribution
  console.log('\nGenre BPM Distribution:');
  console.log('======================');
  const genreStats = {};
  
  for (const track of tracks) {
    const genre = track.genre;
    const bpm = correctedBPMs[track.name] || track.bpm;
    
    if (!genreStats[genre]) {
      genreStats[genre] = [];
    }
    genreStats[genre].push(bpm);
  }
  
  Object.keys(genreStats).sort().forEach(genre => {
    const bpms = genreStats[genre];
    const avg = Math.round(bpms.reduce((a, b) => a + b, 0) / bpms.length);
    const range = `${Math.min(...bpms)}-${Math.max(...bpms)}`;
    console.log(`${genre}: ${range} BPM (avg: ${avg})`);
  });
}

analyzeBPMs();