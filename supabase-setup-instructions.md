# Supabase Database Setup for Need For Groove

## Step 1: Create the Database Tables

Go to your Supabase project dashboard and open the SQL Editor. Run this SQL command to create the necessary tables:

```sql
-- Create music_tracks table
CREATE TABLE IF NOT EXISTS music_tracks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  genre TEXT,
  bpm INTEGER,
  duration TEXT,
  file_url TEXT NOT NULL,
  waveform_data JSONB,
  is_active BOOLEAN DEFAULT true,
  plays INTEGER DEFAULT 0,
  file_size BIGINT,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_music_tracks_artist ON music_tracks(artist);
CREATE INDEX IF NOT EXISTS idx_music_tracks_genre ON music_tracks(genre);
CREATE INDEX IF NOT EXISTS idx_music_tracks_bpm ON music_tracks(bpm);
CREATE INDEX IF NOT EXISTS idx_music_tracks_is_active ON music_tracks(is_active);

-- Enable Row Level Security (RLS)
ALTER TABLE music_tracks ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public access
CREATE POLICY "Allow public access to music_tracks" ON music_tracks FOR ALL USING (true);

-- Insert sample tracks for testing
INSERT INTO music_tracks (title, artist, genre, bpm, duration, file_url) VALUES
  ('House Anthem', 'DJ Producer', 'House', 128, '4:32', 'https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Kangaroo_MusiQue_-_The_Neverwritten_Role_Playing_Game.mp3'),
  ('Techno Drive', 'Beat Master', 'Techno', 130, '5:15', 'https://commondatastorage.googleapis.com/codeskulptor-assets/Epoq-Lepidoptera.ogg'),
  ('Deep Vibes', 'Sound Creator', 'Deep House', 124, '6:45', 'https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Sevish_-__nbsp_.mp3')
ON CONFLICT DO NOTHING;
```

## Step 2: Storage Setup

Your "music" bucket is already created. Make sure it has public access enabled:

1. Go to Storage in your Supabase dashboard
2. Select your "music" bucket
3. Click on Settings
4. Make sure "Public bucket" is enabled

## What This Sets Up

- **music_tracks table**: Stores track metadata (title, artist, BPM, etc.)
- **Indexes**: For fast searching by artist, genre, and BPM
- **Sample tracks**: Three demo tracks with working audio URLs
- **Public access**: Allows the CDJ interface to read tracks without authentication

After running this SQL, your CDJ track selectors should populate with the sample tracks.