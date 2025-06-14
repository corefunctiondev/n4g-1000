import React, { useState, useEffect } from 'react';
import { BootSequence } from './boot-sequence';
import TerminalOS from './terminal-os';

export function AppWrapper() {
  const [showBoot, setShowBoot] = useState(false);

  // Check if user has seen the boot sequence before
  useEffect(() => {
    const hasSeenBoot = localStorage.getItem('n4g_has_booted');
    // Temporarily always show boot for testing
    setShowBoot(true);
    // if (!hasSeenBoot) {
    //   setShowBoot(true);
    // }
  }, []);

  const handleBootComplete = (mode: 'dj' | 'explore') => {
    // Mark as booted for future visits
    localStorage.setItem('n4g_has_booted', 'true');
    setShowBoot(false);
    
    if (mode === 'dj') {
      // Navigate to DJ interface
      window.location.href = '/n4g-1000';
    }
    // If explore mode, just show the terminal (default behavior)
  };

  // Reset boot sequence (for testing or user preference)
  const resetBootSequence = () => {
    localStorage.removeItem('n4g_has_booted');
    setShowBoot(true);
  };

  // Expose reset function globally for testing
  useEffect(() => {
    (window as any).resetN4GBoot = resetBootSequence;
  }, []);

  if (showBoot) {
    return <BootSequence onComplete={handleBootComplete} />;
  }

  return <TerminalOS />;
}