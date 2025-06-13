import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

// Construct DATABASE_URL from individual environment variables if needed
let databaseUrl = process.env.DATABASE_URL;

// If DATABASE_URL is malformed or contains wrong content, reconstruct it
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

export const db = drizzle(sql, { schema });