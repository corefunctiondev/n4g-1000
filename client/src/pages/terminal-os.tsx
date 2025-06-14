import { useState, useEffect, useCallback } from 'react';
import { useLocation, Link } from 'wouter';
import { Monitor, Terminal, Zap, Music, Radio, Calendar, Disc, Headphones, Mail, Settings, User, LogOut, Menu, X, Folder, FolderOpen, File, Volume2, VolumeX } from 'lucide-react';
import { DynamicContent, DynamicText, DynamicLink } from '@/components/dynamic-content';
import { BuildingBlocks } from '@/components/building-blocks';
import { VisualEditor } from '@/components/visual-editor';
import { useContentBySection } from '@/hooks/use-content';
import { useAudioFeedback } from '@/hooks/use-audio-feedback';
import { GlobalBeatVisualizer } from '@/components/beat-visualizer';
import { usePreloadContent } from '@/hooks/use-preload-content';

interface TerminalOSProps {}

export default function TerminalOS({}: TerminalOSProps) {
  const [location, navigate] = useLocation();
  const [currentSection, setCurrentSection] = useState('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBurgerMenuOpen, setIsBurgerMenuOpen] = useState(false);
  const [scanlines, setScanlines] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [bootSequence, setBootSequence] = useState(true);
  const [bootText, setBootText] = useState('');
  const [glitchActive, setGlitchActive] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const audioFeedback = useAudioFeedback();
  
  // Preload all content to prevent text flashing
  usePreloadContent();
  
  // Beat visualizer states - synchronized with DJ interface
  const [deckAPlaying, setDeckAPlaying] = useState(false);
  const [deckBPlaying, setDeckBPlaying] = useState(false);
  const [deckABpm, setDeckABpm] = useState<number>();
  const [deckBBpm, setDeckBBpm] = useState<number>();
  
  // Lighting state - synchronized with DJ interface
  const [lightsOn, setLightsOn] = useState(true);

  // Sync beat visualizer and lighting data from DJ interface
  useEffect(() => {
    const syncDJData = () => {
      try {
        const beatData = localStorage.getItem('dj_beat_data');
        if (beatData) {
          const data = JSON.parse(beatData);
          setDeckAPlaying(data.deckAPlaying || false);
          setDeckBPlaying(data.deckBPlaying || false);
          setDeckABpm(data.deckABpm);
          setDeckBBpm(data.deckBBpm);
        }
        
        const lightsData = localStorage.getItem('dj_lights_state');
        if (lightsData) {
          setLightsOn(JSON.parse(lightsData));
        }
      } catch (error) {
        console.log('No DJ data found');
      }
    };

    // Initial sync
    syncDJData();

    // Listen for changes
    const interval = setInterval(syncDJData, 100);
    
    return () => clearInterval(interval);
  }, []);

  // Initialize current section from URL
  useEffect(() => {
    const path = location.replace('/', '') || 'home';
    setCurrentSection(path);
  }, [location]);

  // Fast boot sequence with typewriter effect and themed sound
  useEffect(() => {
    const bootLines = [
      'NEED FOR GROOVE OS',
      'v2.1.0',
      'Initializing audio systems...',
      'Loading DJ profiles...',
      'Connecting to music database...',
      'SYSTEM READY'
    ];
    
    let currentLine = 0;
    let currentChar = 0;
    let currentText = '';
    
    // Play initialization sound when boot starts
    if (soundEnabled) {
      audioFeedback.playSystemInit();
    }
    
    const typeText = () => {
      if (currentLine < bootLines.length) {
        if (currentChar < bootLines[currentLine].length) {
          currentText += bootLines[currentLine][currentChar];
          setBootText(currentText);
          currentChar++;
          setTimeout(typeText, 5); // Ultra fast typing
        } else {
          currentText += '\n';
          setBootText(currentText);
          currentLine++;
          currentChar = 0;
          
          // Play special sound when "Initializing audio systems..." appears
          if (currentLine === 2 && soundEnabled) {
            setTimeout(() => audioFeedback.playDJModeActivate(), 100);
          }
          
          setTimeout(typeText, 20); // Very short pause between lines
        }
      } else {
        // Boot complete, switch to main interface
        setTimeout(() => setBootSequence(false), 300);
      }
    };
    
    typeText();
  }, [soundEnabled, audioFeedback]);

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
    { id: 'home', label: 'HOME/', type: 'folder', description: 'System boot and overview', isLast: false },
    { id: 'sets', label: 'SETS/', type: 'folder', description: 'Live DJ performances', isLast: false },
    { id: 'podcasts', label: 'PODCASTS/', type: 'folder', description: 'Audio episodes', isLast: false },
    { id: 'bookings', label: 'BOOKINGS/', type: 'folder', description: 'Event schedule', isLast: false },
    { id: 'releases', label: 'RELEASES/', type: 'folder', description: 'Music catalog', isLast: false },
    { id: 'mixes', label: 'MIXES/', type: 'folder', description: 'Mix collections', isLast: false },
    { id: 'contact', label: 'CONTACT/', type: 'folder', description: 'Get in touch', isLast: false },
    { id: 'n4g-1000', label: 'N4G-1000.exe', type: 'file', description: 'DJ Equipment Interface', isLast: true },
  ];

  if (bootSequence) {
    return (
      <div className="min-h-screen bg-black text-blue-300 font-mono flex items-center justify-center">
        <div className="text-left">
          <pre className="text-sm whitespace-pre-line">
            {bootText}
            <span className="animate-pulse">|</span>
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-black text-white font-mono relative overflow-hidden ${glitchActive ? 'animate-pulse' : ''}`}>
      {/* Beat Visualizer Background - Only when lights are on */}
      {lightsOn && (
        <GlobalBeatVisualizer
          deckAPlaying={deckAPlaying}
          deckBPlaying={deckBPlaying}
          deckABpm={deckABpm}
          deckBBpm={deckBBpm}
          deckAAnalyser={null}
          deckBAnalyser={null}
        />
      )}
      
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
          <div className="text-gray-300 text-sm">
            NYC • HOUSE • TECHNO
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-300">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
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
            <div className="text-xs text-gray-300">Need For Groove OS v2.1.0</div>
          </div>
          
          <div className="p-2 space-y-1">
            {fileTreeItems.map((item, index) => {
              const isFolder = item.type === 'folder';
              const isActive = currentSection === item.id;
              const Icon = isActive && isFolder ? FolderOpen : isFolder ? Folder : File;
              
              return (
                <div key={item.id} className="relative">
                  {/* Tree lines */}
                  <div className="absolute left-2 top-0 h-full flex flex-col text-gray-500">
                    <div className="flex items-center h-6">
                      <span className="text-xs font-mono">
                        {item.isLast ? '└─' : '├─'}
                      </span>
                    </div>
                    {!item.isLast && (
                      <div className="w-px bg-gray-600 ml-[5px] flex-1"></div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleNavigation(item.id)}
                    className={`w-full text-left pl-8 pr-3 py-2 rounded transition-all duration-200 group ${
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
                <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
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

      {/* Burger Menu - File Tree Navigation */}
      {isBurgerMenuOpen && (
        <div className="absolute top-16 right-16 bg-gray-900 border border-cyan-400 rounded-lg p-4 z-50 w-72 shadow-2xl font-mono">
          <div className="text-cyan-400 font-bold text-sm mb-3 border-b border-gray-700 pb-2">
            FILE TREE
          </div>
          <div className="space-y-1">
            {fileTreeItems.map((item, index) => {
              const isActive = currentSection === item.id;
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
  const { data: homeContent = [] } = useContentBySection('home');
  const { data: heroContent = [] } = useContentBySection('hero');
  
  const getContent = (key: string, fallback: string = '') => {
    const item = [...homeContent, ...heroContent].find((c: any) => c.key === key);
    return item?.title || item?.content || fallback;
  };

  const getHeroContent = () => {
    return {
      title: getContent('hero_title', 'Welcome to N4G Terminal OS'),
      subtitle: getContent('hero_subtitle', 'Digital DJ Experience'), 
      content: getContent('hero_description', 'Experience DJ Stimulator in your browser with our authentic N4G-1000 featuring our complete music collection.'),
      buttonText: getContent('cta_button', 'Launch N4G-1000'),
      linkUrl: '/n4g-1000'
    };
  };

  const hero = getHeroContent();

  return (
    <div className="space-y-6 text-blue-300">
      <div className="text-xl font-bold text-cyan-400">$ ./welcome.sh</div>
      
      <div className="space-y-4">
        <div className="text-2xl font-bold text-cyan-400">{hero.title}</div>
        <div className="text-lg text-orange-400">{hero.subtitle}</div>
        <div className="text-sm leading-relaxed">{hero.content}</div>
      </div>
      
      <div className="space-y-4">
        <div className="text-cyan-400">{getContent('system_status_title', 'SYSTEM STATUS:')}</div>
        <div className="pl-4 space-y-1 text-sm">
          <div>{getContent('audio_engine_status', '✓ Audio Engine: ONLINE')}</div>
          <div>{getContent('dj_equipment_status', '✓ DJ Equipment: READY')}</div>
          <div>{getContent('music_library_status', '✓ Music Library: LOADED')}</div>
          <div>{getContent('network_status', '✓ Network: CONNECTED')}</div>
        </div>
      </div>
      
      <div className="border border-cyan-400 p-4 rounded">
        <a href={hero.linkUrl}>
          <button className="bg-cyan-400 text-black px-6 py-2 rounded font-bold hover:bg-cyan-300 transition-colors">
            {hero.buttonText}
          </button>
        </a>
      </div>
      
      <div className="space-y-4">
        <div className="text-cyan-400">NEED FOR GROOVE INFO:</div>
        <div className="pl-4 space-y-1 text-sm">
          <div>Location: <DynamicText contentKey="location" fallback="New York, NY" /></div>
          <div>Origin: <DynamicText contentKey="origin" fallback="Kosovo" /></div>
          <div>Genres: <DynamicText contentKey="genres" fallback="House, Techno, Minimal" /></div>
          <div>Experience: <DynamicText contentKey="experience" fallback="Almost a decade producing and playing" /></div>
        </div>
      </div>
      
      <div className="border border-cyan-400 p-4 rounded">
        <div className="text-orange-400 mb-2">UPCOMING:</div>
        <div className="text-sm"><DynamicText contentKey="next_gig" fallback="Saturday 06/14 at Virgo, Manhattan" /></div>
        <div className="text-sm mt-1"><DynamicText contentKey="upcoming_album" fallback="Album TUTTO PASSA releasing 06/18 with 27 tracks" /></div>
      </div>
    </div>
  );
}

function AboutSection() {
  const { data: aboutContent = [] } = useContentBySection('about');
  
  const getContent = (key: string, fallback: string = '') => {
    const item = aboutContent.find((c: any) => c.key === key);
    return item?.title || item?.content || fallback;
  };

  return (
    <div className="space-y-6 text-blue-300">
      <div className="text-xl font-bold text-cyan-400">$ cat ./profiles/*</div>
      
      <div className="space-y-4">
        <div className="text-2xl font-bold text-cyan-400">
          {getContent('about_title', 'About Need For Groove')}
        </div>
        <div className="text-sm leading-relaxed">
          <DynamicText contentKey="about_description" fallback="We're NEED FOR GROOVE - started making music in Kosovo, now calling New York home." />
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="text-xl font-bold text-cyan-400">
          {getContent('features_title', 'Professional Features')}
        </div>
        <div className="text-sm leading-relaxed">
          <DynamicText contentKey="features_description" fallback="Deep house grooves, driving techno rhythms, stripped-down minimal beats." />
        </div>
      </div>
      
      <div className="border border-cyan-400 p-4 rounded">
        <div className="text-cyan-400 font-bold mb-3">NEED FOR GROOVE</div>
        <div className="space-y-2 text-sm">
          <div>Location: <DynamicText contentKey="location" fallback="New York, NY" /></div>
          <div>Origin: <DynamicText contentKey="origin" fallback="Kosovo" /></div>
          <div>Genres: <DynamicText contentKey="genres" fallback="House, Techno, Minimal" /></div>
          <div>Experience: <DynamicText contentKey="experience" fallback="Almost a decade producing and playing" /></div>
        </div>
        <div className="mt-3 text-xs text-gray-300">
          <DynamicText contentKey="venues_played" fallback="Nearly 20 acknowledged NY venues including Williamsburg Hotel, Virgo, Musica, Blue" />
        </div>
      </div>
    </div>
  );
}

function SetsSection() {
  const { data: setsContent = [] } = useContentBySection('sets');
  
  const getContent = (key: string) => {
    const item = setsContent.find((c: any) => c.key === key);
    return item?.title || item?.content || '';
  };

  const isDevelopment = getContent('sets_coming_soon').includes('Development');

  return (
    <div className="space-y-6 text-blue-300">
      <div className="text-xl font-bold text-cyan-400">$ ls -la ./sets/</div>
      
      <div className="space-y-4">
        {isDevelopment ? (
          <BuildingBlocks text={getContent('sets_coming_soon')} />
        ) : (
          <div className="text-2xl font-bold text-cyan-400">
            {getContent('sets_coming_soon')}
          </div>
        )}
      </div>
    </div>
  );
}

function PodcastsSection() {
  const { data: podcastsContent = [] } = useContentBySection('podcasts');
  
  const getContent = (key: string) => {
    const item = podcastsContent.find((c: any) => c.key === key);
    return item?.title || item?.content || '';
  };

  const isDevelopment = getContent('podcasts_coming_soon').includes('Development');

  return (
    <div className="space-y-6 text-blue-300">
      <div className="text-xl font-bold text-cyan-400">$ ./podcast_manager.sh --list</div>
      
      <div className="space-y-4">
        {isDevelopment ? (
          <BuildingBlocks text={getContent('podcasts_coming_soon')} />
        ) : (
          <div className="text-2xl font-bold text-cyan-400">
            {getContent('podcasts_coming_soon')}
          </div>
        )}
      </div>
    </div>
  );
}

function BookingsSection() {
  const { data: bookingsContent = [] } = useContentBySection('bookings');
  
  const getContent = (key: string) => {
    const item = bookingsContent.find((c: any) => c.key === key);
    return item?.title || item?.content || '';
  };

  return (
    <div className="space-y-6 text-blue-300">
      <div className="text-xl font-bold text-cyan-400">$ calendar --upcoming</div>
      
      <div className="space-y-4">
        <div className="text-2xl font-bold text-cyan-400">
          {getContent('bookings_email')}
        </div>
        <div className="text-sm leading-relaxed">
          {getContent('bookings_social')}
        </div>
      </div>
    </div>
  );
}

function ReleasesSection() {
  const { data: releasesContent = [] } = useContentBySection('releases');
  
  // Show empty section since releases should not display anything
  return (
    <div className="space-y-6 text-blue-300">
      <div className="text-xl font-bold text-cyan-400">$ find ./releases/ -type f</div>
    </div>
  );
}

function MixesSection() {
  const { data: mixesContent = [] } = useContentBySection('mixes');
  
  const getContent = (key: string) => {
    const item = mixesContent.find((c: any) => c.key === key);
    return item?.title || item?.content || '';
  };

  return (
    <div className="space-y-6 text-blue-300">
      <div className="text-xl font-bold text-cyan-400">$ ./mix_archive.sh --browse</div>
      
      <div className="space-y-4">
        <div className="text-2xl font-bold text-cyan-400">
          {getContent('mixes_coming_soon')}
        </div>
      </div>
    </div>
  );
}

function ContactSection() {
  return (
    <div className="space-y-6 text-blue-300">
      <DynamicText 
        contentKey="contact_info" 
        fallback="$ cat ./contact.info"
        className="text-xl font-bold text-cyan-400"
        as="div"
      />
      
      <DynamicContent 
        section="contact"
        fallbackText=""
        className="space-y-6"
      />
      
      <div className="space-y-6">
        <div className="border border-cyan-400 p-4 rounded">
          <div className="text-cyan-400 font-bold mb-3">BOOKING INQUIRIES</div>
          <div className="space-y-2 text-sm">
            <div>Email: <DynamicText contentKey="contact_email" fallback="n4gsounds@gmail.com" /></div>
            <div>Phone: <DynamicText contentKey="contact_phone" fallback="+1 475 419 5769" /></div>
            <div>Instagram: <DynamicText contentKey="contact_instagram" fallback="@needforgroove" /></div>
          </div>
        </div>
        
        <div className="border border-orange-400 p-4 rounded">
          <div className="text-orange-400 font-bold mb-3">NEXT GIG</div>
          <div className="space-y-2 text-sm">
            <DynamicText contentKey="next_gig" fallback="Saturday 06/14 at Virgo, Manhattan" />
          </div>
        </div>
        
        <div className="border border-gray-600 p-4 rounded">
          <div className="text-gray-300 font-bold mb-3">ALBUM RELEASE</div>
          <div className="space-y-2 text-sm">
            <DynamicText contentKey="album_info" fallback="TUTTO PASSA - Album (27 tracks) - Release: 06/18/2025" />
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminSection() {
  const [, navigate] = useLocation();
  
  const handleAdminAccess = () => {
    navigate('/admin');
  };
  
  return (
    <div className="space-y-6 text-blue-300">
      <div className="text-xl font-bold text-cyan-400">$ sudo ./admin_panel.sh</div>
      
      <div className="border border-red-400 p-4 rounded">
        <div className="text-red-400 font-bold mb-3">ADMIN ACCESS REQUIRED</div>
        <div className="text-sm mb-4">Click below to access the content management system.</div>
        
        <button 
          onClick={handleAdminAccess}
          className="bg-cyan-400 text-black px-4 py-2 rounded font-bold hover:bg-cyan-300 transition-colors"
        >
          ACCESS ADMIN PANEL
        </button>
      </div>

      {/* Visual Editor - moved to main component */}
    </div>
  );
}