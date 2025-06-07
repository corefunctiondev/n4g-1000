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

  return (
    <div className="pioneer-mixer p-6 w-full max-w-sm mx-auto">
      {/* Top Section - Pioneer Branding */}
      <div className="text-center mb-6">
        <div className="text-lg font-bold text-white mb-1">Pioneer DJ</div>
        <div className="text-xs text-gray-400 font-mono">DJM-750MK2</div>
      </div>

      {/* Channel Strips */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Channel A */}
        <div className="pioneer-eq-section p-3">
          <div className="text-center mb-3">
            <div className="text-xs font-bold text-blue-400">CH A</div>
          </div>
          
          {/* Channel EQ */}
          <div className="space-y-2 mb-4">
            <div className="text-center">
              <div className="pioneer-knob w-8 h-8 mx-auto mb-1" />
              <div className="text-xs text-gray-400">HI</div>
            </div>
            <div className="text-center">
              <div className="pioneer-knob w-8 h-8 mx-auto mb-1" />
              <div className="text-xs text-gray-400">MID</div>
            </div>
            <div className="text-center">
              <div className="pioneer-knob w-8 h-8 mx-auto mb-1" />
              <div className="text-xs text-gray-400">LOW</div>
            </div>
          </div>

          {/* Channel Fader */}
          <div className="flex justify-center mb-3">
            <div className="pioneer-fader-track h-24 w-6 relative">
              <div className="pioneer-fader-handle w-8 h-4 absolute -left-1 top-4" />
            </div>
          </div>

          {/* PFL Button */}
          <div className="text-center">
            <button className="pioneer-button py-1 px-2 text-xs text-blue-400">
              PFL
            </button>
          </div>
        </div>

        {/* Channel B */}
        <div className="pioneer-eq-section p-3">
          <div className="text-center mb-3">
            <div className="text-xs font-bold text-orange-400">CH B</div>
          </div>
          
          {/* Channel EQ */}
          <div className="space-y-2 mb-4">
            <div className="text-center">
              <div className="pioneer-knob w-8 h-8 mx-auto mb-1" />
              <div className="text-xs text-gray-400">HI</div>
            </div>
            <div className="text-center">
              <div className="pioneer-knob w-8 h-8 mx-auto mb-1" />
              <div className="text-xs text-gray-400">MID</div>
            </div>
            <div className="text-center">
              <div className="pioneer-knob w-8 h-8 mx-auto mb-1" />
              <div className="text-xs text-gray-400">LOW</div>
            </div>
          </div>

          {/* Channel Fader */}
          <div className="flex justify-center mb-3">
            <div className="pioneer-fader-track h-24 w-6 relative">
              <div className="pioneer-fader-handle w-8 h-4 absolute -left-1 top-4" />
            </div>
          </div>

          {/* PFL Button */}
          <div className="text-center">
            <button className="pioneer-button py-1 px-2 text-xs text-orange-400">
              PFL
            </button>
          </div>
        </div>
      </div>

      {/* Crossfader Section */}
      <div className="pioneer-eq-section p-4 mb-6">
        <div className="text-center mb-3">
          <div className="text-xs font-semibold text-gray-300">CROSSFADER</div>
        </div>
        
        <div className="relative mb-2">
          <div className="pioneer-fader-track h-6 w-full relative">
            <div 
              className="pioneer-fader-handle w-8 h-8 absolute top-1/2 transform -translate-y-1/2"
              style={{ left: `${mixer.crossfader}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>A</span>
            <span>B</span>
          </div>
        </div>

        <div className="text-center">
          <div className="pioneer-knob w-6 h-6 mx-auto mb-1" />
          <div className="text-xs text-gray-400">CURVE</div>
        </div>
      </div>

      {/* Master Section */}
      <div className="pioneer-eq-section p-4 mb-6">
        <div className="text-center mb-3">
          <div className="text-xs font-semibold text-gray-300">MASTER</div>
        </div>

        {/* VU Meters */}
        <div className="flex justify-center space-x-1 mb-3">
          {Array.from({ length: 8 }).map((_, index) => {
            let bgColor = 'bg-gray-700';
            if (index < 3) bgColor = 'bg-green-500';
            else if (index < 5) bgColor = 'bg-yellow-500';
            else if (index < 6) bgColor = 'bg-red-500';
            
            return (
              <div
                key={index}
                className={`w-2 h-6 rounded-sm ${bgColor} opacity-60`}
              />
            );
          })}
        </div>

        {/* Master Volume */}
        <div className="flex justify-center mb-3">
          <div className="pioneer-fader-track h-20 w-6 relative">
            <div 
              className="pioneer-fader-handle w-8 h-4 absolute -left-1"
              style={{ top: `${(100 - mixer.masterVolume) / 100 * 16 * 4}px` }}
            />
          </div>
        </div>

        <div className="text-center text-xs text-gray-400">LEVEL</div>
      </div>

      {/* Effects Section */}
      <div className="pioneer-eq-section p-4 mb-6">
        <div className="text-center mb-3">
          <div className="text-xs font-semibold text-gray-300">SOUND COLOR FX</div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button 
            onClick={() => toggleEffect('filter')}
            className={`pioneer-button py-2 text-xs transition-all ${
              mixer.effects.filter ? 'active text-blue-400' : 'text-gray-400'
            }`}
          >
            FILTER
          </button>
          <button 
            onClick={() => toggleEffect('reverb')}
            className={`pioneer-button py-2 text-xs transition-all ${
              mixer.effects.reverb ? 'active text-green-400' : 'text-gray-400'
            }`}
          >
            SPACE
          </button>
        </div>

        <div className="text-center">
          <div className="pioneer-knob w-10 h-10 mx-auto mb-1" />
          <div className="text-xs text-gray-400">PARAMETER</div>
        </div>
      </div>

      {/* Headphone Section */}
      <div className="pioneer-eq-section p-4">
        <div className="text-center mb-3">
          <div className="text-xs font-semibold text-gray-300">HEADPHONES</div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <div className="pioneer-knob w-8 h-8 mx-auto mb-1" />
            <div className="text-xs text-gray-400">MIX</div>
          </div>
          <div className="text-center">
            <div className="pioneer-knob w-8 h-8 mx-auto mb-1" />
            <div className="text-xs text-gray-400">LEVEL</div>
          </div>
        </div>
      </div>
    </div>
  );
}
