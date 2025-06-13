import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Get command line arguments
const email = process.argv[2];

if (!email) {
  console.log('Usage: node set-admin-flag.js <email>');
  console.log('Example: node set-admin-flag.js admin@example.com');
  process.exit(1);
}

try {
  // First, get the user by email
  const { data: users, error: getUserError } = await supabase.auth.admin.listUsers();
  
  if (getUserError) {
    console.error('Error getting users:', getUserError.message);
    process.exit(1);
  }

  const user = users.users.find(u => u.email === email);
  
  if (!user) {
    console.error(`User with email ${email} not found`);
    process.exit(1);
  }

  // Update user metadata to set admin flag
  const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: {
      is_admin: true
    }
  });

  if (error) {
    console.error('Error setting admin flag:', error.message);
    process.exit(1);
  }

  console.log(`✓ Admin flag set successfully for user: ${email}`);
  console.log(`User ID: ${user.id}`);
  console.log(`Admin status: ${data.user?.user_metadata?.is_admin}`);
} catch (err) {
  console.error('Script error:', err.message);
}