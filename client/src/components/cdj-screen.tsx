import { useCallback, useState } from 'react';
import { useAudio } from '@/hooks/use-audio';
import { Waveform } from './waveform';
import { Knob } from './knob';
import { Button } from '@/components/ui/button';

interface CDJScreenProps {
  deckId: 'A' | 'B';
  color: string;
}

export function CDJScreen({ deckId, color }: CDJScreenProps) {
  const {
    deck,
    loadTrack,
    play,
    pause,
    stop,
    cue,
    setVolume,
    setTempo,
    seek,
  } = useAudio(deckId);

  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      loadTrack(file);
    }
  }, [loadTrack]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('audio/')) {
        loadTrack(file);
      }
    }
  }, [loadTrack]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const centiseconds = Math.floor((seconds % 1) * 100);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className={`w-full h-screen bg-black text-white flex flex-col ${isDragOver ? 'ring-4 ring-blue-500' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* CDJ-3000 Large Screen Display */}
      <div className="flex-1 bg-gradient-to-b from-gray-900 via-black to-gray-900 border-8 border-gray-700 rounded-2xl m-4 overflow-hidden">
        
        {/* Top Status Bar - Like Real CDJ */}
        <div className="h-20 bg-gradient-to-r from-gray-800 to-gray-600 border-b-2 border-gray-500 flex items-center justify-between px-8">
          <div className="flex items-center space-x-6">
            <div className="text-xs text-gray-300 font-mono">USB</div>
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{deckId}</span>
            </div>
            {deck.track && (
              <div className="text-white">
                <div className="text-lg font-bold truncate max-w-sm">🎵 {deck.track.name}</div>
                <div className="text-sm text-gray-300">
                  {formatTime(deck.track.duration)} {deck.track.bpm.toFixed(1)} Cm ℗
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-8">
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-sm font-bold rounded">
              BEAT LOOP
            </button>
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-sm font-bold rounded">
              KEY SHIFT
            </button>
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-sm font-bold rounded">
              BEAT JUMP
            </button>
          </div>
        </div>

        {/* Bar Count Display */}
        {deck.track && (
          <div className="h-16 bg-gray-800 border-b border-gray-600 flex items-center justify-between px-8">
            <div className="flex items-center space-x-8">
              <div className="text-orange-400 font-mono text-lg">
                {Math.floor(deck.currentTime / (60 / deck.track.bpm) * 4) + 1} Bars
              </div>
              <div className="h-6 border-l-2 border-orange-400"></div>
              <div className="text-blue-400 font-mono text-lg">
                {Math.floor(deck.currentTime / (60 / deck.track.bpm) * 4) + 1} Bars
              </div>
              <div className="h-6 border-l-2 border-blue-400"></div>
            </div>
          </div>
        )}

        {/* Main Waveform Area */}
        <div className="flex-1 p-6">
          {deck.track ? (
            <div className="w-full h-full flex flex-col">
              {/* Large Waveform Display */}
              <div className="flex-1 bg-black border-2 border-gray-600 rounded-lg overflow-hidden">
                <Waveform
                  track={deck.track}
                  currentTime={deck.currentTime}
                  width={Math.min(window.innerWidth - 100, 1200)}
                  height={350}
                  color={color}
                  onSeek={seek}
                  className="w-full h-full"
                />
              </div>

              {/* Bottom Section - Transport and Info */}
              <div className="mt-6 grid grid-cols-12 gap-4 items-center">
                
                {/* Player Info */}
                <div className="col-span-2 text-center">
                  <div className="text-xs text-gray-400 mb-1">PLAYER</div>
                  <div className="text-3xl font-bold border-2 border-white p-2 rounded">
                    {deckId === 'A' ? '6' : '7'}
                  </div>
                </div>

                {/* Track Number */}
                <div className="col-span-1 text-center">
                  <div className="text-xs text-gray-400 mb-1">TRACK</div>
                  <div className="text-2xl font-bold">15</div>
                </div>

                {/* Hot Cue Buttons */}
                <div className="col-span-2 space-y-1">
                  <button className="w-full py-1 bg-red-600 text-white text-xs font-bold rounded">
                    A.HOT CUE
                  </button>
                  <button className="w-full py-1 bg-blue-600 text-white text-xs font-bold rounded">
                    AUTO CUE
                  </button>
                </div>

                {/* Large Time Display */}
                <div className="col-span-3 text-center">
                  <div className="text-5xl font-mono font-bold text-white">
                    {formatTime(deck.currentTime)}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    SINGLE
                  </div>
                </div>

                {/* Tempo Display */}
                <div className="col-span-2 text-center">
                  <div className="text-xs text-gray-400 mb-1">TEMPO</div>
                  <div className="text-2xl font-mono font-bold text-green-400">
                    {deck.tempo > 0 ? '+' : ''}{deck.tempo.toFixed(2)}%
                  </div>
                </div>

                {/* BPM Display */}
                <div className="col-span-2 text-center">
                  <div className="text-xs text-gray-400 mb-1">BPM</div>
                  <div className="text-3xl font-bold text-orange-400">
                    {deck.track.bpm.toFixed(1)}
                  </div>
                  <div className="text-xs text-orange-400">MASTER</div>
                </div>
              </div>

              {/* Hot Cue Pads */}
              <div className="mt-4 grid grid-cols-8 gap-2">
                {[
                  { letter: 'A', color: 'bg-red-600', num: 1 },
                  { letter: 'B', color: 'bg-green-600', num: 2 },
                  { letter: 'C', color: 'bg-blue-600', num: 3 },
                  { letter: 'D', color: 'bg-yellow-600', num: 4 },
                  { letter: 'E', color: 'bg-orange-600', num: 5 },
                  { letter: 'F', color: 'bg-purple-600', num: 6 },
                  { letter: 'G', color: 'bg-cyan-600', num: 7 },
                  { letter: 'H', color: 'bg-pink-600', num: 8 },
                ].map((cue) => (
                  <button
                    key={cue.num}
                    className={`h-14 ${cue.color} hover:opacity-80 rounded font-bold text-white transition-all relative`}
                  >
                    <div className="text-lg">{cue.letter}</div>
                    <div className="absolute bottom-1 right-1 text-xs">{cue.num}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* No Track Loaded */
            <div className="w-full h-full flex flex-col items-center justify-center">
              <div className="text-8xl mb-8 opacity-20">🎧</div>
              <div className="text-4xl font-bold mb-6">NO TRACK LOADED</div>
              <div className="text-xl text-gray-400 mb-12 text-center max-w-2xl">
                Drag and drop an audio file here to start mixing like a professional DJ
              </div>
              
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
                id={`cdj-file-${deckId}`}
              />
              <label
                htmlFor={`cdj-file-${deckId}`}
                className="cursor-pointer px-12 py-6 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-2xl transition-colors"
              >
                LOAD TRACK
              </label>
            </div>
          )}
        </div>

        {/* Bottom Transport Controls */}
        <div className="h-24 bg-gradient-to-r from-gray-800 to-gray-600 border-t-2 border-gray-500 flex items-center justify-center space-x-6 px-8">
          <Button
            onClick={play}
            disabled={!deck.track}
            className={`h-16 w-24 text-xl font-bold ${deck.isPlaying ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-500'}`}
          >
            ▶ PLAY
          </Button>
          
          <Button
            onClick={pause}
            disabled={!deck.track || !deck.isPlaying}
            className="h-16 w-24 text-xl font-bold bg-yellow-600 hover:bg-yellow-700"
          >
            ⏸ PAUSE
          </Button>
          
          <Button
            onClick={cue}
            disabled={!deck.track}
            className="h-16 w-24 text-xl font-bold bg-orange-600 hover:bg-orange-700"
          >
            CUE
          </Button>
          
          <Button
            onClick={stop}
            disabled={!deck.track}
            className="h-16 w-24 text-xl font-bold bg-red-600 hover:bg-red-700"
          >
            ⏹ STOP
          </Button>

          {/* Tempo Control */}
          <div className="ml-12">
            <div className="text-center mb-2">
              <label className="text-sm font-bold text-gray-300">TEMPO RANGE ±16</label>
            </div>
            <Knob
              value={deck.tempo}
              min={-16}
              max={16}
              step={0.01}
              onChange={setTempo}
              size="lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
}