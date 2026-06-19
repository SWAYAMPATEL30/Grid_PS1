'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

type Mode = 'police' | 'logistics';

interface ModeContextType {
  mode: Mode;
  toggleMode: () => void;
  setMode: (mode: Mode) => void;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<Mode>('police');

  const toggleMode = useCallback(() => {
    setModeState(prev => prev === 'police' ? 'logistics' : 'police');
  }, []);

  const setMode = useCallback((newMode: Mode) => {
    setModeState(newMode);
  }, []);

  const value: ModeContextType = {
    mode,
    toggleMode,
    setMode
  };

  return (
    <ModeContext.Provider value={value}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode(): ModeContextType {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error('useMode must be used within ModeProvider');
  }
  return context;
}
