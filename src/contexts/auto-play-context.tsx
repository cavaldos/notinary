'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

interface AutoPlayContextType {
  isPlaying: boolean;
  interval: number;
  togglePlay: () => void;
  setIntervalValue: (seconds: number) => void;
}

const AutoPlayContext = createContext<AutoPlayContextType | undefined>(undefined);

export function useAutoPlay(): AutoPlayContextType {
  const context = useContext(AutoPlayContext);
  if (!context) {
    throw new Error('useAutoPlay must be used within an AutoPlayProvider');
  }
  return context;
}

export function AutoPlayProvider({ children }: { children: ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [interval, setIntervalValue] = useState(2);

  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  return (
    <AutoPlayContext.Provider
      value={{ isPlaying, interval, togglePlay, setIntervalValue }}
    >
      {children}
    </AutoPlayContext.Provider>
  );
}
