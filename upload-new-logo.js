import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = 'https://lyyavdrmviludznyamzr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5eWF2ZHJtdmlsdWR6bnlhbXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMzNDQxNTksImV4cCI6MjA0ODkyMDE1OX0.5EHdaztXALV7Wd8xvg1J1lTwKGWRCjZQoFP2ZYQKfns';

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadNewLogo() {
  try {
    // Upload the new PNG logo
    const pngPath = join(__dirname, 'attached_assets', 'Colorful Playful Bubble Text Motivational Quote T-Shirt_1749866538528.png');
    const pngFile = readFileSync(pngPath);
    
    // Replace the existing logo
    const { data: pngData, error: pngError } = await supabase.storage
      .from('music')
      .upload('logos/n4g-logo.png', pngFile, {
        contentType: 'image/png',
        upsert: true
      });
    
    if (pngError) {
      console.error('PNG upload error:', pngError);
      return;
    }
    
    // Get public URL
    const { data: pngUrlData } = supabase.storage
      .from('music')
      .getPublicUrl('logos/n4g-logo.png');
    
    console.log('New logo uploaded successfully!');
    console.log('PNG URL:', pngUrlData.publicUrl);
    
  } catch (err) {
    console.error('Error uploading logo:', err);
  }
}

uploadNewLogo();