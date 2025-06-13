import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { Monitor, Terminal, Zap, Music, Radio, Calendar, Disc, Headphones, Mail, Settings, User, LogOut, Menu, X } from 'lucide-react';

interface TerminalOSProps {}

export default function TerminalOS({}: TerminalOSProps) {
  const [location, navigate] = useLocation();
  const [currentSection, setCurrentSection] = useState('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBurgerMenuOpen, setIsBurgerMenuOpen] = useState(false);
  const [scanlines, setScanlines] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [bootSequence, setBootSequence] = useState(true);
  const [glitchActive, setGlitchActive] = useState(false);

  // Initialize current section from URL
  useEffect(() => {
    const path = location.replace('/', '') || 'home';
    setCurrentSection(path);
  }, [location]);

  // Boot sequence
  useEffect(() => {
    const timer = setTimeout(() => {
      setBootSequence(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Random glitch effect
  useEffect(() => {
    const glitchInterval = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 200);
    }, Math.random() * 15000 + 8000);

    return () => clearInterval(glitchInterval);
  }, []);

  // Sound effects
  const playSound = useCallback((type: string) => {
    if (!soundEnabled) return;
    
    // Web Audio API sound effects would go here
    console.log(`Playing sound: ${type}`);
  }, [soundEnabled]);

  const handleNavigation = useCallback((section: string) => {
    setCurrentSection(section);
    navigate(`/${section === 'home' ? '' : section}`);
    setIsMenuOpen(false);
    setIsBurgerMenuOpen(false);
    playSound('click');
  }, [navigate, playSound]);

  const fileTreeItems = [
    { id: 'home', label: 'HOME/', icon: Terminal, description: 'System boot and overview' },
    { id: 'about', label: 'ABOUT/', icon: User, description: 'DJ member profiles' },
    { id: 'sets', label: 'SETS/', icon: Music, description: 'Live DJ performances' },
    { id: 'podcasts', label: 'PODCASTS/', icon: Radio, description: 'Audio episodes' },
    { id: 'bookings', label: 'BOOKINGS/', icon: Calendar, description: 'Event schedule' },
    { id: 'releases', label: 'RELEASES/', icon: Disc, description: 'Music catalog' },
    { id: 'mixes', label: 'MIXES/', icon: Headphones, description: 'Mix collections' },
    { id: 'contact', label: 'CONTACT/', icon: Mail, description: 'Get in touch' },
    { id: 'n4g-1000', label: 'N4G-1000/', icon: Monitor, description: 'DJ Equipment Interface' },
  ];

  if (bootSequence) {
    return (
      <div className="min-h-screen bg-black text-green-400 font-mono flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-2xl animate-pulse">NEED FOR GROOVE OS</div>
          <div className="text-sm">v2.1.0</div>
          <div className="text-xs space-y-1">
            <div>Initializing audio systems...</div>
            <div>Loading DJ profiles...</div>
            <div>Connecting to music database...</div>
            <div className="text-cyan-400">SYSTEM READY</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-black text-white font-mono relative overflow-hidden ${glitchActive ? 'animate-pulse' : ''}`}>
      {/* CRT Monitor Frame */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="w-full h-full border-8 border-gray-800 rounded-3xl shadow-2xl" 
             style={{
               background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.3) 70%)',
               boxShadow: 'inset 0 0 100px rgba(0,212,255,0.1)'
             }}>
        </div>
      </div>

      {/* Scanlines Effect */}
      {scanlines && (
        <div className="absolute inset-0 pointer-events-none opacity-20"
             style={{
               background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,255,0.1) 2px, rgba(0,212,255,0.1) 4px)'
             }}>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-gray-900 border-b border-cyan-400 p-4 flex items-center justify-between relative z-10">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Zap className="w-6 h-6 text-cyan-400" />
            <span className="text-cyan-400 font-bold text-xl">NEED FOR GROOVE</span>
          </div>
          <div className="text-gray-400 text-sm">
            NYC • HOUSE • TECHNO
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>ONLINE</span>
          </div>
          
          <button
            onClick={() => setIsBurgerMenuOpen(!isBurgerMenuOpen)}
            className="p-2 hover:bg-gray-800 border border-cyan-400 rounded transition-all duration-200"
          >
            {isBurgerMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
          
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 hover:bg-gray-800 border border-cyan-400 rounded"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex h-screen">
        {/* Left Sidebar - File Tree */}
        <div className="w-64 bg-gray-900 border-r border-cyan-400 overflow-y-auto">
          <div className="p-4 border-b border-gray-700">
            <div className="text-cyan-400 font-bold text-sm mb-2">SYSTEM/</div>
            <div className="text-xs text-gray-400">Need For Groove OS v2.1.0</div>
          </div>
          
          <div className="p-2">
            {fileTreeItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentSection === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  className={`w-full text-left p-3 rounded mb-1 transition-all duration-200 group ${
                    isActive 
                      ? 'bg-cyan-400 text-black' 
                      : 'hover:bg-gray-800 text-gray-300 hover:text-cyan-400'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <div className={`text-xs mt-1 ${isActive ? 'text-black' : 'text-gray-500 group-hover:text-gray-300'}`}>
                    {item.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Content Window */}
          <div className="flex-1 bg-black border border-cyan-400 m-4 rounded">
            <div className="bg-gray-900 p-3 border-b border-cyan-400 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span className="text-cyan-400 font-medium">{currentSection.toUpperCase()}/</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              </div>
            </div>
            
            <div className="p-6 h-full overflow-y-auto">
              {currentSection === 'home' && <HomeSection />}
              {currentSection === 'about' && <AboutSection />}
              {currentSection === 'sets' && <SetsSection />}
              {currentSection === 'podcasts' && <PodcastsSection />}
              {currentSection === 'bookings' && <BookingsSection />}
              {currentSection === 'releases' && <ReleasesSection />}
              {currentSection === 'mixes' && <MixesSection />}
              {currentSection === 'contact' && <ContactSection />}
              {currentSection === 'admin' && <AdminSection />}
            </div>
          </div>
        </div>
      </div>

      {/* Burger Menu - Quick Navigation */}
      {isBurgerMenuOpen && (
        <div className="absolute top-16 right-16 bg-gray-900 border border-cyan-400 rounded-lg p-4 z-50 w-64 shadow-2xl">
          <div className="text-cyan-400 font-bold text-sm mb-3 border-b border-gray-700 pb-2">
            QUICK NAVIGATION
          </div>
          <div className="space-y-2">
            {fileTreeItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentSection === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  className={`w-full text-left p-2 rounded transition-all duration-200 group ${
                    isActive 
                      ? 'bg-cyan-400 text-black' 
                      : 'hover:bg-gray-800 text-gray-300 hover:text-cyan-400'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{item.label}</div>
                      <div className={`text-xs ${isActive ? 'text-black opacity-70' : 'text-gray-500 group-hover:text-gray-400'}`}>
                        {item.description}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          
          <div className="border-t border-gray-700 mt-3 pt-3">
            <button
              onClick={() => handleNavigation('admin')}
              className="w-full text-left p-2 rounded text-sm text-gray-300 hover:text-orange-400 hover:bg-gray-800 flex items-center space-x-2 transition-all duration-200"
            >
              <LogOut className="w-3 h-3" />
              <span>Admin Panel</span>
            </button>
          </div>
        </div>
      )}

      {/* Settings Menu */}
      {isMenuOpen && (
        <div className="absolute top-16 right-4 bg-gray-900 border border-cyan-400 rounded p-4 z-50">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Scanlines</span>
              <button
                onClick={() => setScanlines(!scanlines)}
                className={`w-8 h-4 rounded-full ${scanlines ? 'bg-cyan-400' : 'bg-gray-600'} transition-colors`}
              >
                <div className={`w-3 h-3 bg-white rounded-full transition-transform ${scanlines ? 'translate-x-4' : 'translate-x-0.5'} mt-0.5`}></div>
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Sound FX</span>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`w-8 h-4 rounded-full ${soundEnabled ? 'bg-cyan-400' : 'bg-gray-600'} transition-colors`}
              >
                <div className={`w-3 h-3 bg-white rounded-full transition-transform ${soundEnabled ? 'translate-x-4' : 'translate-x-0.5'} mt-0.5`}></div>
              </button>
            </div>
            
            <button
              onClick={() => handleNavigation('admin')}
              className="w-full text-left text-sm text-gray-300 hover:text-cyan-400 flex items-center space-x-2"
            >
              <LogOut className="w-3 h-3" />
              <span>Admin Panel</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Section Components
function HomeSection() {
  return (
    <div className="space-y-6 text-green-400">
      <div className="text-xl font-bold text-cyan-400">$ ./welcome.sh</div>
      
      <div className="space-y-2 text-sm">
        <div>NEED FOR GROOVE OPERATING SYSTEM v2.1.0</div>
        <div>Copyright (c) 2024 Need For Groove Collective</div>
        <div>All rights reserved.</div>
      </div>
      
      <div className="space-y-4">
        <div className="text-cyan-400">SYSTEM STATUS:</div>
        <div className="pl-4 space-y-1 text-sm">
          <div>✓ Audio Engine: ONLINE</div>
          <div>✓ DJ Equipment: READY</div>
          <div>✓ Music Library: LOADED</div>
          <div>✓ Network: CONNECTED</div>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="text-cyan-400">ACTIVE MEMBERS:</div>
        <div className="pl-4 space-y-1 text-sm">
          <div>alex@brooklyn.nyc - ONLINE</div>
          <div>jordan@manhattan.nyc - ONLINE</div>
        </div>
      </div>
      
      <div className="border border-cyan-400 p-4 rounded">
        <div className="text-orange-400 mb-2">LATEST NOTIFICATION:</div>
        <div className="text-sm">New booking confirmed: Brooklyn Warehouse, Saturday 11PM</div>
      </div>
    </div>
  );
}

function AboutSection() {
  return (
    <div className="space-y-6 text-green-400">
      <div className="text-xl font-bold text-cyan-400">$ cat ./profiles/*</div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-cyan-400 p-4 rounded">
          <div className="text-cyan-400 font-bold mb-3">ALEX RODRIGUEZ</div>
          <div className="space-y-2 text-sm">
            <div>Location: Brooklyn, NY</div>
            <div>Style: Deep House, Progressive</div>
            <div>Experience: 8+ years</div>
            <div>Status: <span className="text-green-400">ACTIVE</span></div>
          </div>
          <div className="mt-3 text-xs text-gray-400">
            Specializes in underground warehouse vibes and late-night deep sets.
          </div>
        </div>
        
        <div className="border border-orange-400 p-4 rounded">
          <div className="text-orange-400 font-bold mb-3">JORDAN CHEN</div>
          <div className="space-y-2 text-sm">
            <div>Location: Manhattan, NY</div>
            <div>Style: Techno, Minimal</div>
            <div>Experience: 6+ years</div>
            <div>Status: <span className="text-green-400">ACTIVE</span></div>
          </div>
          <div className="mt-3 text-xs text-gray-400">
            Known for precise mixing and driving techno beats that keep crowds moving.
          </div>
        </div>
      </div>
    </div>
  );
}

function SetsSection() {
  return (
    <div className="space-y-6 text-green-400">
      <div className="text-xl font-bold text-cyan-400">$ ls -la ./sets/</div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { title: "Warehouse Sessions #1", date: "2024-01-15", duration: "2:30:00", plays: 1248 },
          { title: "Rooftop Sunset Mix", date: "2024-01-10", duration: "1:45:00", plays: 892 },
          { title: "Deep Underground", date: "2024-01-05", duration: "3:00:00", plays: 2156 },
        ].map((set, index) => (
          <div key={index} className="border border-gray-600 p-4 rounded hover:border-cyan-400 transition-colors cursor-pointer">
            <div className="text-cyan-400 font-bold mb-2">{set.title}</div>
            <div className="text-xs space-y-1 text-gray-400">
              <div>Date: {set.date}</div>
              <div>Duration: {set.duration}</div>
              <div>Plays: {set.plays}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PodcastsSection() {
  return (
    <div className="space-y-6 text-green-400">
      <div className="text-xl font-bold text-cyan-400">$ ./podcast_manager.sh --list</div>
      
      <div className="space-y-4">
        {[
          { episode: "EP001", title: "NYC Underground Scene", date: "2024-01-20", duration: "45:30" },
          { episode: "EP002", title: "House Music Evolution", date: "2024-01-13", duration: "52:15" },
          { episode: "EP003", title: "Techno Production Tips", date: "2024-01-06", duration: "38:45" },
        ].map((podcast, index) => (
          <div key={index} className="border border-gray-600 p-4 rounded">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-cyan-400 font-bold">{podcast.episode}: {podcast.title}</div>
                <div className="text-sm text-gray-400 mt-1">Released: {podcast.date}</div>
              </div>
              <div className="text-sm text-orange-400">{podcast.duration}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BookingsSection() {
  return (
    <div className="space-y-6 text-green-400">
      <div className="text-xl font-bold text-cyan-400">$ calendar --upcoming</div>
      
      <div className="space-y-4">
        {[
          { venue: "Brooklyn Warehouse", date: "2024-02-15", time: "23:00", status: "CONFIRMED" },
          { venue: "Manhattan Rooftop", date: "2024-02-22", time: "20:00", status: "PENDING" },
          { venue: "Queens Underground", date: "2024-03-01", time: "22:30", status: "CONFIRMED" },
        ].map((booking, index) => (
          <div key={index} className="border border-gray-600 p-4 rounded">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-cyan-400 font-bold">{booking.venue}</div>
                <div className="text-sm text-gray-400">{booking.date} at {booking.time}</div>
              </div>
              <div className={`text-sm px-2 py-1 rounded ${
                booking.status === 'CONFIRMED' ? 'bg-green-400 text-black' : 'bg-orange-400 text-black'
              }`}>
                {booking.status}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReleasesSection() {
  return (
    <div className="space-y-6 text-green-400">
      <div className="text-xl font-bold text-cyan-400">$ find ./releases/ -type f</div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { title: "Underground NYC EP", year: "2024", label: "Deep Groove Records" },
          { title: "Deep Sessions Vol. 1", year: "2023", label: "House Collective" },
          { title: "Night Groove", year: "2023", label: "Brooklyn Beats" },
        ].map((release, index) => (
          <div key={index} className="border border-gray-600 p-4 rounded hover:border-cyan-400 transition-colors cursor-pointer">
            <div className="text-cyan-400 font-bold mb-2">{release.title}</div>
            <div className="text-xs space-y-1 text-gray-400">
              <div>Year: {release.year}</div>
              <div>Label: {release.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MixesSection() {
  return (
    <div className="space-y-6 text-green-400">
      <div className="text-xl font-bold text-cyan-400">$ ./mix_archive.sh --browse</div>
      
      <div className="space-y-4">
        {[
          { series: "Deep Sessions", episode: 15, title: "Winter Warmth", duration: "90:00" },
          { series: "Techno Nights", episode: 8, title: "Industrial Pulse", duration: "75:30" },
          { series: "House Foundations", episode: 23, title: "Classic Vibes", duration: "105:45" },
        ].map((mix, index) => (
          <div key={index} className="border border-gray-600 p-4 rounded">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-cyan-400 font-bold">{mix.series} #{mix.episode}</div>
                <div className="text-sm text-gray-300">{mix.title}</div>
              </div>
              <div className="text-sm text-orange-400">{mix.duration}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactSection() {
  return (
    <div className="space-y-6 text-green-400">
      <div className="text-xl font-bold text-cyan-400">$ cat ./contact.info</div>
      
      <div className="space-y-6">
        <div className="border border-cyan-400 p-4 rounded">
          <div className="text-cyan-400 font-bold mb-3">BOOKING INQUIRIES</div>
          <div className="space-y-2 text-sm">
            <div>Email: bookings@needforgroove.nyc</div>
            <div>Phone: +1 (555) 123-4567</div>
            <div>Response Time: 24-48 hours</div>
          </div>
        </div>
        
        <div className="border border-orange-400 p-4 rounded">
          <div className="text-orange-400 font-bold mb-3">MANAGEMENT</div>
          <div className="space-y-2 text-sm">
            <div>Email: management@needforgroove.nyc</div>
            <div>Phone: +1 (555) 987-6543</div>
          </div>
        </div>
        
        <div className="border border-gray-600 p-4 rounded">
          <div className="text-gray-300 font-bold mb-3">PRESS & MEDIA</div>
          <div className="space-y-2 text-sm">
            <div>Email: press@needforgroove.nyc</div>
            <div>High-res photos and press kit available upon request</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminSection() {
  return (
    <div className="space-y-6 text-green-400">
      <div className="text-xl font-bold text-cyan-400">$ sudo ./admin_panel.sh</div>
      
      <div className="border border-red-400 p-4 rounded">
        <div className="text-red-400 font-bold mb-3">ADMIN ACCESS REQUIRED</div>
        <div className="text-sm mb-4">Please authenticate to access the content management system.</div>
        
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Username:</label>
            <input 
              type="text" 
              className="w-full bg-black border border-gray-600 p-2 text-green-400 font-mono"
              placeholder="n4gadmin"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Password:</label>
            <input 
              type="password" 
              className="w-full bg-black border border-gray-600 p-2 text-green-400 font-mono"
              placeholder="••••••••"
            />
          </div>
          <button className="bg-cyan-400 text-black px-4 py-2 rounded font-bold hover:bg-cyan-300 transition-colors">
            AUTHENTICATE
          </button>
        </div>
      </div>
    </div>
  );
}