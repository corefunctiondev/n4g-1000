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
    <Card className="bg-cdj-light border-cdj-border shadow-2xl">
      <CardContent className="p-6">
        <h2 className="text-xl font-bold text-white text-center mb-6">MIXER</h2>
        
        {/* Master Volume & Output */}
        <div className="text-center mb-6">
          <div className="bg-cdj-surface rounded-lg p-4 mb-4">
            <div className="text-sm font-semibold text-gray-300 mb-3">MASTER OUTPUT</div>
            
            {/* VU Meter */}
            <div className="flex justify-center space-x-1 mb-3">
              {Array.from({ length: 12 }).map((_, index) => {
                let bgColor = 'bg-cdj-surface';
                if (index < 4) bgColor = 'bg-cdj-green';
                else if (index < 6) bgColor = 'bg-cdj-orange';
                else if (index < 7) bgColor = 'bg-cdj-red';
                
                return (
                  <div
                    key={index}
                    className={`w-2 h-8 rounded ${bgColor}`}
                  />
                );
              })}
            </div>
            
            {/* Master Volume Control */}
            <Fader
              value={mixer.masterVolume}
              min={0}
              max={100}
              onChange={handleMasterVolume}
              length={128}
              thickness={8}
              className="mx-auto"
            />
          </div>
        </div>

        {/* Crossfader Section */}
        <div className="bg-cdj-surface rounded-lg p-6 mb-6">
          <div className="text-center mb-4">
            <div className="text-sm font-semibold text-gray-300">CROSSFADER</div>
          </div>
          
          {/* Crossfader Track */}
          <div className="relative">
            <Fader
              value={mixer.crossfader}
              min={0}
              max={100}
              onChange={handleCrossfader}
              orientation="horizontal"
              length={200}
              thickness={8}
              className="mx-4 mb-4"
            />
            
            <div className="flex justify-between text-xs text-gray-400 mt-2 px-4">
              <span>A</span>
              <span>B</span>
            </div>
          </div>
          
          {/* Crossfader Curve Control */}
          <div className="text-center mt-4">
            <div className="text-xs text-gray-400 mb-2">CURVE</div>
            <Knob
              value={50}
              min={0}
              max={100}
              onChange={() => {}}
              size="sm"
              className="mx-auto"
            />
          </div>
        </div>

        {/* Channel Faders */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Channel A Fader */}
          <div className="bg-cdj-surface rounded-lg p-4">
            <div className="text-center mb-3">
              <div className="text-sm font-semibold text-cdj-blue">CHANNEL A</div>
            </div>
            <Fader
              value={75}
              min={0}
              max={100}
              onChange={() => {}}
              length={160}
              thickness={8}
              className="mx-auto mb-3"
            />
            <div className="text-center">
              <Button className="bg-cdj-surface hover:bg-cdj-blue transition-all rounded p-2 text-xs">
                PFL
              </Button>
            </div>
          </div>
          
          {/* Channel B Fader */}
          <div className="bg-cdj-surface rounded-lg p-4">
            <div className="text-center mb-3">
              <div className="text-sm font-semibold text-cdj-orange">CHANNEL B</div>
            </div>
            <Fader
              value={75}
              min={0}
              max={100}
              onChange={() => {}}
              length={160}
              thickness={8}
              className="mx-auto mb-3"
            />
            <div className="text-center">
              <Button className="bg-cdj-surface hover:bg-cdj-orange transition-all rounded p-2 text-xs">
                PFL
              </Button>
            </div>
          </div>
        </div>

        {/* Effects Section */}
        <div className="bg-cdj-surface rounded-lg p-4 mb-6">
          <div className="text-center mb-3">
            <div className="text-sm font-semibold text-gray-300">EFFECTS</div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Button
              onClick={() => toggleEffect('reverb')}
              className={`p-3 text-xs transition-all ${
                mixer.effects.reverb 
                  ? 'bg-cdj-blue text-white shadow-led' 
                  : 'bg-cdj-dark hover:bg-cdj-blue'
              }`}
            >
              <i className="fas fa-water mb-1" />
              <div>REVERB</div>
            </Button>
            <Button
              onClick={() => toggleEffect('delay')}
              className={`p-3 text-xs transition-all ${
                mixer.effects.delay 
                  ? 'bg-cdj-green text-white shadow-led' 
                  : 'bg-cdj-dark hover:bg-cdj-green'
              }`}
            >
              <i className="fas fa-echo mb-1" />
              <div>DELAY</div>
            </Button>
            <Button
              onClick={() => toggleEffect('filter')}
              className={`p-3 text-xs transition-all ${
                mixer.effects.filter 
                  ? 'bg-cdj-orange text-white shadow-led' 
                  : 'bg-cdj-dark hover:bg-cdj-orange'
              }`}
            >
              <i className="fas fa-sliders-h mb-1" />
              <div>FILTER</div>
            </Button>
          </div>
        </div>

        {/* Cue Mix */}
        <div className="text-center">
          <div className="text-sm font-semibold text-gray-300 mb-2">CUE MIX</div>
          <Knob
            value={mixer.cueVolume}
            min={0}
            max={100}
            onChange={handleCueVolume}
            size="lg"
            className="mx-auto"
          />
        </div>
      </CardContent>
    </Card>
  );
}
