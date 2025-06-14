import React, { useState, useEffect } from 'react';
import { BootSequence } from './boot-sequence';
import TerminalOS from './terminal-os';
import CDJInterface from './cdj-interface';

export function AppWrapper() {
  const [appState, setAppState] = useState<'boot' | 'terminal' | 'dj'>('boot');
  const [hasBooted, setHasBooted] = useState(false);

  // Check if user has seen the boot sequence before
  useEffect(() => {
    const hasSeenBoot = localStorage.getItem('n4g_has_booted');
    if (hasSeenBoot) {
      setAppState('terminal');
      setHasBooted(true);
    }
  }, []);

  const handleBootComplete = (mode: 'dj' | 'explore') => {
    // Mark as booted for future visits
    localStorage.setItem('n4g_has_booted', 'true');
    setHasBooted(true);
    
    if (mode === 'dj') {
      setAppState('dj');
    } else {
      setAppState('terminal');
    }
  };

  // Reset boot sequence (for testing or user preference)
  const resetBootSequence = () => {
    localStorage.removeItem('n4g_has_booted');
    setAppState('boot');
    setHasBooted(false);
  };

  // Expose reset function globally for testing
  useEffect(() => {
    (window as any).resetN4GBoot = resetBootSequence;
  }, []);

  switch (appState) {
    case 'boot':
      return <BootSequence onComplete={handleBootComplete} />;
    
    case 'dj':
      return <CDJInterface />;
    
    case 'terminal':
    default:
      return <TerminalOS />;
  }
}