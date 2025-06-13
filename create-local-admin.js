import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

config();

// Get database connection details
const { PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE } = process.env;
const databaseUrl = `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}`;

import postgres from 'postgres';
const sql = postgres(databaseUrl, {
  ssl: { rejectUnauthorized: false },
  max: 1,
});

async function createAdminUser() {
  try {
    console.log('Creating admin user in local PostgreSQL database...');
    
    // Check if user already exists
    const existingUser = await sql`
      SELECT username FROM users WHERE username = 'talentin4g'
    `;
    
    if (existingUser.length > 0) {
      console.log('User already exists, updating password...');
      
      // Hash the password
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      // Update existing user
      await sql`
        UPDATE users 
        SET password = ${hashedPassword}, is_admin = true
        WHERE username = 'talentin4g'
      `;
      
      console.log('✅ Admin user password updated successfully');
    } else {
      console.log('Creating new admin user...');
      
      // Hash the password
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      // Create new admin user
      await sql`
        INSERT INTO users (username, password, is_admin, created_at)
        VALUES ('talentin4g', ${hashedPassword}, true, NOW())
      `;
      
      console.log('✅ Admin user created successfully');
    }
    
    // Verify the user
    const verifyUser = await sql`
      SELECT username, is_admin, created_at FROM users WHERE username = 'talentin4g'
    `;
    
    if (verifyUser.length > 0) {
      console.log('User verification:');
      console.log('- Username:', verifyUser[0].username);
      console.log('- Is Admin:', verifyUser[0].is_admin);
      console.log('- Created:', verifyUser[0].created_at);
      console.log('\nAdmin credentials:');
      console.log('Username: talentin4g');
      console.log('Password: admin123');
    }
    
  } catch (error) {
    console.error('Error creating admin user:', error.message);
  } finally {
    await sql.end();
  }
}

createAdminUser();