import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminUser() {
  try {
    const adminUsername = 'admin';
    const adminPassword = 'SecureAdminPass2024!'; // Change this to your secure password
    
    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);
    
    // Create users table if it doesn't exist
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          is_admin BOOLEAN DEFAULT FALSE NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
        
        CREATE TABLE IF NOT EXISTS site_content (
          id SERIAL PRIMARY KEY,
          key TEXT UNIQUE NOT NULL,
          title TEXT,
          content TEXT,
          image_url TEXT,
          video_url TEXT,
          link_url TEXT,
          is_active BOOLEAN DEFAULT TRUE NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
        
        CREATE TABLE IF NOT EXISTS admin_sessions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) NOT NULL,
          session_token TEXT UNIQUE NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `
    });
    
    if (tableError) {
      console.log('Tables may already exist, continuing...');
    }
    
    // Insert admin user
    const { data, error } = await supabase
      .from('users')
      .upsert({
        username: adminUsername,
        password: hashedPassword,
        is_admin: true
      }, {
        onConflict: 'username'
      });
    
    if (error) {
      console.error('Error creating admin user:', error);
      return;
    }
    
    console.log('✅ Admin user created successfully!');
    console.log('Username:', adminUsername);
    console.log('Password:', adminPassword);
    console.log('');
    console.log('🔒 IMPORTANT SECURITY NOTES:');
    console.log('1. Change the default password immediately after first login');
    console.log('2. Access admin panel at: /admin/login');
    console.log('3. This admin account has full site management access');
    console.log('4. Keep these credentials secure and private');
    
  } catch (error) {
    console.error('Failed to create admin user:', error);
  }
}

createAdminUser();