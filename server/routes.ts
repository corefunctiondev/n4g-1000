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

  // Enhanced migration endpoint for complete content seeding
  app.post("/api/migrate-content", async (req, res) => {
    try {
      const content = [
        // Home/Hero section
        {key: 'hero_title', section: 'home', title: 'Welcome to N4G Terminal OS', position: 1, is_active: true},
        {key: 'hero_subtitle', section: 'home', title: 'Digital DJ Experience', position: 2, is_active: true},
        {key: 'hero_description', section: 'home', content: 'Experience DJ Stimulator in your browser with our authentic N4G-1000 featuring our complete music collection.', position: 3, is_active: true},
        {key: 'cta_button', section: 'home', button_text: 'Launch N4G-1000', link_url: '/n4g-1000', position: 4, is_active: true},
        {key: 'system_status_title', section: 'home', title: 'SYSTEM STATUS:', position: 5, is_active: true},
        {key: 'audio_engine_status', section: 'home', content: '✓ Audio Engine: ONLINE', position: 6, is_active: true},
        {key: 'dj_equipment_status', section: 'home', content: '✓ DJ Equipment: READY', position: 7, is_active: true},
        {key: 'music_library_status', section: 'home', content: '✓ Music Library: LOADED', position: 8, is_active: true},
        {key: 'network_status', section: 'home', content: '✓ Network: CONNECTED', position: 9, is_active: true},
        {key: 'active_members_title', section: 'home', title: 'ACTIVE MEMBERS:', position: 10, is_active: true},
        {key: 'member_alex', section: 'home', content: 'alex@brooklyn.nyc - ONLINE', position: 11, is_active: true},
        {key: 'member_jordan', section: 'home', content: 'jordan@manhattan.nyc - ONLINE', position: 12, is_active: true},
        {key: 'notification_title', section: 'home', title: 'LATEST NOTIFICATION:', position: 13, is_active: true},
        {key: 'latest_notification', section: 'home', content: 'New booking confirmed: Brooklyn Warehouse, Saturday 11PM', position: 14, is_active: true},
        
        // About section
        {key: 'about_title', section: 'about', title: 'About Need For Groove', position: 1, is_active: true},
        {key: 'about_description', section: 'about', content: 'Need For Groove represents the intersection of technology and musical artistry. Our digital platform recreates the authentic feel of professional DJ equipment while providing access to our music library.', position: 2, is_active: true},
        {key: 'features_title', section: 'about', title: 'Professional Features', position: 3, is_active: true},
        {key: 'features_description', section: 'about', content: 'Real-time BPM analysis, beatmatching, 3-band EQ, crossfading, waveform visualization, and seamless track switching - all powered by N4G.', position: 4, is_active: true},
        {key: 'mixing_title', section: 'about', title: 'Live Mixing', position: 5, is_active: true},
        {key: 'mixing_description', section: 'about', content: 'Professional mixing capabilities with dual-deck control, tempo adjustment, and real-time effects.', position: 6, is_active: true},
        {key: 'library_title', section: 'about', title: 'Music Library', position: 7, is_active: true},
        {key: 'library_description', section: 'about', content: 'Access our music collection of 25 Need For Groove tracks.', position: 8, is_active: true},
        {key: 'alex_name', section: 'about', title: 'ALEX RODRIGUEZ', position: 9, is_active: true},
        {key: 'alex_location', section: 'about', content: 'Location: Brooklyn, NY', position: 10, is_active: true},
        {key: 'alex_style', section: 'about', content: 'Style: Deep House, Progressive', position: 11, is_active: true},
        {key: 'alex_experience', section: 'about', content: 'Experience: 8+ years', position: 12, is_active: true},
        {key: 'alex_status', section: 'about', content: 'ACTIVE', position: 13, is_active: true},
        {key: 'alex_bio', section: 'about', content: 'Specializes in underground warehouse vibes and late-night deep sets.', position: 14, is_active: true},
        {key: 'jordan_name', section: 'about', title: 'JORDAN CHEN', position: 15, is_active: true},
        {key: 'jordan_location', section: 'about', content: 'Location: Manhattan, NY', position: 16, is_active: true},
        {key: 'jordan_style', section: 'about', content: 'Style: Techno, Minimal', position: 17, is_active: true},
        {key: 'jordan_experience', section: 'about', content: 'Experience: 6+ years', position: 18, is_active: true},
        {key: 'jordan_status', section: 'about', content: 'ACTIVE', position: 19, is_active: true},
        {key: 'jordan_bio', section: 'about', content: 'Known for precise mixing and driving techno beats that keep crowds moving.', position: 20, is_active: true},
        
        // Contact section
        {key: 'contact_title', section: 'contact', title: 'Get In Touch', position: 1, is_active: true},
        {key: 'contact_description', section: 'contact', content: 'Ready to experience the future of digital DJing? Connect with Need For Groove today.', position: 2, is_active: true},
        {key: 'contact_email', section: 'contact', content: '📧 Email: bookings@needforgroove.com', position: 3, is_active: true},
        {key: 'contact_location', section: 'contact', content: '📍 Location: New York City', position: 4, is_active: true},
        {key: 'contact_response', section: 'contact', content: '⏱️ Response Time: 24-48 hours', position: 5, is_active: true},
        {key: 'contact_availability', section: 'contact', content: '🗓️ Availability: Available for events', position: 6, is_active: true},
        
        // Sets section
        {key: 'sets_title', section: 'sets', title: 'DJ Sets & Performances', position: 1, is_active: true},
        {key: 'sets_description', section: 'sets', content: 'Explore our collection of live DJ sets and recorded performances featuring the N4G-1000 digital turntable system.', position: 2, is_active: true},
        {key: 'set_0_title', section: 'sets', title: 'Warehouse Sessions #1', position: 3, is_active: true},
        {key: 'set_0_date', section: 'sets', content: 'Date: 2024-01-15', position: 4, is_active: true},
        {key: 'set_0_duration', section: 'sets', content: 'Duration: 2:30:00', position: 5, is_active: true},
        {key: 'set_0_plays', section: 'sets', content: 'Plays: 1248', position: 6, is_active: true},
        {key: 'set_1_title', section: 'sets', title: 'Rooftop Sunset Mix', position: 7, is_active: true},
        {key: 'set_1_date', section: 'sets', content: 'Date: 2024-01-10', position: 8, is_active: true},
        {key: 'set_1_duration', section: 'sets', content: 'Duration: 1:45:00', position: 9, is_active: true},
        {key: 'set_1_plays', section: 'sets', content: 'Plays: 892', position: 10, is_active: true},
        {key: 'set_2_title', section: 'sets', title: 'Deep Underground', position: 11, is_active: true},
        {key: 'set_2_date', section: 'sets', content: 'Date: 2024-01-05', position: 12, is_active: true},
        {key: 'set_2_duration', section: 'sets', content: 'Duration: 3:00:00', position: 13, is_active: true},
        {key: 'set_2_plays', section: 'sets', content: 'Plays: 2156', position: 14, is_active: true},
        
        // Podcasts section
        {key: 'podcasts_title', section: 'podcasts', title: 'N4G Podcast Series', position: 1, is_active: true},
        {key: 'podcasts_description', section: 'podcasts', content: 'Deep dives into electronic music production, DJ techniques, and the future of digital music technology.', position: 2, is_active: true},
        {key: 'podcast_0_title', section: 'podcasts', title: 'EP001: NYC Underground Scene', position: 3, is_active: true},
        {key: 'podcast_0_date', section: 'podcasts', content: 'Released: 2024-01-20', position: 4, is_active: true},
        {key: 'podcast_0_duration', section: 'podcasts', content: 'Duration: 45:30', position: 5, is_active: true},
        {key: 'podcast_1_title', section: 'podcasts', title: 'EP002: House Music Evolution', position: 6, is_active: true},
        {key: 'podcast_1_date', section: 'podcasts', content: 'Released: 2024-01-13', position: 7, is_active: true},
        {key: 'podcast_1_duration', section: 'podcasts', content: 'Duration: 52:15', position: 8, is_active: true},
        {key: 'podcast_2_title', section: 'podcasts', title: 'EP003: Techno Production Tips', position: 9, is_active: true},
        {key: 'podcast_2_date', section: 'podcasts', content: 'Released: 2024-01-06', position: 10, is_active: true},
        {key: 'podcast_2_duration', section: 'podcasts', content: 'Duration: 38:45', position: 11, is_active: true},
        
        // Bookings section
        {key: 'bookings_title', section: 'bookings', title: 'Book Need For Groove', position: 1, is_active: true},
        {key: 'bookings_description', section: 'bookings', content: 'Available for live performances, club bookings, private events, and music production collaborations.', position: 2, is_active: true},
        {key: 'booking_services_title', section: 'bookings', title: 'AVAILABLE SERVICES:', position: 3, is_active: true},
        {key: 'booking_club_events', section: 'bookings', content: '🎧 Club Events & Nightlife', position: 4, is_active: true},
        {key: 'booking_private_parties', section: 'bookings', content: '🎉 Private Parties & Corporate Events', position: 5, is_active: true},
        {key: 'booking_festivals', section: 'bookings', content: '🎪 Music Festivals & Outdoor Events', position: 6, is_active: true},
        {key: 'booking_production', section: 'bookings', content: '🎵 Music Production & Collaboration', position: 7, is_active: true},
        
        // Releases section
        {key: 'releases_title', section: 'releases', title: 'Music Releases', position: 1, is_active: true},
        {key: 'releases_description', section: 'releases', content: 'Original tracks, remixes, and collaborative works from the Need For Groove collective.', position: 2, is_active: true},
        {key: 'latest_releases_title', section: 'releases', title: 'LATEST RELEASES:', position: 3, is_active: true},
        {key: 'release_0_title', section: 'releases', title: 'Underground Frequencies EP', position: 4, is_active: true},
        {key: 'release_0_date', section: 'releases', content: 'Released: January 2024', position: 5, is_active: true},
        {key: 'release_1_title', section: 'releases', title: 'Brooklyn Nights (Remix)', position: 6, is_active: true},
        {key: 'release_1_date', section: 'releases', content: 'Released: December 2023', position: 7, is_active: true},
        {key: 'release_2_title', section: 'releases', title: 'Digital Dreams Album', position: 8, is_active: true},
        {key: 'release_2_date', section: 'releases', content: 'Released: November 2023', position: 9, is_active: true},
        
        // Mixes section
        {key: 'mixes_title', section: 'mixes', title: 'DJ Mixes', position: 1, is_active: true},
        {key: 'mixes_description', section: 'mixes', content: 'Curated DJ mixes showcasing the latest in electronic music and exclusive N4G productions.', position: 2, is_active: true},
        {key: 'featured_mixes_title', section: 'mixes', title: 'FEATURED MIXES:', position: 3, is_active: true},
        {key: 'mix_0_title', section: 'mixes', title: 'After Hours: Deep Sessions', position: 4, is_active: true},
        {key: 'mix_0_duration', section: 'mixes', content: 'Duration: 90 minutes', position: 5, is_active: true},
        {key: 'mix_1_title', section: 'mixes', title: 'Techno Therapy Vol. 3', position: 6, is_active: true},
        {key: 'mix_1_duration', section: 'mixes', content: 'Duration: 75 minutes', position: 7, is_active: true},
        {key: 'mix_2_title', section: 'mixes', title: 'Progressive Journeys', position: 8, is_active: true},
        {key: 'mix_2_duration', section: 'mixes', content: 'Duration: 60 minutes', position: 9, is_active: true}
      ];

      // Clear existing content first
      await supabase.from('site_content').delete().neq('id', 0);
      
      // Insert new content
      const { data, error } = await supabase
        .from('site_content')
        .insert(content)
        .select();
        
      if (error) throw error;
      
      res.json({ success: true, migrated: data.length });
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