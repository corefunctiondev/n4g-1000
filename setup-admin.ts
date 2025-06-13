import { db } from './server/db';
import { users } from './shared/schema';
import bcrypt from 'bcryptjs';

async function setupAdmin() {
  try {
    const adminUsername = 'admin';
    const adminPassword = 'SecureAdminPass2024!';
    
    console.log('Setting up admin user...');
    
    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);
    
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
    
    console.log('✅ Admin user setup complete!');
    console.log('Username:', adminUsername);
    console.log('Password:', adminPassword);
    console.log('');
    console.log('🔒 Access your admin panel at: /admin/login');
    console.log('');
    console.log('SECURITY NOTES:');
    console.log('- Change the password after first login');
    console.log('- This account has full site management access');
    console.log('- Keep credentials secure and private');
    
    process.exit(0);
  } catch (error) {
    console.error('Failed to setup admin user:', error);
    process.exit(1);
  }
}

setupAdmin();