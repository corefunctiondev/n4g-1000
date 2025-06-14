import type { Express } from "express";
import { createServer, type Server } from "http";
import { insertTrackSchema, insertPlaylistSchema, insertDjSessionSchema, adminLoginSchema, insertSiteContentSchema } from "@shared/schema";
import { 
  requireAdmin, 
  authenticateAdmin,
  type AuthenticatedRequest 
} from "./admin-auth";
import cookieParser from 'cookie-parser';
import { supabase } from "./db";

export async function registerRoutes(app: Express): Promise<Server> {
  // Add cookie parser middleware for admin sessions
  app.use(cookieParser());
  
  // SECURE ADMIN AUTHENTICATION ROUTES
  // Admin login endpoint using Supabase Auth
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      // Authenticate using Supabase Auth
      const authResult = await authenticateAdmin(email, password);
      
      if (!authResult) {
        return res.status(401).json({ error: "Invalid credentials or insufficient permissions" });
      }

      const { user, session } = authResult;

      res.json({ 
        success: true,
        user: {
          id: user.id,
          email: user.email,
          isAdmin: true
        },
        session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at
        }
      });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Admin logout endpoint
  app.post("/api/admin/logout", async (req, res) => {
    try {
      res.clearCookie('adminSession');
      res.json({ success: true });
    } catch (error) {
      console.error('Admin logout error:', error);
      res.status(500).json({ error: "Logout failed" });
    }
  });

  // Verify admin session endpoint
  app.get("/api/admin/verify", requireAdmin, async (req: AuthenticatedRequest, res) => {
    res.json({ 
      success: true, 
      user: req.user 
    });
  });

  // SITE CONTENT MANAGEMENT ROUTES (Admin Only)
  // Get site content with optional section filtering
  app.get("/api/admin/content", requireAdmin, async (req, res) => {
    try {
      const { section } = req.query;
      
      let query = supabase
        .from('site_content')
        .select('*')
        .eq('is_active', true)
        .order('position', { ascending: true });
      
      if (section) {
        query = query.eq('section', section);
      }
      
      const { data: content, error } = await query;
      
      if (error) throw error;
      res.json(content || []);
    } catch (error) {
      console.error('Error fetching site content:', error);
      res.status(500).json({ error: "Failed to fetch content" });
    }
  });

  // Create new site content
  app.post("/api/admin/content", requireAdmin, async (req, res) => {
    try {
      const contentData = insertSiteContentSchema.parse(req.body);
      const { data: newContent, error } = await supabase
        .from('site_content')
        .insert(contentData)
        .select()
        .single();
        
      if (error) throw error;
      res.json(newContent);
    } catch (error) {
      console.error('Error creating site content:', error);
      res.status(500).json({ error: "Failed to create content" });
    }
  });

  // Update site content
  app.put("/api/admin/content/:id", requireAdmin, async (req, res) => {
    try {
      const contentId = parseInt(req.params.id);
      const updateData = insertSiteContentSchema.partial().parse(req.body);
      
      const { data: updatedContent, error } = await supabase
        .from('site_content')
        .update(updateData)
        .eq('id', contentId)
        .select()
        .single();

      if (error) throw error;
      
      if (!updatedContent) {
        return res.status(404).json({ error: "Content not found" });
      }

      res.json(updatedContent);
    } catch (error) {
      console.error('Error updating site content:', error);
      res.status(500).json({ error: "Failed to update content" });
    }
  });

  // PATCH endpoint for partial updates (used by simple-admin interface)
  app.patch("/api/admin/content/:id", requireAdmin, async (req, res) => {
    try {
      const contentId = parseInt(req.params.id);
      const updateData = req.body;
      
      const { data: updatedContent, error } = await supabase
        .from('site_content')
        .update(updateData)
        .eq('id', contentId)
        .select()
        .single();

      if (error) throw error;
      
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
      const contentId = parseInt(req.params.id);
      const { error } = await supabase
        .from('site_content')
        .delete()
        .eq('id', contentId);
        
      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting site content:', error);
      res.status(500).json({ error: "Failed to delete content" });
    }
  });

  // Migration endpoint - disabled to prevent mock data seeding
  app.post("/api/migrate-content", async (req, res) => {
    try {
      // This endpoint is disabled to prevent seeding mock data
      // All authentic content is managed through the admin interface
      res.json({ 
        success: false, 
        message: "Migration disabled - use admin interface for content management" 
      });
    } catch (error) {
      console.error('Migration error:', error);
      res.status(500).json({ error: "Migration failed" });
    }
  });

  // PUBLIC CONTENT ROUTES
  // Get content by key
  app.get("/api/content/key", async (req, res) => {
    try {
      const { data: content, error } = await supabase
        .from('site_content')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      res.json(content);
    } catch (error) {
      console.error('Error fetching content:', error);
      res.status(500).json({ error: "Failed to fetch content" });
    }
  });

  // Get content by section
  app.get("/api/content/section", async (req, res) => {
    try {
      const section = req.query.section as string;
      const { data: content, error } = await supabase
        .from('site_content')
        .select('*')
        .eq('section', section)
        .eq('is_active', true);
      
      if (error) throw error;
      res.json(content);
    } catch (error) {
      console.error('Error fetching content by section:', error);
      res.status(500).json({ error: "Failed to fetch content" });
    }
  });

  // Get all content
  app.get("/api/content", async (req, res) => {
    try {
      const { data: content, error } = await supabase
        .from('site_content')
        .select('*')
        .eq('is_active', true)
        .order('position');
      
      if (error) throw error;
      res.json(content);
    } catch (error) {
      console.error('Error fetching all content:', error);
      res.status(500).json({ error: "Failed to fetch content" });
    }
  });

  // Update content by key
  app.put("/api/content/:key", async (req, res) => {
    try {
      const { key } = req.params;
      const { value } = req.body;

      // Check if content exists
      const { data: existingContent, error: checkError } = await supabase
        .from('site_content')
        .select('*')
        .eq('key', key)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingContent) {
        // Update existing content
        const { data: updatedContent, error } = await supabase
          .from('site_content')
          .update({ value })
          .eq('key', key)
          .select()
          .single();

        if (error) throw error;
        res.json(updatedContent);
      } else {
        // Create new content
        const { data: newContent, error } = await supabase
          .from('site_content')
          .insert({
            key,
            value,
            section: 'dynamic',
            is_active: true
          })
          .select()
          .single();

        if (error) throw error;
        res.json(newContent);
      }
    } catch (error) {
      console.error('Error updating content:', error);
      res.status(500).json({ error: "Failed to update content" });
    }
  });

  // Track management routes - using Supabase directly
  app.get("/api/tracks", async (req, res) => {
    try {
      const { data: tracks, error } = await supabase
        .from('music_tracks')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Transform to match expected format
      const formattedTracks = tracks.map((track: any) => ({
        id: track.id,
        name: track.title,
        artist: track.artist,
        bpm: track.bpm || 120,
        duration: track.duration || "0:00",
        genre: track.genre || "Unknown",
        url: track.file_url,
        waveformData: track.waveform_data
      }));

      res.json(formattedTracks);
    } catch (error) {
      console.error('Error fetching tracks:', error);
      res.status(500).json({ error: "Failed to fetch tracks" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}