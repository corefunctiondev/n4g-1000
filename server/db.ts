import { createClient } from '@supabase/supabase-js';

// Extract Supabase credentials
const rawSupabaseUrl = process.env.SUPABASE_URL;
const supabaseUrl = rawSupabaseUrl?.includes('=') ? rawSupabaseUrl.split('=')[1] : rawSupabaseUrl;

const rawSupabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseAnonKey = rawSupabaseKey?.includes('=') ? rawSupabaseKey.split('=')[1] : rawSupabaseKey;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);