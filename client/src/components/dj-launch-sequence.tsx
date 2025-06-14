import React, { useState, useEffect } from 'react';
import { useAudioFeedback } from '@/hooks/use-audio-feedback';

interface DJLaunchSequenceProps {
  onComplete: () => void;
}

export function DJLaunchSequence({ onComplete }: DJLaunchSequenceProps) {
  const [stage, setStage] = useState<'loading' | 'complete'>('loading');
  const [bootText, setBootText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const audioFeedback = useAudioFeedback();

  // Cursor blinking effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Play initialization sound and start loading sequence
    audioFeedback.playSystemInit();
    startDJLaunchSequence();
  }, [audioFeedback]);

  const startDJLaunchSequence = () => {
    const djLaunchLines = [
      '',
      'LAUNCHING N4G-1000 DJ INTERFACE...',
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
      'Connecting to music library:',
      '  ├─ Need For Groove Tracks...... ████████████ 100%',
      '  └─ Audio Processing Ready...... ████████████ 100%',
      '',
      'N4G-1000 DIGITAL TURNTABLE INTERFACE READY',
      '═══════════════════════════════════════════',
      '',
      'Welcome to the future of DJing.',
      '',
    ];

    let currentLine = 0;
    let currentText = '';

    const typeLine = () => {
      if (currentLine < djLaunchLines.length) {
        currentText += djLaunchLines[currentLine] + '\n';
        setBootText(currentText);
        currentLine++;
        
        // Faster loading for progress bars, slower for text
        const delay = djLaunchLines[currentLine - 1].includes('████') ? 150 : 80;
        setTimeout(typeLine, delay);
      } else {
        // DJ launch complete
        setTimeout(() => {
          audioFeedback.playDJModeActivate();
          setStage('complete');
          setTimeout(() => onComplete(), 1500);
        }, 800);
      }
    };

    typeLine();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div className="w-full h-full p-4 font-mono text-green-400 text-sm overflow-hidden flex flex-col justify-center">
        <div className="max-w-4xl mx-auto">
          <pre className="whitespace-pre-wrap leading-tight">
            {bootText}
            {showCursor && stage === 'loading' && <span className="bg-green-400 text-black">_</span>}
          </pre>
          
          {stage === 'complete' && (
            <div className="text-center mt-8 text-cyan-400 text-lg animate-pulse">
              Launching DJ Interface...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}