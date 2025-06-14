import React, { createContext, useContext, useEffect } from 'react';
import { audioFeedback } from '@/lib/audio-feedback';

const AudioFeedbackContext = createContext<typeof audioFeedback>(audioFeedback);

export function AudioFeedbackProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Add global click listeners for all interactive elements
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Different sounds for different elements
      if (target.matches('button, [role="button"]')) {
        audioFeedback.playClick();
      } else if (target.matches('a, [role="link"]')) {
        audioFeedback.playNavigate();
      } else if (target.matches('input, textarea, select')) {
        audioFeedback.playEdit();
      } else if (target.matches('[data-content-key]')) {
        audioFeedback.playEdit();
      } else if (target.matches('.live-editor-highlight')) {
        audioFeedback.playEdit();
      } else if (target.closest('button, a, [role="button"], [role="link"]')) {
        // If clicking inside a button/link
        if (target.closest('button, [role="button"]')) {
          audioFeedback.playClick();
        } else {
          audioFeedback.playNavigate();
        }
      }
    };

    const handleGlobalHover = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Subtle hover sounds for interactive elements
      if (target.matches('button, [role="button"], a, [role="link"]') && 
          !target.hasAttribute('data-hover-played')) {
        target.setAttribute('data-hover-played', 'true');
        audioFeedback.playHover();
        
        // Remove the attribute after a short delay
        setTimeout(() => {
          target.removeAttribute('data-hover-played');
        }, 500);
      }
    };

    // Add listeners
    document.addEventListener('click', handleGlobalClick, true);
    document.addEventListener('mouseenter', handleGlobalHover, true);

    // Cleanup
    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
      document.removeEventListener('mouseenter', handleGlobalHover, true);
    };
  }, []);

  return (
    <AudioFeedbackContext.Provider value={audioFeedback}>
      {children}
    </AudioFeedbackContext.Provider>
  );
}

export function useAudioFeedback() {
  return useContext(AudioFeedbackContext);
}