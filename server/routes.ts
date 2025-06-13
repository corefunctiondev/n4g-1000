import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { supabase } from "./supabase";
import { insertTrackSchema, insertPlaylistSchema, insertDjSessionSchema, adminLoginSchema, insertSiteContentSchema } from "@shared/schema";
import { 
  requireAdmin, 
  verifyPassword, 
  createAdminSession, 
  cleanupExpiredSessions,
  hashPassword,
  type AuthenticatedRequest 
} from "./admin-auth";
import cookieParser from 'cookie-parser';
import { db } from "./db";
import { users, siteContent } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Add cookie parser middleware for admin sessions
  app.use(cookieParser());
  
  // Initialize database schema on first request
  let schemaInitialized = false;
  
  async function ensureSchema() {
    if (schemaInitialized) return;
    
    try {
      // Try to query the table first
      const { data, error } = await supabase
        .from('music_tracks')
        .select('count')
        .limit(1);
      
      if (error && error.code === '42P01') {
        // Table doesn't exist, set flag to use fallback
        console.log('Database table not found, using fallback mode');
        app.locals.useFallback = true;
      }
      
      schemaInitialized = true;
    } catch (error) {
      console.error('Schema initialization error:', error);
      // Set up mock data as fallback
      const sampleTracks = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          title: 'House Anthem',
          artist: 'DJ Producer',
          genre: 'House',
          bpm: 128,
          duration: '4:32',
          file_url: 'https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Kangaroo_MusiQue_-_The_Neverwritten_Role_Playing_Game.mp3',
          is_active: true,
          plays: 0
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          title: 'Techno Drive',
          artist: 'Beat Master',
          genre: 'Techno',
          bpm: 130,
          duration: '5:15',
          file_url: 'https://commondatastorage.googleapis.com/codeskulptor-assets/Epoq-Lepidoptera.ogg',
          is_active: true,
          plays: 0
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440003',
          title: 'Deep Vibes',
          artist: 'Sound Creator',
          genre: 'Deep House',
          bpm: 124,
          duration: '6:45',
          file_url: 'https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Sevish_-__nbsp_.mp3',
          is_active: true,
          plays: 0
        }
      ];
      app.locals.mockTracks = sampleTracks;
      schemaInitialized = true;
    }
  }

  // SECURE ADMIN AUTHENTICATION ROUTES
  // Admin login endpoint
  app.post("/api/admin/login", async (req, res) => {
    try {
      const loginData = adminLoginSchema.parse(req.body);
      
      // Find admin user in database
      const [adminUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, loginData.username))
        .limit(1);

      if (!adminUser || !adminUser.isAdmin) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Verify password
      const passwordValid = await verifyPassword(loginData.password, adminUser.password);
      if (!passwordValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Create secure session
      const sessionToken = await createAdminSession(adminUser.id);
      
      // Set secure HTTP-only cookie
      res.cookie('adminSession', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      res.json({ 
        success: true, 
        user: { 
          id: adminUser.id, 
          username: adminUser.username,
          isAdmin: adminUser.isAdmin 
        } 
      });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Admin logout endpoint
  app.post("/api/admin/logout", async (req, res) => {
    res.clearCookie('adminSession');
    res.json({ success: true });
  });

  // Verify admin session endpoint
  app.get("/api/admin/verify", requireAdmin, async (req: AuthenticatedRequest, res) => {
    res.json({ 
      success: true, 
      user: req.user 
    });
  });

  // SITE CONTENT MANAGEMENT ROUTES (Admin Only)
  // Get all site content
  app.get("/api/admin/content", requireAdmin, async (req, res) => {
    try {
      const content = await db.select().from(siteContent).where(eq(siteContent.isActive, true));
      res.json(content);
    } catch (error) {
      console.error('Error fetching site content:', error);
      res.status(500).json({ error: "Failed to fetch content" });
    }
  });

  // Create new site content
  app.post("/api/admin/content", requireAdmin, async (req, res) => {
    try {
      const contentData = insertSiteContentSchema.parse(req.body);
      const [newContent] = await db.insert(siteContent).values(contentData).returning();
      res.json(newContent);
    } catch (error) {
      console.error('Error creating site content:', error);
      res.status(500).json({ error: "Failed to create content" });
    }
  });

  // Update site content
  app.put("/api/admin/content/:id", requireAdmin, async (req, res) => {
    try {
      const contentData = insertSiteContentSchema.parse(req.body);
      const [updatedContent] = await db
        .update(siteContent)
        .set({ ...contentData, updatedAt: new Date() })
        .where(eq(siteContent.id, parseInt(req.params.id)))
        .returning();
      
      if (!updatedContent) {
        return res.status(404).json({ error: "Content not found" });
      }
      
      res.json(updatedContent);
    } catch (error) {
      console.error('Error updating site content:', error);
      res.status(500).json({ error: "Failed to update content" });
    }
  });

  // Delete site content
  app.delete("/api/admin/content/:id", requireAdmin, async (req, res) => {
    try {
      await db.delete(siteContent).where(eq(siteContent.id, parseInt(req.params.id)));
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting site content:', error);
      res.status(500).json({ error: "Failed to delete content" });
    }
  });

  // PUBLIC CONTENT API - for website content consumption
  // Get content by section
  app.get("/api/content/:section", async (req, res) => {
    try {
      const { section } = req.params;
      const content = await db
        .select()
        .from(siteContent)
        .where(eq(siteContent.section, section))
        .orderBy(siteContent.position);
      
      res.json(content);
    } catch (error) {
      console.error('Error fetching content:', error);
      res.status(500).json({ error: "Failed to fetch content" });
    }
  });

  // Get content by key
  app.get("/api/content/key/:key", async (req, res) => {
    try {
      const { key } = req.params;
      const content = await db
        .select()
        .from(siteContent)
        .where(eq(siteContent.key, key))
        .limit(1);
      
      if (!content || content.length === 0) {
        return res.status(404).json({ error: "Content not found" });
      }
      
      res.json(content[0]);
    } catch (error) {
      console.error('Error fetching content:', error);
      res.status(500).json({ error: "Failed to fetch content" });
    }
  });

  // Get all active content
  app.get("/api/content", async (req, res) => {
    try {
      const content = await db
        .select()
        .from(siteContent)
        .where(eq(siteContent.isActive, true));
      
      res.json(content);
    } catch (error) {
      console.error('Error fetching content:', error);
      res.status(500).json({ error: "Failed to fetch content" });
    }
  });

  // Track management routes - using Supabase directly
  app.get("/api/tracks", async (req, res) => {
    try {
      await ensureSchema();
      
      // Check if we should use mock data
      if (app.locals.mockTracks) {
        const tracks = app.locals.mockTracks.map((track, index) => ({
          id: index + 1,
          name: track.title,
          artist: track.artist,
          bpm: track.bpm || 120,
          duration: track.duration || "0:00",
          genre: track.genre || "Unknown",
          url: track.file_url,
          waveformData: track.waveform_data || null
        }));
        return res.json(tracks);
      }

      const { data, error } = await supabase
        .from('music_tracks')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        // Fall back to sample tracks
        const sampleTracks = [
          {
            id: 1,
            name: 'House Anthem',
            artist: 'DJ Producer',
            bpm: 128,
            duration: '4:32',
            genre: 'House',
            url: 'https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Kangaroo_MusiQue_-_The_Neverwritten_Role_Playing_Game.mp3',
            waveformData: null
          },
          {
            id: 2,
            name: 'Techno Drive',
            artist: 'Beat Master',
            bpm: 130,
            duration: '5:15',
            genre: 'Techno',
            url: 'https://commondatastorage.googleapis.com/codeskulptor-assets/Epoq-Lepidoptera.ogg',
            waveformData: null
          },
          {
            id: 3,
            name: 'Deep Vibes',
            artist: 'Sound Creator',
            bpm: 124,
            duration: '6:45',
            genre: 'Deep House',
            url: 'https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Sevish_-__nbsp_.mp3',
            waveformData: null
          }
        ];
        return res.json(sampleTracks);
      }

      // Transform Supabase data to match expected format
      const tracks = data.map((track, index) => ({
        id: index + 1,
        name: track.title,
        artist: track.artist,
        bpm: track.bpm || 120,
        duration: track.duration || "0:00",
        genre: track.genre || "Unknown",
        url: track.file_url,
        waveformData: track.waveform_data || null
      }));

      res.json(tracks);
    } catch (error) {
      console.error(`Error in /api/tracks: ${error}`);
      res.status(500).json({ error: "Failed to fetch tracks" });
    }
  });

  app.post("/api/tracks", async (req, res) => {
    try {
      const { title, artist, genre, bpm, duration, file_url } = req.body;
      
      const { data, error } = await supabase
        .from('music_tracks')
        .insert({
          title: title || 'Unknown Track',
          artist: artist || 'Unknown Artist',
          genre: genre || null,
          bpm: bpm || null,
          duration: duration || null,
          file_url: file_url
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: "Failed to save track to database" });
      }

      res.status(201).json(data);
    } catch (error) {
      console.error(`Error in POST /api/tracks: ${error}`);
      res.status(500).json({ error: "Failed to save track" });
    }
  });

  app.get("/api/tracks/:id", async (req, res) => {
    try {
      const track = await storage.getTrack(parseInt(req.params.id));
      if (!track) {
        return res.status(404).json({ error: "Track not found" });
      }
      res.json(track);
    } catch (error) {
      console.error(`Error in GET /api/tracks/:id: ${error}`);
      res.status(500).json({ error: "Failed to fetch track" });
    }
  });

  app.put("/api/tracks/:id", async (req, res) => {
    try {
      const trackData = {
        name: req.body.name,
        artist: req.body.artist,
        album: req.body.album,
        genre: req.body.genre,
        bpm: req.body.bpm ? parseFloat(req.body.bpm) : undefined,
        duration: req.body.duration ? parseFloat(req.body.duration) : undefined,
        key: req.body.key,
        waveformData: req.body.waveformData,
        cuePoints: req.body.cuePoints,
      };

      const track = await storage.updateTrack(parseInt(req.params.id), trackData);
      if (!track) {
        return res.status(404).json({ error: "Track not found" });
      }
      res.json(track);
    } catch (error) {
      console.error(`Error in PUT /api/tracks/:id: ${error}`);
      res.status(500).json({ error: "Failed to update track" });
    }
  });

  app.delete("/api/tracks/:id", async (req, res) => {
    try {
      const success = await storage.deleteTrack(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ error: "Track not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error(`Error in DELETE /api/tracks/:id: ${error}`);
      res.status(500).json({ error: "Failed to delete track" });
    }
  });

  // Playlist management routes
  app.get("/api/playlists", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      const playlists = await storage.getUserPlaylists(parseInt(userId));
      res.json(playlists);
    } catch (error) {
      console.error(`Error in /api/playlists: ${error}`);
      res.status(500).json({ error: "Failed to fetch playlists" });
    }
  });

  app.post("/api/playlists", async (req, res) => {
    try {
      const validation = insertPlaylistSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid playlist data", details: validation.error });
      }

      const playlist = await storage.createPlaylist(validation.data);
      res.status(201).json(playlist);
    } catch (error) {
      console.error(`Error in POST /api/playlists: ${error}`);
      res.status(500).json({ error: "Failed to create playlist" });
    }
  });

  app.get("/api/playlists/:id/tracks", async (req, res) => {
    try {
      const tracks = await storage.getPlaylistTracks(parseInt(req.params.id));
      res.json(tracks);
    } catch (error) {
      console.error(`Error in GET /api/playlists/:id/tracks: ${error}`);
      res.status(500).json({ error: "Failed to fetch playlist tracks" });
    }
  });

  // DJ Session management routes
  app.get("/api/sessions", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      const sessions = await storage.getUserDjSessions(parseInt(userId));
      res.json(sessions);
    } catch (error) {
      console.error(`Error in /api/sessions: ${error}`);
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  app.post("/api/sessions", async (req, res) => {
    try {
      const validation = insertDjSessionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid session data", details: validation.error });
      }

      const session = await storage.createDjSession(validation.data);
      res.status(201).json(session);
    } catch (error) {
      console.error(`Error in POST /api/sessions: ${error}`);
      res.status(500).json({ error: "Failed to create session" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
