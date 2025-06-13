import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

config();

// Extract URL from environment variable that might include prefix
const rawSupabaseUrl = process.env.SUPABASE_URL;
const supabaseUrl = rawSupabaseUrl?.includes('=') ? rawSupabaseUrl.split('=')[1] : rawSupabaseUrl;

const rawSupabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseAnonKey = rawSupabaseKey?.includes('=') ? rawSupabaseKey.split('=')[1] : rawSupabaseKey;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupSupabaseAdmin() {
  try {
    console.log('Setting up admin user in Supabase...');
    
    // Check if admin user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('username', 'talentin4g')
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking for existing user:', checkError.message);
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    if (existingUser) {
      console.log('Updating existing admin user...');
      
      const { error: updateError } = await supabase
        .from('users')
        .update({
          password: hashedPassword,
          is_admin: true
        })
        .eq('username', 'talentin4g');

      if (updateError) {
        console.error('Error updating user:', updateError.message);
        return;
      }
      
      console.log('✅ Admin user updated successfully');
    } else {
      console.log('Creating new admin user...');
      
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          username: 'talentin4g',
          password: hashedPassword,
          is_admin: true
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating user:', insertError.message);
        return;
      }
      
      console.log('✅ Admin user created successfully');
    }

    // Verify the user was created/updated
    const { data: verifyUser, error: verifyError } = await supabase
      .from('users')
      .select('username, is_admin, created_at')
      .eq('username', 'talentin4g')
      .single();

    if (verifyError) {
      console.error('Error verifying user:', verifyError.message);
      return;
    }

    console.log('\nUser verification:');
    console.log('- Username:', verifyUser.username);
    console.log('- Is Admin:', verifyUser.is_admin);
    console.log('- Created:', verifyUser.created_at);
    console.log('\nAdmin credentials:');
    console.log('Username: talentin4g');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('Error setting up admin user:', error.message);
  }
}

setupSupabaseAdmin();