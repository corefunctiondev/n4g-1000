import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users } from './shared/schema.js';
import { eq } from 'drizzle-orm';

// Construct DATABASE_URL from individual environment variables if needed
let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl || databaseUrl.includes('NEXT_PUBLIC_SUPABASE_URL') || !databaseUrl.startsWith('postgres')) {
  const { PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE } = process.env;
  
  if (!PGHOST || !PGPORT || !PGUSER || !PGPASSWORD || !PGDATABASE) {
    throw new Error("Database connection details missing. Please ensure PostgreSQL is properly configured.");
  }
  
  databaseUrl = `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}`;
}

const sql = postgres(databaseUrl, {
  ssl: { rejectUnauthorized: false },
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
});

const db = drizzle(sql, { schema: { users } });

async function checkAdminUser() {
  try {
    console.log('Checking admin user in local PostgreSQL database...');
    
    const result = await db.select().from(users).where(eq(users.username, 'talentin4g'));
    
    if (result.length === 0) {
      console.log('❌ No user found with username "talentin4g"');
      
      // Check all users
      const allUsers = await db.select().from(users);
      console.log(`Found ${allUsers.length} total users:`);
      allUsers.forEach(user => {
        console.log(`- ${user.username} (Admin: ${user.isAdmin})`);
      });
    } else {
      const user = result[0];
      console.log('✅ User found:');
      console.log('Username:', user.username);
      console.log('Is Admin:', user.isAdmin);
      console.log('Password Hash Present:', user.password ? 'Yes' : 'No');
      console.log('Password Hash Length:', user.password?.length || 0);
      console.log('Created At:', user.createdAt);
    }
    
  } catch (error) {
    console.error('Error checking admin user:', error.message);
  } finally {
    await sql.end();
  }
}

checkAdminUser();