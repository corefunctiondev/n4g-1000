import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('music_tracks')
        .select('*')
        .order('name');

      if (error) throw error;
      return res.status(200).json(data || []);
    }

    res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Tracks API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}