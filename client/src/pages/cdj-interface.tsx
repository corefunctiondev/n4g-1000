import { useEffect, useState } from 'react';
import { CDJScreen } from '@/components/cdj-screen';
import { Mixer } from '@/components/mixer';
import { Card, CardContent } from '@/components/ui/card';

export default function CDJInterface() {
  const [isRecording, setIsRecording] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState<'A' | 'B'>('A');

  useEffect(() => {
    // Set page title
    document.title = 'Pioneer CDJ-3000 Professional Interface';
  }, []);

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      {/* Deck Selection Tabs */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-700">
        <div className="flex">
          <button
            onClick={() => setSelectedDeck('A')}
            className={`flex-1 py-4 px-8 text-xl font-bold transition-colors ${
              selectedDeck === 'A' 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            CDJ DECK A
          </button>
          <button
            onClick={() => setSelectedDeck('B')}
            className={`flex-1 py-4 px-8 text-xl font-bold transition-colors ${
              selectedDeck === 'B' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            CDJ DECK B
          </button>
          <button
            className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-bold transition-colors"
            onClick={() => {
              // Toggle mixer view
              const mixerEl = document.getElementById('mixer-panel');
              if (mixerEl) {
                mixerEl.style.display = mixerEl.style.display === 'none' ? 'block' : 'none';
              }
            }}
          >
            MIXER
          </button>
        </div>
      </div>

      {/* Full Screen CDJ Interface */}
      <div className="pt-16 h-screen">
        {selectedDeck === 'A' && (
          <CDJScreen deckId="A" color="#ff6b6b" />
        )}
        {selectedDeck === 'B' && (
          <CDJScreen deckId="B" color="#4ecdc4" />
        )}
      </div>

      {/* Floating Mixer Panel */}
      <div 
        id="mixer-panel"
        className="fixed bottom-4 right-4 w-80 bg-black/95 border-2 border-gray-600 rounded-lg shadow-2xl"
        style={{ display: 'none' }}
      >
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-bold">MIXER CONTROLS</h3>
            <button
              onClick={() => {
                const mixerEl = document.getElementById('mixer-panel');
                if (mixerEl) mixerEl.style.display = 'none';
              }}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <Mixer />
        </div>
      </div>

      {/* Recording Status */}
      {isRecording && (
        <div className="fixed top-20 right-4 bg-red-600 text-white px-4 py-2 rounded-lg font-bold animate-pulse">
          ⏺ RECORDING
        </div>
      )}

      {/* Master Status Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 px-6 py-2">
        <div className="flex justify-between items-center text-sm">
          <div className="flex space-x-6 text-gray-300">
            <span>MASTER BPM: <span className="text-orange-400 font-mono">120.0</span></span>
            <span>SYNC: <span className="text-green-400">AUTO</span></span>
            <span>STATUS: <span className="text-green-400">READY</span></span>
          </div>
          <button
            onClick={() => setIsRecording(!isRecording)}
            className={`px-4 py-1 rounded font-bold transition-colors ${
              isRecording
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
          >
            {isRecording ? '⏹ STOP' : '⏺ REC'}
          </button>
        </div>
      </div>
    </div>
  );
}
