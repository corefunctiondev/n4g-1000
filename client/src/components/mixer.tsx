import { useState, useCallback } from 'react';
import { MixerState } from '@/types/audio';
import { audioEngine } from '@/lib/audio-engine';

export function Mixer() {
  const [mixer, setMixer] = useState<MixerState>({
    crossfader: 50,
    masterVolume: 80,
    cueVolume: 50,
    effects: {
      reverb: false,
      delay: false,
      filter: false,
      flanger: false,
    },
  });

  const [channelA, setChannelA] = useState({
    gain: 75,
    eq: { high: 50, mid: 50, low: 50 },
    volume: 85,
    pfl: false,
    cue: false,
  });

  const [channelB, setChannelB] = useState({
    gain: 75,
    eq: { high: 50, mid: 50, low: 50 },
    volume: 85,
    pfl: false,
    cue: false,
  });

  const [tempoA, setTempoA] = useState(0);
  const [tempoB, setTempoB] = useState(0);
  const [tempoRangeA, setTempoRangeA] = useState(8);
  const [tempoRangeB, setTempoRangeB] = useState(8);
  
  const [isDragging, setIsDragging] = useState<string | null>(null);

  const handleCrossfader = useCallback((value: number) => {
    setMixer(prev => ({ ...prev, crossfader: value }));
    // Apply crossfader logic here
  }, []);

  const handleMasterVolume = useCallback((value: number) => {
    setMixer(prev => ({ ...prev, masterVolume: value }));
    audioEngine.setMasterVolume(value / 100);
  }, []);

  const handleCueVolume = useCallback((value: number) => {
    setMixer(prev => ({ ...prev, cueVolume: value }));
  }, []);

  const handleTempoA = useCallback((value: number) => {
    setTempoA(value);
    audioEngine.setTempo('A', value);
  }, []);

  const handleTempoB = useCallback((value: number) => {
    setTempoB(value);
    audioEngine.setTempo('B', value);
  }, []);

  const resetTempoA = useCallback(() => {
    setTempoA(0);
    audioEngine.setTempo('A', 0);
  }, []);

  const resetTempoB = useCallback(() => {
    setTempoB(0);
    audioEngine.setTempo('B', 0);
  }, []);

  const cycleTempoRangeA = useCallback(() => {
    setTempoRangeA(prev => prev === 8 ? 16 : prev === 16 ? 32 : 8);
  }, []);

  const cycleTempoRangeB = useCallback(() => {
    setTempoRangeB(prev => prev === 8 ? 16 : prev === 16 ? 32 : 8);
  }, []);

  const handleTempoMouseDown = useCallback((deck: 'A' | 'B') => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(`tempo-${deck}`);
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = (e.target as HTMLElement).closest('.n4g-fader-track')?.getBoundingClientRect();
      if (!rect) return;
      
      const y = e.clientY - rect.top;
      const range = deck === 'A' ? tempoRangeA : tempoRangeB;
      const percentage = Math.max(0, Math.min(1, y / rect.height));
      const value = (1 - percentage) * range * 2 - range; // -range to +range
      
      if (deck === 'A') {
        handleTempoA(value);
      } else {
        handleTempoB(value);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      setIsDragging(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [tempoRangeA, tempoRangeB, handleTempoA, handleTempoB]);

  const toggleEffect = useCallback((effect: keyof MixerState['effects']) => {
    setMixer(prev => ({
      ...prev,
      effects: {
        ...prev.effects,
        [effect]: !prev.effects[effect],
      },
    }));
  }, []);

  // Knob interaction handlers
  const handleKnobMouseDown = useCallback((knobType: string, channel?: 'A' | 'B') => (event: React.MouseEvent) => {
    event.preventDefault();
    setIsDragging(`${knobType}${channel ? `-${channel}` : ''}`);
    const startY = event.clientY;
    const startValue = getKnobValue(knobType, channel);

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const deltaY = startY - e.clientY;
      const sensitivity = 0.5;
      const newValue = Math.max(0, Math.min(100, startValue + deltaY * sensitivity));
      updateKnobValue(knobType, newValue, channel);
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      setIsDragging(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  // Fader interaction handlers
  const handleFaderMouseDown = useCallback((faderType: string, channel?: 'A' | 'B') => (event: React.MouseEvent) => {
    event.preventDefault();
    setIsDragging(`${faderType}${channel ? `-${channel}` : ''}`);
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const y = e.clientY - rect.top;
      const height = rect.height;
      const percentage = Math.max(0, Math.min(100, ((height - y) / height) * 100));
      updateFaderValue(faderType, percentage, channel);
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      setIsDragging(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  // Crossfader interaction
  const handleCrossfaderMouseDown = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setIsDragging('crossfader');
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const x = e.clientX - rect.left;
      const width = rect.width;
      const percentage = Math.max(0, Math.min(100, (x / width) * 100));
      handleCrossfader(percentage);
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      setIsDragging(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [handleCrossfader]);

  // Helper functions to get and update values
  const getKnobValue = (knobType: string, channel?: 'A' | 'B') => {
    if (channel === 'A') {
      if (knobType === 'gain') return channelA.gain;
      if (knobType === 'high') return channelA.eq.high;
      if (knobType === 'mid') return channelA.eq.mid;
      if (knobType === 'low') return channelA.eq.low;
    } else if (channel === 'B') {
      if (knobType === 'gain') return channelB.gain;
      if (knobType === 'high') return channelB.eq.high;
      if (knobType === 'mid') return channelB.eq.mid;
      if (knobType === 'low') return channelB.eq.low;
    }
    if (knobType === 'master') return mixer.masterVolume;
    if (knobType === 'cue') return mixer.cueVolume;
    return 50;
  };

  const updateKnobValue = (knobType: string, value: number, channel?: 'A' | 'B') => {
    if (channel === 'A') {
      if (knobType === 'gain') setChannelA(prev => ({ ...prev, gain: value }));
      if (knobType === 'high') {
        audioEngine.setChannelEQ('A', 'high', value);
        setChannelA(prev => ({ ...prev, eq: { ...prev.eq, high: value } }));
      }
      if (knobType === 'mid') {
        audioEngine.setChannelEQ('A', 'mid', value);
        setChannelA(prev => ({ ...prev, eq: { ...prev.eq, mid: value } }));
      }
      if (knobType === 'low') {
        audioEngine.setChannelEQ('A', 'low', value);
        setChannelA(prev => ({ ...prev, eq: { ...prev.eq, low: value } }));
      }
    } else if (channel === 'B') {
      if (knobType === 'gain') setChannelB(prev => ({ ...prev, gain: value }));
      if (knobType === 'high') {
        audioEngine.setChannelEQ('B', 'high', value);
        setChannelB(prev => ({ ...prev, eq: { ...prev.eq, high: value } }));
      }
      if (knobType === 'mid') {
        audioEngine.setChannelEQ('B', 'mid', value);
        setChannelB(prev => ({ ...prev, eq: { ...prev.eq, mid: value } }));
      }
      if (knobType === 'low') {
        audioEngine.setChannelEQ('B', 'low', value);
        setChannelB(prev => ({ ...prev, eq: { ...prev.eq, low: value } }));
      }
    }
    if (knobType === 'master') handleMasterVolume(value);
    if (knobType === 'cue') handleCueVolume(value);
  };

  const updateFaderValue = (faderType: string, value: number, channel?: 'A' | 'B') => {
    if (faderType === 'master') {
      handleMasterVolume(value);
    } else if (channel === 'A') {
      audioEngine.setChannelVolume('A', value);
      setChannelA(prev => ({ ...prev, volume: value }));
    } else if (channel === 'B') {
      audioEngine.setChannelVolume('B', value);
      setChannelB(prev => ({ ...prev, volume: value }));
    }
  };

  // Button handlers
  const togglePFL = useCallback((channel: 'A' | 'B') => {
    if (channel === 'A') {
      setChannelA(prev => ({ ...prev, pfl: !prev.pfl }));
    } else {
      setChannelB(prev => ({ ...prev, pfl: !prev.pfl }));
    }
  }, []);

  const toggleCue = useCallback((channel: 'A' | 'B') => {
    if (channel === 'A') {
      setChannelA(prev => ({ ...prev, cue: !prev.cue }));
    } else {
      setChannelB(prev => ({ ...prev, cue: !prev.cue }));
    }
  }, []);

  return (
    <div 
      className="n4g-mixer p-2 w-full h-full flex flex-col"
    >
      {/* Top Section - N4G Branding */}
      <div className="text-center mb-2">
        <div className="text-xs font-bold text-white mb-1">Groover</div>
        <div className="text-xs text-gray-300 font-mono">N4G-800</div>
      </div>

      {/* Channel Strips - Compact Layout */}
      <div className="flex gap-1 mb-2 flex-1">
        {/* Channel A */}
        <div className="n4g-eq-section p-1 flex-1">
          <div className="text-center mb-1">
            <div className="text-xs font-bold text-blue-300">CH A</div>
          </div>
          
          {/* Compact EQ Controls */}
          <div className="flex flex-col items-center gap-1 mb-1">
            <div className="text-center">
              <div 
                className={`n4g-knob w-8 h-8 mx-auto cursor-pointer transition-colors ${
                  isDragging === 'high-A' ? 'bg-blue-400' : ''
                }`}
                style={{ transform: `rotate(${(channelA.eq.high - 50) * 2.7}deg)` }}
                onMouseDown={handleKnobMouseDown('high', 'A')}
              />
              <div className="text-xs text-gray-300">HI</div>
            </div>
            <div className="text-center">
              <div 
                className={`n4g-knob w-8 h-8 mx-auto cursor-pointer transition-colors ${
                  isDragging === 'mid-A' ? 'bg-blue-400' : ''
                }`}
                style={{ transform: `rotate(${(channelA.eq.mid - 50) * 2.7}deg)` }}
                onMouseDown={handleKnobMouseDown('mid', 'A')}
              />
              <div className="text-xs text-gray-300">MID</div>
            </div>
            <div className="text-center">
              <div 
                className={`n4g-knob w-8 h-8 mx-auto cursor-pointer transition-colors ${
                  isDragging === 'low-A' ? 'bg-blue-400' : ''
                }`}
                style={{ transform: `rotate(${(channelA.eq.low - 50) * 2.7}deg)` }}
                onMouseDown={handleKnobMouseDown('low', 'A')}
              />
              <div className="text-xs text-gray-300">LOW</div>
            </div>
          </div>

          {/* Channel Fader - Longer */}
          <div className="flex justify-center mb-1">
            <div 
              className="n4g-fader-track h-16 w-4 relative cursor-pointer"
              onMouseDown={handleFaderMouseDown('volume', 'A')}
            >
              <div 
                className={`n4g-fader-handle w-6 h-4 absolute -left-1 transition-colors ${
                  isDragging === 'volume-A' ? 'bg-blue-400' : ''
                }`}
                style={{ 
                  top: `${((100 - channelA.volume) / 100) * (64 - 16)}px`,
                }}
              />
            </div>
          </div>


        </div>



        {/* Channel B */}
        <div className="n4g-eq-section p-1 flex-1">
          <div className="text-center mb-1">
            <div className="text-xs font-bold text-orange-400">CH B</div>
          </div>
          
          {/* Compact EQ Controls */}
          <div className="flex flex-col items-center gap-1 mb-1">
            <div className="text-center">
              <div 
                className={`n4g-knob w-8 h-8 mx-auto cursor-pointer transition-colors ${
                  isDragging === 'high-B' ? 'bg-orange-400' : ''
                }`}
                style={{ transform: `rotate(${(channelB.eq.high - 50) * 2.7}deg)` }}
                onMouseDown={handleKnobMouseDown('high', 'B')}
              />
              <div className="text-xs text-gray-300">HI</div>
            </div>
            <div className="text-center">
              <div 
                className={`n4g-knob w-8 h-8 mx-auto cursor-pointer transition-colors ${
                  isDragging === 'mid-B' ? 'bg-orange-400' : ''
                }`}
                style={{ transform: `rotate(${(channelB.eq.mid - 50) * 2.7}deg)` }}
                onMouseDown={handleKnobMouseDown('mid', 'B')}
              />
              <div className="text-xs text-gray-300">MID</div>
            </div>
            <div className="text-center">
              <div 
                className={`n4g-knob w-8 h-8 mx-auto cursor-pointer transition-colors ${
                  isDragging === 'low-B' ? 'bg-orange-400' : ''
                }`}
                style={{ transform: `rotate(${(channelB.eq.low - 50) * 2.7}deg)` }}
                onMouseDown={handleKnobMouseDown('low', 'B')}
              />
              <div className="text-xs text-gray-300">LOW</div>
            </div>
          </div>

          {/* Channel Fader - Longer */}
          <div className="flex justify-center mb-1">
            <div 
              className="n4g-fader-track h-16 w-4 relative cursor-pointer"
              onMouseDown={handleFaderMouseDown('volume', 'B')}
            >
              <div 
                className={`n4g-fader-handle w-6 h-4 absolute -left-1 transition-colors ${
                  isDragging === 'volume-B' ? 'bg-orange-400' : ''
                }`}
                style={{ 
                  top: `${((100 - channelB.volume) / 100) * (64 - 16)}px`,
                }}
              />
            </div>
          </div>


        </div>
      </div>

      {/* Center Tempo Controls */}
      <div className="flex justify-center mt-4">
        <div className="n4g-eq-section p-2">
          <div className="text-center mb-2">
            <div className="text-xs font-bold text-white">TEMPO</div>
          </div>
          <div className="flex gap-4 justify-center">
            {/* Deck A Tempo */}
            <div className="flex flex-col items-center">
              <div className="text-xs text-blue-300 mb-1">DECK A</div>
              <div className="text-xs text-blue-300 mb-2">{tempoA >= 0 ? '+' : ''}{tempoA.toFixed(1)}%</div>
              <div 
                className="n4g-fader-track h-16 w-4 relative cursor-pointer"
                onMouseDown={handleTempoMouseDown('A')}
              >
                <div 
                  className={`n4g-fader-handle w-6 h-4 absolute -left-1 transition-colors ${
                    isDragging === 'tempo-A' ? 'bg-blue-400' : ''
                  }`}
                  style={{ 
                    top: `${((tempoRangeA - tempoA) / (tempoRangeA * 2)) * (64 - 16)}px` 
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-1 mt-2">
                <button 
                  className="n4g-button py-1 px-1 text-xs hover:bg-blue-500"
                  onClick={cycleTempoRangeA}
                >
                  ±{tempoRangeA}%
                </button>
                <button 
                  className="n4g-button py-1 px-1 text-xs hover:bg-blue-500"
                  onClick={resetTempoA}
                >
                  RST
                </button>
              </div>
            </div>
            
            {/* Deck B Tempo */}
            <div className="flex flex-col items-center">
              <div className="text-xs text-orange-400 mb-1">DECK B</div>
              <div className="text-xs text-orange-400 mb-2">{tempoB >= 0 ? '+' : ''}{tempoB.toFixed(1)}%</div>
              <div 
                className="n4g-fader-track h-16 w-4 relative cursor-pointer"
                onMouseDown={handleTempoMouseDown('B')}
              >
                <div 
                  className={`n4g-fader-handle w-6 h-4 absolute -left-1 transition-colors ${
                    isDragging === 'tempo-B' ? 'bg-orange-400' : ''
                  }`}
                  style={{ 
                    top: `${((tempoRangeB - tempoB) / (tempoRangeB * 2)) * (64 - 16)}px` 
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-1 mt-2">
                <button 
                  className="n4g-button py-1 px-1 text-xs hover:bg-orange-500"
                  onClick={cycleTempoRangeB}
                >
                  ±{tempoRangeB}%
                </button>
                <button 
                  className="n4g-button py-1 px-1 text-xs hover:bg-orange-500"
                  onClick={resetTempoB}
                >
                  RST
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
