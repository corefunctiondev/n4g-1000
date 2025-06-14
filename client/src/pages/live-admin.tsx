import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { LiveEditor } from '@/components/live-editor';
import TerminalOS from '@/pages/terminal-os';

export function LiveAdmin() {
  const [, setLocation] = useLocation();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      const storedSession = localStorage.getItem('admin_session');
      
      if (!storedSession) {
        setLocation('/admin/login');
        return;
      }

      try {
        const session = JSON.parse(storedSession);
        const response = await fetch('/api/admin/verify', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('admin_session');
          setLocation('/admin/login');
        }
      } catch (error) {
        console.error('Session verification failed:', error);
        localStorage.removeItem('admin_session');
        setLocation('/admin/login');
      } finally {
        setIsVerifying(false);
      }
    };

    verifySession();
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem('admin_session');
    setLocation('/admin/login');
  };

  const handleToggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pioneer-black to-pioneer-dark-gray flex items-center justify-center">
        <div className="text-cyan-400">Verifying admin session...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="relative">
      {/* Live Editor Toolbar */}
      <LiveEditor
        isEditMode={isEditMode}
        onToggleEditMode={handleToggleEditMode}
        onLogout={handleLogout}
      />
      
      {/* Main Website Content with Editing Capabilities */}
      <div className={`transition-all duration-300 ${isEditMode ? 'pt-16' : 'pt-16'}`}>
        <TerminalOS />
      </div>
      
      {/* Edit Mode Instructions */}
      {isEditMode && (
        <div className="fixed bottom-4 right-4 bg-black/80 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-4 max-w-sm z-40">
          <h4 className="text-cyan-400 font-semibold mb-2">Edit Mode Active</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Click any text to edit it</li>
            <li>• Elements are highlighted in cyan</li>
            <li>• Changes save automatically</li>
            <li>• Click "Preview Mode" to see results</li>
          </ul>
        </div>
      )}
    </div>
  );
}