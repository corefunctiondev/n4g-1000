import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { supabase } from "./supabase";
import { insertTrackSchema, insertPlaylistSchema, insertDjSessionSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Track management routes - using Supabase directly
  app.get("/api/tracks", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('music_tracks')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: "Failed to fetch tracks from database" });
      }

      // Transform Supabase data to match expected format
      const tracks = data.map(track => ({
        id: parseInt(track.id) || 0,
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
