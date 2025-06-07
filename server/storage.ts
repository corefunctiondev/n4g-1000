import { users, tracks, playlists, playlistTracks, djSessions, type User, type InsertUser, type Track, type InsertTrack, type Playlist, type InsertPlaylist, type PlaylistTrack, type InsertPlaylistTrack, type DjSession, type InsertDjSession } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Track operations
  getTrack(id: number): Promise<Track | undefined>;
  getUserTracks(userId: number): Promise<Track[]>;
  createTrack(track: InsertTrack): Promise<Track>;
  updateTrack(id: number, track: Partial<InsertTrack>): Promise<Track | undefined>;
  deleteTrack(id: number): Promise<boolean>;
  
  // Playlist operations
  getPlaylist(id: number): Promise<Playlist | undefined>;
  getUserPlaylists(userId: number): Promise<Playlist[]>;
  createPlaylist(playlist: InsertPlaylist): Promise<Playlist>;
  updatePlaylist(id: number, playlist: Partial<InsertPlaylist>): Promise<Playlist | undefined>;
  deletePlaylist(id: number): Promise<boolean>;
  
  // Playlist track operations
  getPlaylistTracks(playlistId: number): Promise<(PlaylistTrack & { track: Track })[]>;
  addTrackToPlaylist(playlistTrack: InsertPlaylistTrack): Promise<PlaylistTrack>;
  removeTrackFromPlaylist(playlistId: number, trackId: number): Promise<boolean>;
  
  // DJ Session operations
  getDjSession(id: number): Promise<DjSession | undefined>;
  getUserDjSessions(userId: number): Promise<DjSession[]>;
  createDjSession(djSession: InsertDjSession): Promise<DjSession>;
  updateDjSession(id: number, djSession: Partial<InsertDjSession>): Promise<DjSession | undefined>;
  deleteDjSession(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Track operations
  async getTrack(id: number): Promise<Track | undefined> {
    const [track] = await db.select().from(tracks).where(eq(tracks.id, id));
    return track || undefined;
  }

  async getUserTracks(userId: number): Promise<Track[]> {
    return await db.select().from(tracks).where(eq(tracks.userId, userId)).orderBy(desc(tracks.uploadedAt));
  }

  async createTrack(track: InsertTrack): Promise<Track> {
    const [newTrack] = await db
      .insert(tracks)
      .values(track)
      .returning();
    return newTrack;
  }

  async updateTrack(id: number, track: Partial<InsertTrack>): Promise<Track | undefined> {
    const [updatedTrack] = await db
      .update(tracks)
      .set(track)
      .where(eq(tracks.id, id))
      .returning();
    return updatedTrack || undefined;
  }

  async deleteTrack(id: number): Promise<boolean> {
    const result = await db.delete(tracks).where(eq(tracks.id, id));
    return result.rowCount > 0;
  }

  // Playlist operations
  async getPlaylist(id: number): Promise<Playlist | undefined> {
    const [playlist] = await db.select().from(playlists).where(eq(playlists.id, id));
    return playlist || undefined;
  }

  async getUserPlaylists(userId: number): Promise<Playlist[]> {
    return await db.select().from(playlists).where(eq(playlists.userId, userId)).orderBy(desc(playlists.updatedAt));
  }

  async createPlaylist(playlist: InsertPlaylist): Promise<Playlist> {
    const [newPlaylist] = await db
      .insert(playlists)
      .values(playlist)
      .returning();
    return newPlaylist;
  }

  async updatePlaylist(id: number, playlist: Partial<InsertPlaylist>): Promise<Playlist | undefined> {
    const [updatedPlaylist] = await db
      .update(playlists)
      .set({ ...playlist, updatedAt: new Date() })
      .where(eq(playlists.id, id))
      .returning();
    return updatedPlaylist || undefined;
  }

  async deletePlaylist(id: number): Promise<boolean> {
    const result = await db.delete(playlists).where(eq(playlists.id, id));
    return result.rowCount > 0;
  }

  // Playlist track operations
  async getPlaylistTracks(playlistId: number): Promise<(PlaylistTrack & { track: Track })[]> {
    return await db
      .select({
        id: playlistTracks.id,
        playlistId: playlistTracks.playlistId,
        trackId: playlistTracks.trackId,
        position: playlistTracks.position,
        addedAt: playlistTracks.addedAt,
        track: tracks,
      })
      .from(playlistTracks)
      .innerJoin(tracks, eq(playlistTracks.trackId, tracks.id))
      .where(eq(playlistTracks.playlistId, playlistId))
      .orderBy(playlistTracks.position);
  }

  async addTrackToPlaylist(playlistTrack: InsertPlaylistTrack): Promise<PlaylistTrack> {
    const [newPlaylistTrack] = await db
      .insert(playlistTracks)
      .values(playlistTrack)
      .returning();
    return newPlaylistTrack;
  }

  async removeTrackFromPlaylist(playlistId: number, trackId: number): Promise<boolean> {
    const result = await db
      .delete(playlistTracks)
      .where(and(eq(playlistTracks.playlistId, playlistId), eq(playlistTracks.trackId, trackId)));
    return result.rowCount > 0;
  }

  // DJ Session operations
  async getDjSession(id: number): Promise<DjSession | undefined> {
    const [session] = await db.select().from(djSessions).where(eq(djSessions.id, id));
    return session || undefined;
  }

  async getUserDjSessions(userId: number): Promise<DjSession[]> {
    return await db.select().from(djSessions).where(eq(djSessions.userId, userId)).orderBy(desc(djSessions.createdAt));
  }

  async createDjSession(djSession: InsertDjSession): Promise<DjSession> {
    const [newSession] = await db
      .insert(djSessions)
      .values(djSession)
      .returning();
    return newSession;
  }

  async updateDjSession(id: number, djSession: Partial<InsertDjSession>): Promise<DjSession | undefined> {
    const [updatedSession] = await db
      .update(djSessions)
      .set(djSession)
      .where(eq(djSessions.id, id))
      .returning();
    return updatedSession || undefined;
  }

  async deleteDjSession(id: number): Promise<boolean> {
    const result = await db.delete(djSessions).where(eq(djSessions.id, id));
    return result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
