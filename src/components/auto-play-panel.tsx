'use client'

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Sparkles } from 'lucide-react';
import { useAutoPlay } from '@/contexts/auto-play-context';

const MIN_INTERVAL = 0.5;
const MAX_INTERVAL = 10;

export default function AutoPlayPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { isPlaying, interval, togglePlay, setIntervalValue } = useAutoPlay();
  const panelRef = useRef<HTMLDivElement>(null);

  // Click outside to close menu
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={panelRef} className="fixed top-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Popup Panel */}
      {isOpen && (
        <div className="bg-beige rounded-2xl custom_sd p-4 mb-2 min-w-[220px] transition-all duration-200">
          <div className="flex flex-col gap-3">
            {/* Play / Pause Toggle */}
            <button
              onClick={togglePlay}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-beige-strong transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 bg-grey-dark rounded-full flex items-center justify-center">
                {isPlaying ? (
                  <Pause className="w-4 h-4 text-white" />
                ) : (
                  <Play className="w-4 h-4 text-white ml-0.5" />
                )}
              </div>
              <span className="font-medium text-grey-dark">
                {isPlaying ? 'Pause' : 'Play'}
              </span>
              {isPlaying && (
                <span className="ml-auto flex items-center gap-1.5 text-xs text-grey-dark/60">
                  <span className="w-2 h-2 bg-green-500 rounded-full inline-block animate-pulse" />
                  Playing
                </span>
              )}
            </button>

            {/* Divider */}
            <div className="h-px bg-grey-medium/50" />

            {/* Interval Slider */}
            <div className="px-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-grey-dark/70 font-medium">
                  Tốc độ
                </span>
                <span className="text-xs text-grey-dark font-semibold">
                  {interval}s
                </span>
              </div>
              <input
                type="range"
                min={MIN_INTERVAL}
                max={MAX_INTERVAL}
                step={0.5}
                value={interval}
                onChange={(e) => setIntervalValue(Number(e.target.value))}
                className="w-full accent-grey-dark cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-grey-dark/50 mt-0.5">
                <span>{MIN_INTERVAL}s</span>
                <span>{MAX_INTERVAL}s</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-12 h-12 bg-beige rounded-full custom_sd2 flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
        title="Auto play"
      >
        <Sparkles className="w-5 h-5 text-grey-dark" />
      </button>
    </div>
  );
}
