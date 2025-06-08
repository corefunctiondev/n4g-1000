import { useEffect, useState } from 'react';
import { Deck } from '@/components/deck';
import { Mixer } from '@/components/mixer';
import { Card, CardContent } from '@/components/ui/card';

export default function CDJInterface() {
  const [isRecording, setIsRecording] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);

  useEffect(() => {
    // Set page title
    document.title = 'Virtual CDJ Pro - Professional DJ Interface';
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pioneer-black to-pioneer-dark-gray p-2 sm:p-4 lg:p-8 overflow-x-auto">
      {/* Pioneer DJ Setup Layout */}
      <div className="w-full max-w-[98vw] mx-auto">
        {/* Header */}
        <div className="text-center mb-4 lg:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">Pioneer DJ Virtual Setup</h1>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 lg:gap-6 text-xs sm:text-sm text-gray-400">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span>System Ready</span>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setIsRecording(!isRecording)}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                  isRecording 
                    ? 'bg-red-500 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-red-500'
                }`}
              >
                {isRecording ? '● REC' : '○ REC'}
              </button>
            </div>
            <div className="text-gray-500 font-mono text-xs">
              Latency: 5ms | CPU: 12%
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400">Zoom:</span>
              <input
                type="range"
                min="50"
                max="150"
                value={zoomLevel}
                onChange={(e) => setZoomLevel(Number(e.target.value))}
                className="w-16 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-xs text-gray-400 w-8">{zoomLevel}%</span>
            </div>
          </div>
        </div>

        {/* Main DJ Setup - Scalable Layout */}
        <div className="flex justify-center items-center min-h-[400px] overflow-hidden">
          <div 
            className="flex items-start justify-center gap-8"
            style={{ 
              transform: `scale(${zoomLevel / 100})`, 
              transformOrigin: 'center',
              transition: 'transform 0.2s ease-in-out'
            }}
          >
            {/* Left CDJ (Deck A) */}
            <div className="flex-shrink-0">
              <Deck deckId="A" color="#00d4ff" />
            </div>

            {/* Center Mixer */}
            <div className="flex-shrink-0 mt-16">
              <Mixer />
            </div>

            {/* Right CDJ (Deck B) */}
            <div className="flex-shrink-0">
              <Deck deckId="B" color="#ff6b00" />
            </div>
          </div>
        </div>

        {/* Connection Cables Visual */}
        <div className="mt-8 flex justify-center">
          <div className="text-xs text-gray-600 font-mono">
            CDJ-A ═══════════ DJM-750MK2 ═══════════ CDJ-B
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <div className="pioneer-eq-section inline-block p-4">
            <div className="text-xs text-gray-400 mb-2">MASTER OUTPUT</div>
            <div className="flex items-center justify-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <i className="fas fa-headphones text-blue-400" />
                <span className="text-gray-400">Monitoring</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-volume-up text-green-400" />
                <span className="text-gray-400">Main Out</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-microphone text-orange-400" />
                <span className="text-gray-400">Booth Out</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
