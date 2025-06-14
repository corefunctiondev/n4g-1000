import { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import { Deck } from '@/components/deck';
import { Mixer } from '@/components/mixer';
import { Card, CardContent } from '@/components/ui/card';
import { audioEngine } from '@/lib/audio-engine';
import { Menu, X, Folder, FolderOpen, File, Settings, LogOut } from 'lucide-react';
import { useAudioFeedback } from '@/hooks/use-audio-feedback';

export default function CDJInterface() {
  const [location, navigate] = useLocation();
  const [isRecording, setIsRecording] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [crossfaderValue, setCrossfaderValue] = useState(50);
  const [isDraggingCrossfader, setIsDraggingCrossfader] = useState(false);
  const [deckAState, setDeckAState] = useState<any>(null);
  const [deckBState, setDeckBState] = useState<any>(null);
  const [playbackOrder, setPlaybackOrder] = useState<('A' | 'B')[]>([]);
  const [isBurgerMenuOpen, setIsBurgerMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const audioFeedback = useAudioFeedback();
  const [hasPlayedInitSound, setHasPlayedInitSound] = useState(false);

  // Track playback order for smart sync
  const handleDeckPlaybackChange = useCallback((deckId: 'A' | 'B', isPlaying: boolean) => {
    setPlaybackOrder(prev => {
      if (isPlaying) {
        // Add deck to order if not already present
        return prev.includes(deckId) ? prev : [...prev, deckId];
      } else {
        // Remove deck from order when stopped
        return prev.filter(id => id !== deckId);
      }
    });
  }, []);

  // Crossfader interaction
  const handleCrossfaderMouseDown = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setIsDraggingCrossfader(true);
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const x = e.clientX - rect.left;
      const width = rect.width;
      const percentage = Math.max(0, Math.min(100, (x / width) * 100));
      setCrossfaderValue(percentage);
      
      // Apply crossfader to audio engine
      audioEngine.setCrossfader(percentage);
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      setIsDraggingCrossfader(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  // Navigation handler
  const handleNavigation = useCallback((section: string) => {
    navigate(`/${section === 'home' ? '' : section}`);
    setIsBurgerMenuOpen(false);
  }, [navigate]);

  // File tree items for navigation
  const fileTreeItems = [
    { id: 'home', label: 'HOME/', type: 'folder', description: 'System boot and overview', isLast: false },
    { id: 'about', label: 'ABOUT/', type: 'folder', description: 'DJ member profiles', isLast: false },
    { id: 'sets', label: 'SETS/', type: 'folder', description: 'Live DJ performances', isLast: false },
    { id: 'podcasts', label: 'PODCASTS/', type: 'folder', description: 'Audio episodes', isLast: false },
    { id: 'bookings', label: 'BOOKINGS/', type: 'folder', description: 'Event schedule', isLast: false },
    { id: 'releases', label: 'RELEASES/', type: 'folder', description: 'Music catalog', isLast: false },
    { id: 'mixes', label: 'MIXES/', type: 'folder', description: 'Mix collections', isLast: false },
    { id: 'contact', label: 'CONTACT/', type: 'folder', description: 'Get in touch', isLast: false },
    { id: 'n4g-1000', label: 'N4G-1000.exe', type: 'file', description: 'DJ Equipment Interface', isLast: true },
  ];

  useEffect(() => {
    // Set page title
    document.title = 'N4G-1000 Digital Turntable Interface';
    
    // Play DJ mode activation sound on first load
    if (!hasPlayedInitSound) {
      setTimeout(() => {
        audioFeedback.playDJModeActivate();
        setHasPlayedInitSound(true);
      }, 500);
    }
    
    // Simple responsive scaling - no complex calculations needed
  }, [audioFeedback, hasPlayedInitSound]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pioneer-black to-pioneer-dark-gray p-2 sm:p-4 lg:p-8 overflow-x-auto">
      {/* Pioneer DJ Setup Layout */}
      <div className="w-full max-w-[98vw] mx-auto">
        {/* Header */}
        <div className="mb-4 lg:mb-8 relative">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">N4G-1000 Interface</h1>
            </div>
            <button
              onClick={() => setIsBurgerMenuOpen(!isBurgerMenuOpen)}
              className="p-2 hover:bg-gray-800 border border-cyan-400 rounded transition-all duration-200 bg-gray-900"
            >
              {isBurgerMenuOpen ? <X className="w-5 h-5 text-cyan-400" /> : <Menu className="w-5 h-5 text-cyan-400" />}
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 lg:gap-6 text-xs sm:text-sm text-gray-300">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
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
            <div className="text-gray-400 font-mono text-xs">
              Latency: 5ms | CPU: 12%
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-4 text-center">
          <div className="bg-gray-800/50 border border-cyan-400/30 rounded px-4 py-2 max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-6 text-xs text-gray-300">
              <span><span className="text-cyan-300">1.</span> Select track from dropdown</span>
              <span><span className="text-cyan-300">2.</span> Press play when ready</span>
              <span><span className="text-cyan-300">3.</span> Use crossfader & EQ to mix</span>
            </div>
          </div>
        </div>

        {/* DJ Setup Container - Properly Sized */}
        <div className="flex justify-center items-center min-h-[600px]">
          <div 
            className="border-4 border-gray-500 rounded-lg bg-gray-900/30 backdrop-blur-sm shadow-2xl w-full max-w-6xl mx-4"
            style={{ 
              aspectRatio: '14 / 5',
              minHeight: '550px',
              height: 'min(80vh, 600px)'
            }}
          >
            <div className="w-full h-full flex p-2">
              {/* Left CDJ (Deck A) - Takes 45% width */}
              <div className="w-[45%] h-full">
                <Deck 
                  deckId="A" 
                  color="#00d4ff" 
                  otherDeckState={deckBState}
                  onStateChange={setDeckAState}
                  onPlaybackChange={handleDeckPlaybackChange}
                  playbackOrder={playbackOrder}
                />
              </div>

              {/* Center Mixer - Takes 10% width */}
              <div className="w-[10%] h-full">
                <Mixer />
              </div>

              {/* Right CDJ (Deck B) - Takes 45% width */}
              <div className="w-[45%] h-full">
                <Deck 
                  deckId="B" 
                  color="#ff6b00" 
                  otherDeckState={deckAState}
                  onStateChange={setDeckBState}
                  onPlaybackChange={handleDeckPlaybackChange}
                  playbackOrder={playbackOrder}
                />
              </div>
            </div>
          </div>
          
          </div>
          
        {/* External Crossfader Section - Below Container */}
        <div className="flex justify-center mt-4">
          <div className="pioneer-eq-section p-4 rounded-lg">
            <div className="text-center mb-2">
              <div className="text-sm font-bold text-white">DJM-750MK2</div>
              <div className="text-xs text-gray-300">CROSSFADER</div>
            </div>
            <div className="flex justify-center">
              <div 
                className="pioneer-fader-track w-32 h-6 relative cursor-pointer"
                onMouseDown={handleCrossfaderMouseDown}
              >
                <div 
                  className={`pioneer-fader-handle w-4 h-8 absolute -top-1 transition-colors ${
                    isDraggingCrossfader ? 'bg-purple-400' : 'bg-gray-300'
                  }`}
                  style={{ left: `${(crossfaderValue / 100) * (128 - 16)}px` }}
                />
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-300 mt-1">
              <span>A</span>
              <span>B</span>
            </div>
          </div>
        </div>

        {/* Connection Cables Visual */}
        <div className="mt-8 flex justify-center">
          <div className="text-xs text-gray-500 font-mono">
            CDJ-A ═══════════ DJM-750MK2 ═══════════ CDJ-B
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <div className="pioneer-eq-section inline-block p-4">
            <div className="text-xs text-gray-300 mb-2">MASTER OUTPUT</div>
            <div className="flex items-center justify-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <i className="fas fa-headphones text-blue-300" />
                <span className="text-gray-300">Monitoring</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-volume-up text-blue-300" />
                <span className="text-gray-300">Main Out</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-microphone text-orange-400" />
                <span className="text-gray-300">Booth Out</span>
              </div>
            </div>
          </div>
        </div>

        {/* Burger Menu - File Tree Navigation */}
        {isBurgerMenuOpen && (
          <div className="absolute top-20 right-4 bg-gray-900 border border-cyan-400 rounded-lg p-4 z-50 w-72 shadow-2xl font-mono">
            <div className="text-cyan-400 font-bold text-sm mb-3 border-b border-gray-700 pb-2">
              FILE TREE
            </div>
            <div className="space-y-1">
              {fileTreeItems.map((item, index) => {
                const isActive = item.id === 'n4g-1000';
                const isFolder = item.type === 'folder';
                const Icon = isActive && isFolder ? FolderOpen : isFolder ? Folder : File;
                
                return (
                  <div key={item.id} className="relative">
                    {/* Tree lines */}
                    <div className="absolute left-0 top-0 h-full flex flex-col text-gray-500">
                      <div className="flex items-center h-6">
                        <span className="text-xs">
                          {item.isLast ? '└─' : '├─'}
                        </span>
                      </div>
                      {!item.isLast && (
                        <div className="w-px bg-gray-600 ml-[5px] flex-1"></div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => handleNavigation(item.id)}
                      className={`w-full text-left pl-6 pr-2 py-1 rounded transition-all duration-200 group ${
                        isActive 
                          ? 'bg-cyan-400 text-black' 
                          : 'hover:bg-gray-800 text-gray-300 hover:text-cyan-400'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{item.label}</div>
                          <div className={`text-xs truncate ${isActive ? 'text-black opacity-70' : 'text-gray-400 group-hover:text-gray-300'}`}>
                            {item.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
            
            <div className="border-t border-gray-700 mt-3 pt-3">
              <div className="relative">
                <div className="absolute left-0 top-0 h-6 flex items-center text-gray-500">
                  <span className="text-xs">└─</span>
                </div>
                <button
                  onClick={() => handleNavigation('admin')}
                  className="w-full text-left pl-6 pr-2 py-1 rounded text-sm text-gray-300 hover:text-orange-400 hover:bg-gray-800 flex items-center space-x-2 transition-all duration-200"
                >
                  <Settings className="w-4 h-4" />
                  <span>admin.exe</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
