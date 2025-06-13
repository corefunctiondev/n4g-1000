import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Use the Supabase connection string directly
const DATABASE_URL = "postgresql://postgres:80thMowOAcEXusGD@db.lyyavdrmviludznyamzr.supabase.co:5432/postgres";

export const pool = new Pool({ connectionString: DATABASE_URL });
export const db = drizzle({ client: pool, schema });