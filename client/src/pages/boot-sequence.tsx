import React, { useState, useEffect } from 'react';
import { useAudioFeedback } from '@/hooks/use-audio-feedback';
import { Button } from '@/components/ui/button';

interface BootSequenceProps {
  onComplete: (mode: 'dj' | 'explore') => void;
}

export function BootSequence({ onComplete }: BootSequenceProps) {
  const [stage, setStage] = useState<'blank' | 'booting' | 'bios' | 'loading' | 'welcome'>('blank');
  const [bootText, setBootText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [biosComplete, setBiosComplete] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'dj' | 'explore' | null>(null);
  const audioFeedback = useAudioFeedback();

  // Cursor blinking effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Boot sequence stages
  useEffect(() => {
    const timer1 = setTimeout(() => {
      // Stage 1: Power on sound and start BIOS
      audioFeedback.playSystemInit();
      setStage('booting');
    }, 1000);

    const timer2 = setTimeout(() => {
      // Stage 2: BIOS sequence
      setStage('bios');
      startBIOSSequence();
    }, 2500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [audioFeedback]);

  const startBIOSSequence = () => {
    const biosLines = [
      'N4G SYSTEM BIOS v3.14.159',
      'Copyright (C) 2025 Need For Groove Technologies',
      '',
      'Detecting hardware...',
      'Audio Interface............ OK',
      'DJ Controllers............. OK', 
      'Player Emulation........... OK',
      'Beat Detection Engine...... OK',
      'Crossfader System.......... OK',
      'Waveform Analyzer.......... OK',
      'Music Database............. OK',
      '',
      'Memory Test: 512MB OK',
      'Loading audio drivers...... OK',
      'Initializing DSP........... OK',
      '',
      'System initialization complete.',
      'Press any key to continue...'
    ];

    let currentLine = 0;
    let currentText = '';

    const typeLine = () => {
      if (currentLine < biosLines.length) {
        currentText += biosLines[currentLine] + '\n';
        setBootText(currentText);
        currentLine++;
        
        // Random delays for realistic computer boot feel
        const delay = biosLines[currentLine - 1] === '' ? 50 : 
                     biosLines[currentLine - 1].includes('....') ? 300 : 150;
        
        setTimeout(typeLine, delay);
      } else {
        setBiosComplete(true);
        // Auto-continue after BIOS
        setTimeout(() => {
          setStage('loading');
          startWelcomeSequence();
        }, 2000);
      }
    };

    typeLine();
  };

  const startWelcomeSequence = () => {
    const welcomeLines = [
      '',
      '████████╗███████╗██████╗ ███╗   ███╗██╗███╗   ██╗ █████╗ ██╗     ',
      '╚══██╔══╝██╔════╝██╔══██╗████╗ ████║██║████╗  ██║██╔══██╗██║     ',
      '   ██║   █████╗  ██████╔╝██╔████╔██║██║██╔██╗ ██║███████║██║     ',
      '   ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║██║██║╚██╗██║██╔══██║██║     ',
      '   ██║   ███████╗██║  ██║██║ ╚═╝ ██║██║██║ ╚████║██║  ██║███████╗',
      '   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝',
      '',
      '         ███╗   ██╗██╗  ██╗ ██████╗       ██████╗ ███████╗',
      '         ████╗  ██║██║  ██║██╔════╝      ██╔═══██╗██╔════╝',
      '         ██╔██╗ ██║███████║██║  ███╗     ██║   ██║███████╗',
      '         ██║╚██╗██║╚════██║██║   ██║     ██║   ██║╚════██║',
      '         ██║ ╚████║     ██║╚██████╔╝     ╚██████╔╝███████║',
      '         ╚═╝  ╚═══╝     ╚═╝ ╚═════╝       ╚═════╝ ╚══════╝',
      '',
      '',
      '              WELCOME TO NEED FOR GROOVE TERMINAL',
      '                     Professional DJ System',
      '',
      '═══════════════════════════════════════════════════════════════════',
      '',
    ];

    let currentLine = 0;
    let currentText = '';

    const typeLine = () => {
      if (currentLine < welcomeLines.length) {
        currentText += welcomeLines[currentLine] + '\n';
        setBootText(currentText);
        currentLine++;
        setTimeout(typeLine, 100);
      } else {
        // Welcome complete, show options
        setTimeout(() => {
          setStage('welcome');
          audioFeedback.playSuccess();
        }, 500);
      }
    };

    typeLine();
  };

  const handleOptionSelect = (option: 'dj' | 'explore') => {
    setSelectedOption(option);
    audioFeedback.playClick();
    
    if (option === 'dj') {
      // Launch DJ mode with code loading sequence
      setStage('loading');
      startDJLaunchSequence();
    } else {
      // Go to main site
      setTimeout(() => onComplete('explore'), 500);
    }
  };

  const startDJLaunchSequence = () => {
    const djLaunchLines = [
      '',
      'LAUNCHING DJ INTERFACE...',
      '',
      'Loading core modules:',
      '  ├─ Audio Engine................ ████████████ 100%',
      '  ├─ Deck Controllers............ ████████████ 100%', 
      '  ├─ Mixer Interface............. ████████████ 100%',
      '  ├─ BPM Detection............... ████████████ 100%',
      '  ├─ Waveform Renderer........... ████████████ 100%',
      '  └─ Track Database.............. ████████████ 100%',
      '',
      'Initializing hardware emulation:',
      '  ├─ N4G-1000 Deck Emulation..... ████████████ 100%',
      '  ├─ N4G-800 Mixer............... ████████████ 100%',
      '  └─ Vinyl Mode Simulation....... ████████████ 100%',
      '',
      'Starting N4G-1000 Digital Player Interface...',
      '',
      'DJ SYSTEM READY',
      '════════════════',
      '',
    ];

    let currentLine = 0;
    let currentText = bootText;

    const typeLine = () => {
      if (currentLine < djLaunchLines.length) {
        currentText += djLaunchLines[currentLine] + '\n';
        setBootText(currentText);
        currentLine++;
        
        // Faster loading for progress bars
        const delay = djLaunchLines[currentLine - 1].includes('████') ? 200 : 100;
        setTimeout(typeLine, delay);
      } else {
        // DJ launch complete
        setTimeout(() => {
          audioFeedback.playDJModeActivate();
          setTimeout(() => onComplete('dj'), 1000);
        }, 500);
      }
    };

    typeLine();
  };

  const renderContent = () => {
    switch (stage) {
      case 'blank':
        return (
          <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="w-2 h-2 bg-green-400 animate-pulse" />
          </div>
        );

      case 'booting':
        return (
          <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-green-400 font-mono text-sm">
              <div className="animate-pulse">Initializing system...</div>
            </div>
          </div>
        );

      case 'bios':
      case 'loading':
        return (
          <div className="min-h-screen bg-black p-4 font-mono text-green-400 text-sm overflow-hidden">
            <pre className="whitespace-pre-wrap leading-tight">
              {bootText}
              {showCursor && stage === 'bios' && biosComplete && <span className="bg-green-400">_</span>}
            </pre>
          </div>
        );

      case 'welcome':
        return (
          <div className="min-h-screen bg-black p-4 font-mono text-green-400 text-sm overflow-hidden">
            <pre className="whitespace-pre-wrap leading-tight mb-8">
              {bootText}
            </pre>
            
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="text-center text-cyan-400 text-lg mb-8">
                What would you like to do?
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <button
                  onClick={() => handleOptionSelect('dj')}
                  className="h-32 bg-black border-2 border-cyan-400 text-cyan-400 font-mono text-lg transition-all duration-200 hover:bg-cyan-400 hover:text-black hover:shadow-lg hover:shadow-cyan-400/50 relative group"
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2 font-bold">$ ./launch_n4g.sh</div>
                    <div className="text-sm opacity-80 group-hover:opacity-100">Initialize N4G-1000 Player Interface</div>
                    <div className="absolute bottom-2 left-4 text-xs opacity-60 group-hover:opacity-80">
                      [ENTER] to execute
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => handleOptionSelect('explore')}
                  className="h-32 bg-black border-2 border-green-400 text-green-400 font-mono text-lg transition-all duration-200 hover:bg-green-400 hover:text-black hover:shadow-lg hover:shadow-green-400/50 relative group"
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2 font-bold">$ ./explore_site.sh</div>
                    <div className="text-sm opacity-80 group-hover:opacity-100">Browse Need For Groove Terminal</div>
                    <div className="absolute bottom-2 left-4 text-xs opacity-60 group-hover:opacity-80">
                      [ENTER] to execute
                    </div>
                  </div>
                </button>
              </div>
              
              <div className="text-center text-xs text-gray-500 mt-8">
                Use your mouse or keyboard to select an option
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return renderContent();
}