import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = 'https://lyyavdrmviludznyamzr.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5eWF2ZHJtdmlsdWR6bnlhbXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMzNDQxNTksImV4cCI6MjA0ODkyMDE1OX0.5EHdaztXALV7Wd8xvg1J1lTwKGWRCjZQoFP2ZYQKfns';

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadLogo() {
  try {
    // Read the logo file
    const logoPath = join(__dirname, 'attached_assets', '13_1749865869309.png');
    const logoFile = readFileSync(logoPath);
    
    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('music')
      .upload('logos/n4g-logo.png', logoFile, {
        contentType: 'image/png',
        upsert: true
      });
    
    if (error) {
      console.error('Upload error:', error);
      return;
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('music')
      .getPublicUrl('logos/n4g-logo.png');
    
    console.log('Logo uploaded successfully!');
    console.log('Public URL:', urlData.publicUrl);
    
  } catch (err) {
    console.error('Error uploading logo:', err);
  }
}

uploadLogo();