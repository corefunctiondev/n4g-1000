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
    const { section, key } = req.query;

    if (section) {
      // Get content by section
      const { data, error } = await supabase
        .from('site_content')
        .select('*')
        .eq('section', section)
        .eq('is_active', true)
        .order('position');

      if (error) throw error;
      return res.status(200).json(data || []);
    }

    if (key) {
      // Get content by key
      const { data, error } = await supabase
        .from('site_content')
        .select('*')
        .eq('key', key)
        .eq('is_active', true);

      if (error) throw error;
      return res.status(200).json(data || []);
    }

    // Get all content
    const { data, error } = await supabase
      .from('site_content')
      .select('*')
      .eq('is_active', true)
      .order('section', { ascending: true })
      .order('position', { ascending: true });

    if (error) throw error;
    res.status(200).json(data || []);

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}