import { useCallback } from 'react';
import { useAudio } from '@/hooks/use-audio';
import { Waveform } from './waveform';
import { Knob } from './knob';
import { Fader } from './fader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface DeckProps {
  deckId: 'A' | 'B';
  color: string;
}

export function Deck({ deckId, color }: DeckProps) {
  const {
    deck,
    loadTrack,
    play,
    pause,
    stop,
    cue,
    setVolume,
    setTempo,
    setEQ,
    seek,
  } = useAudio(deckId);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      loadTrack(file);
    }
  }, [loadTrack]);

  const handlePlayPause = useCallback(() => {
    if (deck.isPlaying) {
      pause();
    } else {
      play();
    }
  }, [deck.isPlaying, play, pause]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatBPM = (bpm: number): string => {
    return bpm.toFixed(1);
  };

  const formatTempo = (tempo: number): string => {
    return `${tempo > 0 ? '+' : ''}${tempo.toFixed(1)}%`;
  };

  return (
    <Card className="bg-cdj-light border-cdj-border shadow-2xl">
      <CardContent className="p-6">
        {/* Deck Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div 
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold text-black`}
              style={{ backgroundColor: color }}
            >
              {deckId}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">DECK {deckId}</h2>
              <p className="text-sm text-gray-400">
                {deck.track?.name || 'No Track Loaded'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${deck.isReady ? 'bg-cdj-green animate-pulse' : 'bg-gray-500'}`} />
            <span className="text-xs text-gray-400">
              {deck.isReady ? 'READY' : 'LOADING'}
            </span>
          </div>
        </div>

        {/* Track Display */}
        <div className="cdj-display rounded-lg p-4 mb-6 text-center">
          <div className="text-2xl font-mono font-bold cdj-led mb-1">
            {deck.track ? formatBPM(deck.track.bpm) : '---.-'}
          </div>
          <div className="text-xs opacity-75 mb-2">BPM</div>
          <div className="flex justify-between text-xs">
            <span>{formatTime(deck.currentTime)}</span>
            <span>{deck.track ? formatTime(deck.track.duration - deck.currentTime) : '--:--'}</span>
          </div>
        </div>

        {/* Waveform Display */}
        <div className="mb-6">
          <Waveform
            track={deck.track}
            currentTime={deck.currentTime}
            width={300}
            height={80}
            color={color}
            onSeek={seek}
            className="w-full"
          />
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <label className="block w-full p-4 border-2 border-dashed border-cdj-border rounded-lg cursor-pointer hover:border-cdj-blue transition-colors text-center">
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <i className="fas fa-upload text-2xl mb-2" style={{ color }} />
            <div className="text-sm text-gray-400">Drop audio file or click to browse</div>
            <div className="text-xs text-gray-500 mt-1">MP3, WAV supported</div>
          </label>
        </div>

        {/* Transport Controls */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          <Button
            onClick={cue}
            className="cdj-button p-3 rounded-lg text-center"
            style={{ color: '#ff6b00' }}
          >
            <i className="fas fa-step-backward mb-1" />
            <div className="text-xs">CUE</div>
          </Button>
          
          <Button
            onClick={handlePlayPause}
            className={`p-3 rounded-lg text-center font-bold ${
              deck.isPlaying ? 'bg-cdj-green text-black' : 'cdj-button text-cdj-green'
            }`}
          >
            <i className={`fas ${deck.isPlaying ? 'fa-pause' : 'fa-play'} mb-1`} />
            <div className="text-xs">{deck.isPlaying ? 'PAUSE' : 'PLAY'}</div>
          </Button>
          
          <Button
            onClick={stop}
            className="cdj-button p-3 rounded-lg text-center"
            style={{ color: '#ff0040' }}
          >
            <i className="fas fa-stop mb-1" />
            <div className="text-xs">STOP</div>
          </Button>
          
          <Button className="cdj-button p-3 rounded-lg text-center text-cdj-green">
            <i className="fas fa-link mb-1" />
            <div className="text-xs">SYNC</div>
          </Button>
          
          <Button className="cdj-button p-3 rounded-lg text-center text-cdj-orange">
            <i className="fas fa-redo mb-1" />
            <div className="text-xs">LOOP</div>
          </Button>
        </div>

        {/* Hot Cue Pads */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {[1, 2, 3, 4].map((cueNum) => (
            <Button
              key={cueNum}
              className="cdj-button rounded-lg p-4 text-center border border-cdj-border hover:bg-cdj-orange transition-all"
            >
              <div className="text-lg font-bold">{cueNum}</div>
              <div className="text-xs text-gray-400">HOT CUE</div>
            </Button>
          ))}
        </div>

        {/* Tempo & Pitch Controls */}
        <div className="bg-cdj-surface rounded-lg p-4 mb-6">
          <div className="text-center mb-4">
            <div className="text-2xl font-mono font-bold cdj-led" style={{ color }}>
              {formatBPM(deck.track?.bpm || 120)}
            </div>
            <div className="text-xs text-gray-400">BPM</div>
          </div>
          
          <div className="flex justify-center mb-4">
            <Fader
              value={deck.tempo}
              min={-50}
              max={50}
              step={0.1}
              onChange={setTempo}
              length={128}
              thickness={8}
              className="mx-auto"
            />
          </div>
          
          <div className="text-center">
            <div className="text-lg font-mono font-bold cdj-led" style={{ color }}>
              {formatTempo(deck.tempo)}
            </div>
            <div className="text-xs text-gray-400">PITCH</div>
          </div>
        </div>

        {/* EQ Controls */}
        <div className="bg-cdj-surface rounded-lg p-4 mb-6">
          <div className="text-center mb-3">
            <div className="text-sm font-semibold text-gray-300">EQUALIZER</div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <Knob
                value={deck.eq.high}
                min={0}
                max={100}
                onChange={(value) => setEQ('high', value)}
                size="md"
                className="mx-auto mb-2"
              />
              <div className="text-xs text-gray-400">HIGH</div>
            </div>
            <div className="text-center">
              <Knob
                value={deck.eq.mid}
                min={0}
                max={100}
                onChange={(value) => setEQ('mid', value)}
                size="md"
                className="mx-auto mb-2"
              />
              <div className="text-xs text-gray-400">MID</div>
            </div>
            <div className="text-center">
              <Knob
                value={deck.eq.low}
                min={0}
                max={100}
                onChange={(value) => setEQ('low', value)}
                size="md"
                className="mx-auto mb-2"
              />
              <div className="text-xs text-gray-400">LOW</div>
            </div>
          </div>
        </div>

        {/* Volume Fader */}
        <div className="text-center">
          <div className="text-sm font-semibold text-gray-300 mb-2">VOLUME</div>
          <Fader
            value={deck.volume * 100}
            min={0}
            max={100}
            onChange={(value) => setVolume(value / 100)}
            length={128}
            thickness={8}
            className="mx-auto"
          />
        </div>
      </CardContent>
    </Card>
  );
}
