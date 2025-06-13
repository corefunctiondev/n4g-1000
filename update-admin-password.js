#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { createInterface } from 'readline';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function promptPassword(prompt) {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    // Hide input for password
    const stdin = process.openStdin();
    process.stdin.on('data', char => {
      char = char + '';
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004':
          stdin.pause();
          break;
        default:
          process.stdout.write('\b \b'); // Clear character
          break;
      }
    });
    
    rl.question(prompt, (password) => {
      rl.close();
      console.log(''); // New line after hidden input
      resolve(password);
    });
  });
}

async function updateAdminPassword(username) {
  try {
    // Prompt for password securely (hidden input)
    const newPassword = await promptPassword(`Enter new password for ${username}: `);
    
    if (!newPassword || newPassword.length < 6) {
      console.error('Password must be at least 6 characters long');
      process.exit(1);
    }
    
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
if (args.length !== 1) {
  console.log('Usage: node update-admin-password.js <username>');
  console.log('Example: node update-admin-password.js talentin4g');
  console.log('\nThe script will securely prompt for the new password (hidden input)');
  process.exit(1);
}

const [username] = args;

updateAdminPassword(username);