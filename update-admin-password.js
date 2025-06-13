#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function updateAdminPassword(username, newPassword) {
  try {
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the password in the database
    const { data, error } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('username', username)
      .eq('is_admin', true)
      .select();

    if (error) {
      throw error;
    }

    if (data && data.length > 0) {
      console.log(`✓ Password updated successfully for admin user: ${username}`);
      console.log(`Updated at: ${new Date().toISOString()}`);
    } else {
      console.log(`No admin user found with username: ${username}`);
    }
  } catch (error) {
    console.error('Error updating password:', error.message);
    process.exit(1);
  }
}

// Get command line arguments
const args = process.argv.slice(2);
if (args.length !== 2) {
  console.log('Usage: node update-admin-password.js <username> <new-password>');
  console.log('Example: node update-admin-password.js talentin4g mynewpassword123');
  process.exit(1);
}

const [username, newPassword] = args;

updateAdminPassword(username, newPassword);