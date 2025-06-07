import { useEffect, useState } from 'react';
import { Deck } from '@/components/deck';
import { Mixer } from '@/components/mixer';
import { Card, CardContent } from '@/components/ui/card';

export default function CDJInterface() {
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    // Set page title
    document.title = 'Virtual CDJ Pro - Professional DJ Interface';
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-cdj-dark to-cdj-gray">
      {/* Header Section */}
      <header className="bg-cdj-gray border-b border-cdj-border p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-cdj-blue w-8 h-8 rounded flex items-center justify-center">
              <i className="fas fa-music text-cdj-dark text-lg" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cdj-blue to-cdj-green bg-clip-text text-transparent">
              Virtual CDJ Pro
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsRecording(!isRecording)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isRecording 
                  ? 'bg-cdj-red text-white shadow-led' 
                  : 'bg-cdj-red hover:bg-opacity-80'
              }`}
            >
              <i className="fas fa-circle mr-2" />
              REC
            </button>
            <button className="bg-cdj-surface px-4 py-2 rounded-lg font-medium hover:bg-cdj-border transition-all duration-200">
              <i className="fas fa-cog mr-2" />
              Settings
            </button>
          </div>
        </div>
      </header>

      {/* Main CDJ Interface */}
      <main className="max-w-7xl mx-auto p-6">
        {/* Dual Deck Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 cdj-grid">
          {/* Left Deck (Deck A) */}
          <Deck deckId="A" color="#00d4ff" />

          {/* Center Mixer Section */}
          <Mixer />

          {/* Right Deck (Deck B) */}
          <Deck deckId="B" color="#ff6b00" />
        </div>

        {/* Status Bar */}
        <Card className="mt-6 bg-cdj-light border-cdj-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-cdj-green" />
                  <span className="text-gray-400">Audio System Ready</span>
                </div>
                <div className="flex items-center space-x-2">
                  <i className="fas fa-headphones text-cdj-blue" />
                  <span className="text-gray-400">Headphones Connected</span>
                </div>
                <div className="flex items-center space-x-2">
                  <i className="fas fa-wifi text-cdj-green" />
                  <span className="text-gray-400">Online Mode</span>
                </div>
              </div>
              <div className="text-gray-400 font-mono">
                CPU: <span className="text-cdj-green">12%</span> | 
                Latency: <span className="text-cdj-blue">5ms</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
