import { z } from "zod";

// Type definitions for Supabase tables
export interface User {
  id: number;
  username: string;
  password: string;
  is_admin: boolean;
  created_at: string;
}

export interface SiteContent {
  id: number;
  key: string;
  section: string;
  title?: string;
  subtitle?: string;
  content?: string;
  value?: string;
  image_url?: string;
  video_url?: string;
  link_url?: string;
  button_text?: string;
  background_color?: string;
  text_color?: string;
  font_size?: string;
  position: number;
  is_active: boolean;
  updated_at: string;
  created_at: string;
}

export interface Track {
  id: number;
  name: string;
  artist: string;
  bpm: number;
  duration: string;
  genre: string;
  url: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface Playlist {
  id: number;
  name: string;
  description?: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface PlaylistTrack {
  id: number;
  playlist_id: number;
  track_id: number;
  position: number;
  created_at: string;
}

export interface DjSession {
  id: number;
  name: string;
  description?: string;
  user_id: number;
  session_data?: any;
  created_at: string;
  updated_at: string;
}

export interface AdminSession {
  id: number;
  user_id: number;
  session_token: string;
  expires_at: string;
  created_at: string;
}

// Zod schemas for validation
export const insertUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  is_admin: z.boolean().default(false),
});

export const insertSiteContentSchema = z.object({
  key: z.string().min(1),
  section: z.string().min(1),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  content: z.string().optional(),
  value: z.string().optional(),
  image_url: z.string().optional(),
  video_url: z.string().optional(),
  link_url: z.string().optional(),
  button_text: z.string().optional(),
  background_color: z.string().optional(),
  text_color: z.string().optional(),
  font_size: z.string().optional(),
  position: z.number().default(0),
  is_active: z.boolean().default(true),
});

export const insertTrackSchema = z.object({
  name: z.string().min(1),
  artist: z.string().min(1),
  bpm: z.number().min(1),
  duration: z.string(),
  genre: z.string(),
  url: z.string().url(),
  user_id: z.number(),
});

export const insertPlaylistSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  user_id: z.number(),
});

export const insertPlaylistTrackSchema = z.object({
  playlist_id: z.number(),
  track_id: z.number(),
  position: z.number(),
});

export const insertDjSessionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  user_id: z.number(),
  session_data: z.any().optional(),
});

export const insertAdminSessionSchema = z.object({
  user_id: z.number(),
  session_token: z.string(),
  expires_at: z.string(),
});

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Type inference
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertSiteContent = z.infer<typeof insertSiteContentSchema>;
export type InsertTrack = z.infer<typeof insertTrackSchema>;
export type InsertPlaylist = z.infer<typeof insertPlaylistSchema>;
export type InsertPlaylistTrack = z.infer<typeof insertPlaylistTrackSchema>;
export type InsertDjSession = z.infer<typeof insertDjSessionSchema>;
export type InsertAdminSession = z.infer<typeof insertAdminSessionSchema>;
export type AdminLogin = z.infer<typeof adminLoginSchema>;