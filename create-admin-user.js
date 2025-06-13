import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Creating admin user in Supabase Auth...');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

try {
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'admin@needforgroove.com',
    password: 'admin123',
    user_metadata: {
      is_admin: true
    }
  });

  if (error) {
    console.error('Error creating admin user:', error.message);
  } else {
    console.log('✓ Admin user created successfully');
    console.log('Email:', data.user?.email);
    console.log('User ID:', data.user?.id);
    console.log('Admin status:', data.user?.user_metadata?.is_admin);
  }
} catch (err) {
  console.error('Script error:', err.message);
}