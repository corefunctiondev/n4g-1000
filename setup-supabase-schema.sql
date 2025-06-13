-- Create music_tracks table for storing track metadata
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

-- Create site_config table for storing application configuration
CREATE TABLE IF NOT EXISTS site_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  config JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_music_tracks_artist ON music_tracks(artist);
CREATE INDEX IF NOT EXISTS idx_music_tracks_genre ON music_tracks(genre);
CREATE INDEX IF NOT EXISTS idx_music_tracks_bpm ON music_tracks(bpm);
CREATE INDEX IF NOT EXISTS idx_music_tracks_is_active ON music_tracks(is_active);

-- Insert some sample tracks (you can remove these after adding your own)
INSERT INTO music_tracks (title, artist, genre, bpm, file_url) VALUES
  ('House Anthem', 'DJ Producer', 'House', 128, 'https://example.com/track1.mp3'),
  ('Techno Drive', 'Beat Master', 'Techno', 130, 'https://example.com/track2.mp3'),
  ('Deep Vibes', 'Sound Creator', 'Deep House', 124, 'https://example.com/track3.mp3')
ON CONFLICT DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE music_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public access (adjust as needed for your security requirements)
CREATE POLICY "Allow public read access to music_tracks" ON music_tracks FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to music_tracks" ON music_tracks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to music_tracks" ON music_tracks FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to music_tracks" ON music_tracks FOR DELETE USING (true);

CREATE POLICY "Allow public read access to site_config" ON site_config FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to site_config" ON site_config FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to site_config" ON site_config FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to site_config" ON site_config FOR DELETE USING (true);