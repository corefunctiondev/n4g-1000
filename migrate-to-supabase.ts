import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "./shared/schema";

// Local database connection
const localConnectionString = "postgresql://neondb_owner:npg_ZOCP74MXIegS@ep-frosty-moon-a6kl3obs.us-west-2.aws.neon.tech:5432/neondb";
const localSql = postgres(localConnectionString, {
  ssl: { rejectUnauthorized: false },
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
});
const localDb = drizzle(localSql, { schema });

// Supabase database connection
const supabaseUrl = "https://lyyavdrmviludznyamzr.supabase.co";
const projectRef = "lyyavdrmviludznyamzr";
const supabaseConnectionString = `postgresql://postgres.${projectRef}:PASSWORD@aws-0-us-west-1.pooler.supabase.com:6543/postgres`;

// Since we need the actual database password, let's use the pooler URL format
const supabaseSql = postgres(supabaseConnectionString.replace('PASSWORD', 'Talenti2025@'), {
  ssl: { rejectUnauthorized: false },
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
});
const supabaseDb = drizzle(supabaseSql, { schema });

async function migrateData() {
  try {
    console.log('🔄 Starting data migration from local to Supabase...');

    // Migrate users table
    console.log('Migrating users...');
    const users = await localDb.select().from(schema.users);
    if (users.length > 0) {
      await supabaseDb.insert(schema.users).values(users).onConflictDoNothing();
      console.log(`✅ Migrated ${users.length} users`);
    }

    // Migrate site_content table
    console.log('Migrating site content...');
    const siteContent = await localDb.select().from(schema.siteContent);
    if (siteContent.length > 0) {
      await supabaseDb.insert(schema.siteContent).values(siteContent).onConflictDoNothing();
      console.log(`✅ Migrated ${siteContent.length} site content items`);
    }

    // Migrate admin_sessions table
    console.log('Migrating admin sessions...');
    const adminSessions = await localDb.select().from(schema.adminSessions);
    if (adminSessions.length > 0) {
      await supabaseDb.insert(schema.adminSessions).values(adminSessions).onConflictDoNothing();
      console.log(`✅ Migrated ${adminSessions.length} admin sessions`);
    }

    // Migrate tracks table
    console.log('Migrating tracks...');
    const tracks = await localDb.select().from(schema.tracks);
    if (tracks.length > 0) {
      await supabaseDb.insert(schema.tracks).values(tracks).onConflictDoNothing();
      console.log(`✅ Migrated ${tracks.length} tracks`);
    }

    // Migrate playlists table
    console.log('Migrating playlists...');
    const playlists = await localDb.select().from(schema.playlists);
    if (playlists.length > 0) {
      await supabaseDb.insert(schema.playlists).values(playlists).onConflictDoNothing();
      console.log(`✅ Migrated ${playlists.length} playlists`);
    }

    // Migrate playlist_tracks table
    console.log('Migrating playlist tracks...');
    const playlistTracks = await localDb.select().from(schema.playlistTracks);
    if (playlistTracks.length > 0) {
      await supabaseDb.insert(schema.playlistTracks).values(playlistTracks).onConflictDoNothing();
      console.log(`✅ Migrated ${playlistTracks.length} playlist tracks`);
    }

    // Migrate dj_sessions table
    console.log('Migrating DJ sessions...');
    const djSessions = await localDb.select().from(schema.djSessions);
    if (djSessions.length > 0) {
      await supabaseDb.insert(schema.djSessions).values(djSessions).onConflictDoNothing();
      console.log(`✅ Migrated ${djSessions.length} DJ sessions`);
    }

    console.log('🎉 Migration completed successfully!');
    console.log('All your data has been transferred to Supabase.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await localSql.end();
    await supabaseSql.end();
  }
}

// Run the migration
migrateData().catch(console.error);