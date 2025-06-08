import { useState, useCallback } from 'react';
import { MixerState } from '@/types/audio';
import { audioEngine } from '@/lib/audio-engine';
import { Knob } from './knob';
import { Fader } from './fader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

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
      if (knobType === 'high') setChannelA(prev => ({ ...prev, eq: { ...prev.eq, high: value } }));
      if (knobType === 'mid') setChannelA(prev => ({ ...prev, eq: { ...prev.eq, mid: value } }));
      if (knobType === 'low') setChannelA(prev => ({ ...prev, eq: { ...prev.eq, low: value } }));
    } else if (channel === 'B') {
      if (knobType === 'gain') setChannelB(prev => ({ ...prev, gain: value }));
      if (knobType === 'high') setChannelB(prev => ({ ...prev, eq: { ...prev.eq, high: value } }));
      if (knobType === 'mid') setChannelB(prev => ({ ...prev, eq: { ...prev.eq, mid: value } }));
      if (knobType === 'low') setChannelB(prev => ({ ...prev, eq: { ...prev.eq, low: value } }));
    }
    if (knobType === 'master') handleMasterVolume(value);
    if (knobType === 'cue') handleCueVolume(value);
  };

  const updateFaderValue = (faderType: string, value: number, channel?: 'A' | 'B') => {
    if (faderType === 'master') {
      handleMasterVolume(value);
    } else if (channel === 'A') {
      setChannelA(prev => ({ ...prev, volume: value }));
    } else if (channel === 'B') {
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
      className="pioneer-mixer p-4 w-[400px] h-[320px] flex flex-col"
    >
      {/* Top Section - Pioneer Branding */}
      <div className="text-center mb-3">
        <div className="text-sm font-bold text-white mb-1">Pioneer DJ</div>
        <div className="text-xs text-gray-400 font-mono">DJM-750MK2</div>
      </div>

      {/* Channel Strips - Horizontal Layout */}
      <div className="flex gap-2 mb-4 flex-1">
        {/* Channel A */}
        <div className="pioneer-eq-section p-2" style={{ width: '120px' }}>
          <div className="text-center mb-2">
            <div className="text-sm font-bold text-blue-400">CH A</div>
          </div>
          
          {/* Horizontal EQ Controls */}
          <div className="flex gap-2 justify-center mb-3">
            <div className="text-center">
              <div 
                className={`pioneer-knob w-8 h-8 mx-auto mb-1 cursor-pointer transition-colors ${
                  isDragging === 'high-A' ? 'bg-blue-400' : ''
                }`}
                style={{ transform: `rotate(${(channelA.eq.high - 50) * 2.7}deg)` }}
                onMouseDown={handleKnobMouseDown('high', 'A')}
              />
              <div className="text-xs text-gray-400">HI</div>
            </div>
            <div className="text-center">
              <div 
                className={`pioneer-knob w-8 h-8 mx-auto mb-1 cursor-pointer transition-colors ${
                  isDragging === 'mid-A' ? 'bg-blue-400' : ''
                }`}
                style={{ transform: `rotate(${(channelA.eq.mid - 50) * 2.7}deg)` }}
                onMouseDown={handleKnobMouseDown('mid', 'A')}
              />
              <div className="text-xs text-gray-400">MID</div>
            </div>
            <div className="text-center">
              <div 
                className={`pioneer-knob w-8 h-8 mx-auto mb-1 cursor-pointer transition-colors ${
                  isDragging === 'low-A' ? 'bg-blue-400' : ''
                }`}
                style={{ transform: `rotate(${(channelA.eq.low - 50) * 2.7}deg)` }}
                onMouseDown={handleKnobMouseDown('low', 'A')}
              />
              <div className="text-xs text-gray-400">LOW</div>
            </div>
          </div>

          {/* Channel Fader */}
          <div className="flex justify-center">
            <div 
              className="pioneer-fader-track h-16 w-6 relative cursor-pointer"
              onMouseDown={handleFaderMouseDown('volume', 'A')}
            >
              <div 
                className={`pioneer-fader-handle w-8 h-4 absolute -left-1 transition-colors ${
                  isDragging === 'volume-A' ? 'bg-blue-400' : ''
                }`}
                style={{ 
                  top: `${((100 - channelA.volume) / 100) * (64 - 16)}px`,
                }}
              />
            </div>
          </div>

          <div className="flex gap-1 mt-2">
            <button 
              className={`pioneer-button py-1 px-2 text-xs transition-all ${
                channelA.pfl ? 'bg-blue-500 text-white' : 'text-blue-400 hover:bg-blue-500 hover:text-white'
              }`}
              onClick={() => togglePFL('A')}
            >
              PFL
            </button>
            <button 
              className={`pioneer-button py-1 px-2 text-xs transition-all ${
                channelA.cue ? 'bg-orange-500 text-white' : 'text-orange-400 hover:bg-orange-500 hover:text-white'
              }`}
              onClick={() => toggleCue('A')}
            >
              CUE
            </button>
          </div>
        </div>

        {/* Center Section - Crossfader and Master */}
        <div className="pioneer-eq-section p-2" style={{ width: '140px' }}>
          <div className="text-center mb-2">
            <div className="text-sm font-bold text-white">MASTER</div>
          </div>

          {/* Crossfader */}
          <div className="mb-2">
            <div className="text-center mb-1">
              <div className="text-xs text-gray-400">CROSSFADER</div>
            </div>
            <div className="flex justify-center">
              <div 
                className="pioneer-fader-track w-24 h-6 relative cursor-pointer"
                onMouseDown={handleCrossfaderMouseDown}
              >
                <div 
                  className={`pioneer-fader-handle w-4 h-8 absolute -top-1 transition-colors ${
                    isDragging === 'crossfader' ? 'bg-purple-400' : ''
                  }`}
                  style={{ left: `${(mixer.crossfader / 100) * (96 - 16)}px` }}
                />
              </div>
            </div>
          </div>

          {/* Master Volume Knobs */}
          <div className="flex justify-center gap-2">
            <div className="text-center">
              <div 
                className={`pioneer-knob w-8 h-8 mx-auto mb-1 cursor-pointer transition-colors ${
                  isDragging === 'master' ? 'bg-green-400' : ''
                }`}
                style={{ transform: `rotate(${(mixer.masterVolume - 50) * 2.7}deg)` }}
                onMouseDown={handleKnobMouseDown('master')}
              />
              <div className="text-xs text-gray-400">MASTER</div>
            </div>
            
            <div className="text-center">
              <div 
                className={`pioneer-knob w-6 h-6 mx-auto mb-1 cursor-pointer transition-colors ${
                  isDragging === 'cue' ? 'bg-orange-400' : ''
                }`}
                style={{ transform: `rotate(${(mixer.cueVolume - 50) * 2.7}deg)` }}
                onMouseDown={handleKnobMouseDown('cue')}
              />
              <div className="text-xs text-gray-400">CUE</div>
            </div>
          </div>
        </div>

        {/* Channel B */}
        <div className="pioneer-eq-section p-2" style={{ width: '120px' }}>
          <div className="text-center mb-2">
            <div className="text-sm font-bold text-orange-400">CH B</div>
          </div>
          
          {/* Horizontal EQ Controls */}
          <div className="flex gap-2 justify-center mb-3">
            <div className="text-center">
              <div 
                className={`pioneer-knob w-8 h-8 mx-auto mb-1 cursor-pointer transition-colors ${
                  isDragging === 'high-B' ? 'bg-orange-400' : ''
                }`}
                style={{ transform: `rotate(${(channelB.eq.high - 50) * 2.7}deg)` }}
                onMouseDown={handleKnobMouseDown('high', 'B')}
              />
              <div className="text-xs text-gray-400">HI</div>
            </div>
            <div className="text-center">
              <div 
                className={`pioneer-knob w-8 h-8 mx-auto mb-1 cursor-pointer transition-colors ${
                  isDragging === 'mid-B' ? 'bg-orange-400' : ''
                }`}
                style={{ transform: `rotate(${(channelB.eq.mid - 50) * 2.7}deg)` }}
                onMouseDown={handleKnobMouseDown('mid', 'B')}
              />
              <div className="text-xs text-gray-400">MID</div>
            </div>
            <div className="text-center">
              <div 
                className={`pioneer-knob w-8 h-8 mx-auto mb-1 cursor-pointer transition-colors ${
                  isDragging === 'low-B' ? 'bg-orange-400' : ''
                }`}
                style={{ transform: `rotate(${(channelB.eq.low - 50) * 2.7}deg)` }}
                onMouseDown={handleKnobMouseDown('low', 'B')}
              />
              <div className="text-xs text-gray-400">LOW</div>
            </div>
          </div>

          {/* Channel Fader */}
          <div className="flex justify-center">
            <div 
              className="pioneer-fader-track h-16 w-6 relative cursor-pointer"
              onMouseDown={handleFaderMouseDown('volume', 'B')}
            >
              <div 
                className={`pioneer-fader-handle w-8 h-4 absolute -left-1 transition-colors ${
                  isDragging === 'volume-B' ? 'bg-orange-400' : ''
                }`}
                style={{ 
                  top: `${((100 - channelB.volume) / 100) * (64 - 16)}px`,
                }}
              />
            </div>
          </div>

          <div className="flex gap-1 mt-2">
            <button 
              className={`pioneer-button py-1 px-2 text-xs transition-all ${
                channelB.pfl ? 'bg-orange-500 text-white' : 'text-orange-400 hover:bg-orange-500 hover:text-white'
              }`}
              onClick={() => togglePFL('B')}
            >
              PFL
            </button>
            <button 
              className={`pioneer-button py-1 px-2 text-xs transition-all ${
                channelB.cue ? 'bg-blue-500 text-white' : 'text-blue-400 hover:bg-blue-500 hover:text-white'
              }`}
              onClick={() => toggleCue('B')}
            >
              CUE
            </button>
          </div>
        </div>
      </div>




    </div>
  );
}
