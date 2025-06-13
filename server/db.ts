import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

// Direct connection to bypass corrupted environment variables
const connectionString = "postgresql://neondb_owner:npg_ZOCP74MXIegS@ep-frosty-moon-a6kl3obs.us-west-2.aws.neon.tech:5432/neondb";

const sql = postgres(connectionString, {
  ssl: { rejectUnauthorized: false },
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(sql, { schema });