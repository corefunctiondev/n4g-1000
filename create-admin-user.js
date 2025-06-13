import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { users, siteContent, adminSessions } from './shared/schema.ts';
import bcrypt from 'bcryptjs';
import ws from "ws";
import { neonConfig } from '@neondatabase/serverless';

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema: { users, siteContent, adminSessions } });

async function createAdminUser() {
  try {
    const adminUsername = 'admin';
    const adminPassword = 'SecureAdminPass2024!';
    
    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);
    
    console.log('Setting up admin user in database...');
    
    // Insert or update admin user
    const [adminUser] = await db
      .insert(users)
      .values({
        username: adminUsername,
        password: hashedPassword,
        isAdmin: true
      })
      .onConflictDoUpdate({
        target: users.username,
        set: {
          password: hashedPassword,
          isAdmin: true
        }
      })
      .returning();
    
    console.log('Admin user created/updated successfully:', adminUser.username);
    
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