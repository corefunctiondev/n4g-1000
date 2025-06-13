import { pgTable, text, serial, integer, timestamp, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const siteContent = pgTable("site_content", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  title: text("title"),
  content: text("content"),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  linkUrl: text("link_url"),
  isActive: boolean("is_active").default(true).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const adminSessions = pgTable("admin_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  sessionToken: text("session_token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tracks = pgTable("tracks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  artist: text("artist"),
  album: text("album"),
  genre: text("genre"),
  bpm: real("bpm").notNull(),
  duration: real("duration").notNull(),
  key: text("key"),
  filePath: text("file_path").notNull(),
  waveformData: text("waveform_data"), // JSON string of waveform data
  cuePoints: text("cue_points"), // JSON array of cue points
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const playlists = pgTable("playlists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const playlistTracks = pgTable("playlist_tracks", {
  id: serial("id").primaryKey(),
  playlistId: integer("playlist_id").references(() => playlists.id).notNull(),
  trackId: integer("track_id").references(() => tracks.id).notNull(),
  position: integer("position").notNull(),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

export const djSessions = pgTable("dj_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  duration: real("duration"), // session duration in seconds
  trackCount: integer("track_count").default(0),
  recordingPath: text("recording_path"), // path to recorded mix file
  sessionData: text("session_data"), // JSON data of session state
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  tracks: many(tracks),
  playlists: many(playlists),
  djSessions: many(djSessions),
  adminSessions: many(adminSessions),
}));

export const adminSessionsRelations = relations(adminSessions, ({ one }) => ({
  user: one(users, {
    fields: [adminSessions.userId],
    references: [users.id],
  }),
}));

export const tracksRelations = relations(tracks, ({ one, many }) => ({
  user: one(users, {
    fields: [tracks.userId],
    references: [users.id],
  }),
  playlistTracks: many(playlistTracks),
}));

export const playlistsRelations = relations(playlists, ({ one, many }) => ({
  user: one(users, {
    fields: [playlists.userId],
    references: [users.id],
  }),
  playlistTracks: many(playlistTracks),
}));

export const playlistTracksRelations = relations(playlistTracks, ({ one }) => ({
  playlist: one(playlists, {
    fields: [playlistTracks.playlistId],
    references: [playlists.id],
  }),
  track: one(tracks, {
    fields: [playlistTracks.trackId],
    references: [tracks.id],
  }),
}));

export const djSessionsRelations = relations(djSessions, ({ one }) => ({
  user: one(users, {
    fields: [djSessions.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertTrackSchema = createInsertSchema(tracks).omit({
  id: true,
  uploadedAt: true,
});

export const insertPlaylistSchema = createInsertSchema(playlists).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlaylistTrackSchema = createInsertSchema(playlistTracks).omit({
  id: true,
  addedAt: true,
});

export const insertDjSessionSchema = createInsertSchema(djSessions).omit({
  id: true,
  createdAt: true,
});

export const insertSiteContentSchema = createInsertSchema(siteContent).omit({
  id: true,
  updatedAt: true,
});

export const insertAdminSessionSchema = createInsertSchema(adminSessions).omit({
  id: true,
  createdAt: true,
});

// Admin login schema
export const adminLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTrack = z.infer<typeof insertTrackSchema>;
export type Track = typeof tracks.$inferSelect;
export type InsertPlaylist = z.infer<typeof insertPlaylistSchema>;
export type Playlist = typeof playlists.$inferSelect;
export type InsertPlaylistTrack = z.infer<typeof insertPlaylistTrackSchema>;
export type PlaylistTrack = typeof playlistTracks.$inferSelect;
export type InsertDjSession = z.infer<typeof insertDjSessionSchema>;
export type DjSession = typeof djSessions.$inferSelect;
export type InsertSiteContent = z.infer<typeof insertSiteContentSchema>;
export type SiteContent = typeof siteContent.$inferSelect;
export type InsertAdminSession = z.infer<typeof insertAdminSessionSchema>;
export type AdminSession = typeof adminSessions.$inferSelect;
export type AdminLogin = z.infer<typeof adminLoginSchema>;
