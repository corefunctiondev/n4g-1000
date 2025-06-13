import { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TrackService, type Track } from '@/services/trackService';
import { Button } from '@/components/ui/button';
import { Upload, Play, Pause, Trash2, Edit3, BarChart3 } from 'lucide-react';

export function TrackManager() {
  const [isUploading, setIsUploading] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: tracks = [], isLoading } = useQuery({
    queryKey: ['tracks'],
    queryFn: TrackService.getAllTracks
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setIsUploading(true);
      
      // Initialize audio context if needed
      if (!audioContext) {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        setAudioContext(ctx);
      }

      // Upload file to storage
      const fileUrl = await TrackService.uploadAudioFile(file);
      
      // Analyze audio for metadata
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContext!.decodeAudioData(arrayBuffer);
      const analysis = await TrackService.analyzeAudioFile(audioBuffer);

      // Create track record
      const trackData = {
        title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
        artist: "Unknown Artist",
        file_url: fileUrl,
        file_size: file.size,
        bpm: analysis.bpm,
        duration: analysis.duration,
        waveform_data: analysis.waveformData,
        upload_date: new Date().toISOString()
      };

      return TrackService.createTrack(trackData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      setIsUploading(false);
    },
    onError: (error) => {
      console.error('Upload failed:', error);
      setIsUploading(false);
    }
  });

  const handleFileUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      uploadMutation.mutate(file);
    }
    // Reset input
    event.target.value = '';
  }, [uploadMutation]);

  if (isLoading) {
    return (
      <div className="terminal-content p-6">
        <div className="text-xl font-bold terminal-command mb-4">$ ./track_manager.sh --loading</div>
        <div className="terminal-text">Loading music library<span className="loading-dots"></span></div>
      </div>
    );
  }

  return (
    <div className="terminal-content p-6 space-y-6">
      <div className="text-xl font-bold terminal-command">$ ./track_manager.sh --admin</div>
      
      {/* Upload Section */}
      <div className="content-card p-4">
        <div className="terminal-prompt mb-3">UPLOAD NEW TRACK:</div>
        <div className="flex items-center gap-4">
          <Button
            onClick={handleFileUpload}
            disabled={isUploading}
            className="btn-terminal flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {isUploading ? 'Uploading...' : 'Select Audio File'}
          </Button>
          {isUploading && (
            <div className="terminal-text">
              Analyzing audio and generating waveform<span className="loading-dots"></span>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Track Library */}
      <div className="content-card p-4">
        <div className="terminal-prompt mb-4">MUSIC LIBRARY ({tracks.length} tracks):</div>
        
        {tracks.length === 0 ? (
          <div className="terminal-text text-center py-8">
            No tracks in library. Upload your first track to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {tracks.map((track) => (
              <TrackItem
                key={track.id}
                track={track}
                onEdit={setEditingTrack}
              />
            ))}
          </div>
        )}
      </div>

      {/* Track Statistics */}
      <div className="content-card p-4">
        <div className="terminal-prompt mb-3">LIBRARY STATISTICS:</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="terminal-text">Total Tracks:</div>
            <div className="text-nfg-cyan-primary font-bold">{tracks.length}</div>
          </div>
          <div>
            <div className="terminal-text">Total Plays:</div>
            <div className="text-nfg-cyan-primary font-bold">
              {tracks.reduce((sum, track) => sum + track.plays, 0)}
            </div>
          </div>
          <div>
            <div className="terminal-text">Avg BPM:</div>
            <div className="text-nfg-cyan-primary font-bold">
              {tracks.length > 0 
                ? Math.round(tracks.reduce((sum, track) => sum + (track.bpm || 0), 0) / tracks.length)
                : 0
              }
            </div>
          </div>
          <div>
            <div className="terminal-text">Total Size:</div>
            <div className="text-nfg-cyan-primary font-bold">
              {formatFileSize(tracks.reduce((sum, track) => sum + (track.file_size || 0), 0))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrackItem({ track, onEdit }: { track: Track; onEdit: (track: Track) => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = useCallback(async () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(track.file_url);
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        audioRef.current.onended = () => setIsPlaying(false);
      } catch (error) {
        console.error('Playback failed:', error);
      }
    }
  }, [isPlaying, track.file_url]);

  return (
    <div className="flex items-center justify-between p-3 bg-nfg-bg-secondary rounded border border-nfg-gray-border hover:border-nfg-cyan-primary transition-colors">
      <div className="flex-1">
        <div className="font-bold terminal-text">{track.title}</div>
        <div className="text-sm terminal-output">
          {track.artist} • {track.duration} • {track.bpm} BPM • {track.plays} plays
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          onClick={togglePlay}
          size="sm"
          className="btn-terminal"
        >
          {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
        </Button>
        
        <Button
          onClick={() => onEdit(track)}
          size="sm"
          className="btn-terminal"
        >
          <Edit3 className="w-3 h-3" />
        </Button>
        
        <Button
          size="sm"
          className="btn-terminal"
          title="View Waveform"
        >
          <BarChart3 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}