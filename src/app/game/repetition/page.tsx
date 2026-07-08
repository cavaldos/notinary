'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';

import Card from '@/components/cardspace';
import { useDictionary } from '@/hooks/useDictionary';
import { normalizeTypeTags } from '@/lib/type-tags';
import { generateAddictiveSequence } from '@/lib/addictive-sequence';
import type { DictionaryItem } from '@/redux/features/dictionarySlice';
import { Settings } from 'lucide-react';

const isFrench =
  process.env.NEXT_PUBLIC_SPEECH_LANGUAGE?.startsWith('fr') ?? false;

const normalizeType = (type: string): string => {
  const t = type.toLowerCase().trim();
  if (!isFrench && (t === 'verb' || t === 'in-verb')) return 'verb';
  return t;
};

const getNormalizedTypes = (type: unknown): string[] =>
  normalizeTypeTags(type).map(normalizeType);

const typeDisplayLabels: Record<string, string> = {
  all: isFrench ? 'Tous' : 'All',
  verb: 'Verb',
  noun: 'Noun',
  adj: 'Adj',
  adv: 'Adv',
  phrase: 'Phrase',
};

const spaceOptions = ['L1', 'L2', 'L3', 'L4'];
const levelOptions = ['All', '1', '2', '3', '4', '5'];
const typeOptions = ['all', 'verb', 'noun', 'adj', 'adv', 'phrase'];
const modeOptions = ['en-vi', 'vi-en'];

const RepetitionPage: React.FC = () => {
  const { fetchData, dictionary, loading } = useDictionary();

  // ── Settings state ──
  const [phase, setPhase] = useState<'settings' | 'playing'>('settings');
  const [selectedSpace, setSelectedSpace] = useState('L1');
  const [selectedLevels, setSelectedLevels] = useState<Set<string>>(
    new Set(['All']),
  );
  const [selectedType, setSelectedType] = useState('all');
  const [gameMode, setGameMode] = useState<'en-vi' | 'vi-en'>('en-vi');

  // ── Addictive settings ──
  const groupSizeOptions = [3, 5, 10, 15, 20];
  const [groupSize, setGroupSize] = useState(5);

  // ── Playing state ──
  const [words, setWords] = useState<DictionaryItem[]>([]);
  const [orderedWords, setOrderedWords] = useState<DictionaryItem[]>([]);
  const [sequenceInfo, setSequenceInfo] = useState<{
    totalGroups: number;
    totalGroupRounds: number;
    totalItemRounds: number;
    groupMap: number[];
    groupBoundaries: number[];
  } | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [completedGroups, setCompletedGroups] = useState<Set<number>>(new Set());
  const [prevGroupIdx, setPrevGroupIdx] = useState<number | null>(null);
  const [justCompleted, setJustCompleted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [dataReady, setDataReady] = useState(false);

  // ── Adaptive timing tracking ──
  const WINDOW_SIZE = 10;
  const SLOW_THRESHOLD = 1.5;  // >1.5x avg → slow
  const FAST_THRESHOLD = 0.5;  // <0.5x avg → fast
  interface WordTimingData { totalMs: number; count: number }
  const viewStartRef = useRef<number>(0);
  const prevIndexRef = useRef<number>(-1);
  const wordTimingsRef = useRef<Map<string, WordTimingData>>(new Map());
  const recentTimesRef = useRef<number[]>([]);
  const [slowWordIds, setSlowWordIds] = useState<Set<string>>(new Set());
  const [fastWordIds, setFastWordIds] = useState<Set<string>>(new Set());
  const [avgViewTime, setAvgViewTime] = useState(0);
  const [inReviewTail, setInReviewTail] = useState(false);

  // ── Dynamic island hooks (MUST be before any early return) ──
  const [isExpanded, setIsExpanded] = useState(false);
  const dynamicRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimeout = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (isExpanded) {
      timeoutRef.current = setTimeout(() => setIsExpanded(false), 5000);
    }
  }, [isExpanded]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dynamicRef.current && !dynamicRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    resetTimeout();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isExpanded, resetTimeout]);

  // Fetch data when space changes
  useEffect(() => {
    fetchData(selectedSpace);
    setDataReady(false);
  }, [fetchData, selectedSpace]);

  // Filter + shuffle words when dictionary or settings change
  useEffect(() => {
    if (dictionary.length === 0) return;

    let filtered = [...dictionary];

    // Filter by levels
    if (!selectedLevels.has('All')) {
      filtered = filtered.filter((item) =>
        selectedLevels.has(String(item.Level)),
      );
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter((item) => {
        const types = getNormalizedTypes(item.Type);
        return types.includes(selectedType);
      });
    }

    // Shuffle
    for (let i = filtered.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
    }

    setWords(filtered);
    setDataReady(true);
  }, [dictionary, selectedLevels, selectedType]);

  // Scroll to specific card
  const scrollToCard = useCallback(
    (index: number, behavior: ScrollBehavior = 'smooth') => {
      if (cardRefs.current[index]) {
        cardRefs.current[index]?.scrollIntoView({ behavior, block: 'center' });
      }
    },
    [],
  );

  // Handle scroll event with snap detection
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let timeoutId: number;

    const handleScroll = () => {
      clearTimeout(timeoutId);

      timeoutId = window.setTimeout(() => {
        const containerTop = container.getBoundingClientRect().top;
        const containerCenter = containerTop + container.offsetHeight / 2;

        let closestIndex = 0;
        let closestDistance = Infinity;

        cardRefs.current.forEach((cardRef, index) => {
          if (cardRef) {
            const cardTop = cardRef.getBoundingClientRect().top;
            const cardCenter = cardTop + cardRef.offsetHeight / 2;
            const distance = Math.abs(containerCenter - cardCenter);

            if (distance < closestDistance) {
              closestDistance = distance;
              closestIndex = index;
            }
          }
        });

        if (closestIndex !== currentIndex) {
          setCurrentIndex(closestIndex);
          scrollToCard(closestIndex);
        }
      }, 150);
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [currentIndex, scrollToCard]);

  // ── Track group progress & streak ──
  useEffect(() => {
    if (!sequenceInfo) return;
    if (orderedWords.length === 0) return;

    const currentGroupIdx = sequenceInfo.groupMap[currentIndex] ?? -1;

    if (currentGroupIdx === -1) return;

    // Detect when we move into a new group
    if (prevGroupIdx !== null && currentGroupIdx !== prevGroupIdx) {
      // We just left prevGroupIdx — mark it completed if not already
      if (!completedGroups.has(prevGroupIdx)) {
        setCompletedGroups((prev) => new Set(prev).add(prevGroupIdx));
        setStreak((s) => s + 1);
        setJustCompleted(true);
        setTimeout(() => setJustCompleted(false), 1500);
      }
    }

    setPrevGroupIdx(currentGroupIdx);
  }, [currentIndex, sequenceInfo, orderedWords.length, prevGroupIdx, completedGroups]);

  // ── Track view time per card (runs when user moves to a new card) ──
  useEffect(() => {
    if (orderedWords.length === 0) return;
    if (currentIndex < 0 || currentIndex >= orderedWords.length) return;

    const now = Date.now();
    const oldIndex = prevIndexRef.current;

    // Record time for the card we just LEFT
    if (oldIndex >= 0 && oldIndex < orderedWords.length && viewStartRef.current > 0) {
      const elapsed = now - viewStartRef.current;
      const leftItem = orderedWords[oldIndex];
      const id = leftItem.id;

      // Update cumulative timing for this word
      const prev = wordTimingsRef.current.get(id) ?? { totalMs: 0, count: 0 };
      wordTimingsRef.current.set(id, {
        totalMs: prev.totalMs + elapsed,
        count: prev.count + 1,
      });

      // Add to sliding window of recent view durations
      const recent = recentTimesRef.current;
      recent.push(elapsed);
      if (recent.length > WINDOW_SIZE) recent.shift();

      // Classify once we have enough data points
      if (recent.length >= 3) {
        const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
        setAvgViewTime(Math.round(avg));

        // Use functional updates to avoid stale closure issues
        if (elapsed > avg * SLOW_THRESHOLD) {
          setSlowWordIds((prev) => new Set(prev).add(id));
          setFastWordIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
        } else if (elapsed < avg * FAST_THRESHOLD) {
          setFastWordIds((prev) => new Set(prev).add(id));
          setSlowWordIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
        } else {
          setSlowWordIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
          setFastWordIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
        }
      }
    }

    // Start timer for the card we just ENTERED
    viewStartRef.current = now;
    prevIndexRef.current = currentIndex;
  }, [currentIndex, orderedWords]);

  // ── Auto-extend: append review tail when approaching end of main sequence ──
  useEffect(() => {
    if (!sequenceInfo || inReviewTail) return;
    if (slowWordIds.size === 0) return;

    const mainLen = sequenceInfo.totalItemRounds;
    if (currentIndex < mainLen - 3) return; // only trigger near end

    // Pick slow words that aren't already queued at the tail
    const tail = orderedWords.slice(mainLen);
    const alreadyQueued = new Set(tail.map((w) => w.id));

    const reviewWords: DictionaryItem[] = [];
    for (const word of orderedWords) {
      if (slowWordIds.has(word.id) && !alreadyQueued.has(word.id)) {
        reviewWords.push(word);
        alreadyQueued.add(word.id);
      }
    }

    if (reviewWords.length === 0) return;

    setOrderedWords((prev) => [...prev, ...reviewWords]);
    setInReviewTail(true);
  }, [currentIndex, sequenceInfo, slowWordIds, inReviewTail]);

  // ── Toggle level (multi-select) ──
  const toggleLevel = (level: string) => {
    setSelectedLevels((prev) => {
      const next = new Set(prev);
      if (level === 'All') {
        return new Set(['All']);
      }
      next.delete('All');
      if (next.has(level)) {
        next.delete(level);
      }
      else {
        next.add(level);
      }
      return next.size === 0 ? new Set(['All']) : next;
    });
  };

  // ── Start game ──
  const startGame = () => {
    if (words.length === 0) return;

    // Apply addictive spiral interleaving
    const result = generateAddictiveSequence(words, groupSize);
    setOrderedWords(result.ordered);
    setSequenceInfo({
      totalGroups: result.totalGroups,
      totalGroupRounds: result.totalGroupRounds,
      totalItemRounds: result.totalItemRounds,
      groupMap: result.groupMap,
      groupBoundaries: result.groupBoundaries,
    });
    setStreak(0);
    setCompletedGroups(new Set());
    setPrevGroupIdx(null);
    setJustCompleted(false);

    // Reset timing data
    viewStartRef.current = 0;
    prevIndexRef.current = -1;
    wordTimingsRef.current.clear();
    recentTimesRef.current = [];
    setSlowWordIds(new Set());
    setFastWordIds(new Set());
    setAvgViewTime(0);
    setInReviewTail(false);

    setPhase('playing');
    setCurrentIndex(0);
    cardRefs.current = [];
    requestAnimationFrame(() => {
      containerRef.current?.scrollTo({ top: 0 });
    });
  };

  // ── Loading ──
  const showLoading = loading || !dataReady;

  // ══════════════════════════════════════════════
  //  SETTINGS PHASE
  // ══════════════════════════════════════════════
  if (phase === 'settings') {
    return (
      <div className="flex flex-col h-screen w-full items-center justify-center px-6">
        <div className="w-full max-w-md space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">Repetition</h1>
          <p className="text-gray-500 text-sm -mt-4">
            Review words with scrollable flashcards
          </p>
          <a
            href="/game"
            className="block text-xs text-gray-400 hover:text-gray-600 transition-colors -mt-3"
          >
            ← Back to Quiz Mode
          </a>

          {/* ── Space ── */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Space
            </label>
            <div className="flex gap-2">
              {spaceOptions.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSelectedSpace(s);
                    setDataReady(false);
                  }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedSpace === s
                      ? 'bg-[#344e41] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* ── Level ── */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Level
            </label>
            <div className="flex gap-2 flex-wrap">
              {levelOptions.map((l) => (
                <button
                  key={l}
                  onClick={() => toggleLevel(l)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedLevels.has(l)
                      ? 'bg-[#344e41] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* ── Type ── */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Type
            </label>
            <div className="flex gap-2 flex-wrap">
              {typeOptions.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedType === t
                      ? 'bg-[#344e41] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {typeDisplayLabels[t]}
                </button>
              ))}
            </div>
          </div>

          {/* ── Mode ── */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Mode
            </label>
            <div className="flex gap-2">
              {modeOptions.map((m) => (
                <button
                  key={m}
                  onClick={() => setGameMode(m as 'en-vi' | 'vi-en')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    gameMode === m
                      ? 'bg-[#344e41] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {m === 'en-vi' ? 'EN → VI' : 'VI → EN'}
                </button>
              ))}
            </div>
          </div>

          {/* ── Group Size (Addictive) ── */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Group Size <span className="text-gray-400 font-normal">(Spiral Interleaving)</span>
            </label>
            <div className="flex gap-2">
              {groupSizeOptions.map((g) => (
                <button
                  key={g}
                  onClick={() => setGroupSize(g)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    groupSize === g
                      ? 'bg-[#344e41] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
            {words.length > 0 && (
              <p className="text-xs text-gray-400 mt-2">
                {words.length} từ → {Math.ceil(words.length / groupSize)} nhóm →{' '}
                {(() => {
                  const g = Math.ceil(words.length / groupSize);
                  if (g <= 1) return `${words.length} thẻ`;
                  const rounds = 1 + (g - 1) * 2 + 1; // [0] + [1..N-1]x2 + [N-1]
                  return `${rounds} lượt nhóm (${rounds * groupSize} thẻ)`;
                })()}
              </p>
            )}
          </div>

          {/* ── Start ── */}
          <button
            onClick={startGame}
            disabled={words.length === 0}
            className={`w-full py-3 rounded-md text-lg font-bold transition-colors ${
              words.length > 0
                ? 'bg-[#344e41] text-white hover:bg-[#2a3d33]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {showLoading
              ? 'Loading...'
              : words.length > 0
                ? `Start • ${(() => {
                    const g = Math.ceil(words.length / groupSize);
                    if (g <= 1) return `${words.length} cards`;
                    const rounds = 1 + (g - 1) * 2 + 1;
                    return `${rounds * groupSize} cards`;
                  })()}`
                : 'No words found'}
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════
  //  PLAYING PHASE
  // ══════════════════════════════════════════════

  // Compute group progress info
  const currentGroupIdx = sequenceInfo?.groupMap[currentIndex] ?? 0;

  // Find the start of the current group presentation via groupBoundaries
  const bounds = sequenceInfo?.groupBoundaries ?? [];
  let presStart = currentIndex;
  for (let i = bounds.length - 1; i >= 0; i--) {
    if (bounds[i] <= currentIndex) {
      presStart = bounds[i];
      break;
    }
  }
  // Determine how many items are in this presentation
  const presEnd = bounds.find((b) => b > presStart) ?? orderedWords.length;
  const positionInGroup = currentIndex - presStart + 1;
  const wordsInThisGroup = presEnd - presStart;

  const displayGroupNum = sequenceInfo?.groupMap
    ? sequenceInfo.groupMap.slice(0, currentIndex + 1).filter((g) => g === currentGroupIdx).length
    : 1;

  return (
    <div className="flex flex-col h-screen mb-[20px] w-full max-w-full select-none">
      {/* Dynamic island */}
      <div
        ref={dynamicRef}
        onClick={() => setIsExpanded(!isExpanded)}
        onMouseEnter={resetTimeout}
        onMouseLeave={resetTimeout}
        className={`fixed top-0 left-0 right-0 z-50 bg-beige text-grey-dark mx-auto transition-all duration-300 ease-in-out
          mt-[15px] py-[5px] px-[10px] p-2 rounded-full text-center text-shadow-grey-dark font-bold
          ${isExpanded ? 'max-w-[80%]' : 'max-w-[60%]'}
          ${justCompleted ? 'animate-pulse shadow-lg shadow-green-300/50' : ''}
          `}
      >
        {!isExpanded ? (
          <div className="cursor-pointer hover:opacity-80 transition-opacity flex flex-col items-center gap-1">
            {/* Main row: group + streak + timing */}
            <div className="flex items-center justify-center gap-2 text-sm">
              <span className="text-xs text-gray-500">
                Nhóm {currentGroupIdx + 1}/{sequenceInfo?.totalGroups ?? 0}
              </span>
              <span className="text-xs text-gray-300">·</span>
              <span className="text-xs font-medium">
                {currentIndex + 1}/{orderedWords.length}
              </span>
              {inReviewTail && (
                <>
                  <span className="text-xs text-gray-300">·</span>
                  <span className="text-xs font-bold text-red-500">
                    🔄 Ôn
                  </span>
                </>
              )}
              {avgViewTime > 0 && !inReviewTail && (
                <>
                  <span className="text-xs text-gray-300">·</span>
                  <span className="text-xs text-gray-400">
                    ~{avgViewTime}ms
                  </span>
                </>
              )}
              {streak > 0 && (
                <>
                  <span className="text-xs text-gray-300">·</span>
                  <span className="text-xs font-bold text-amber-600">
                    🔥 {streak}
                  </span>
                </>
              )}
            </div>
            {/* Progress dots for current group */}
            <div className="flex items-center gap-1">
              {Array.from({ length: wordsInThisGroup }, (_, i) => {
                const wordId = orderedWords[presStart + i]?.id;
                const isSlow = wordId && slowWordIds.has(wordId);
                const isFast = wordId && fastWordIds.has(wordId);
                const viewed = i < positionInGroup;
                let dotColor = 'bg-gray-300';
                if (viewed && isSlow) dotColor = 'bg-red-400';
                else if (viewed && isFast) dotColor = 'bg-green-400';
                else if (viewed) dotColor = 'bg-[#344e41]';
                return (
                  <div
                    key={i}
                    title={
                      isSlow ? 'Chậm (cần ôn)' : isFast ? 'Nhanh (dễ)' : ''
                    }
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${dotColor} ${
                      viewed ? 'scale-110' : ''
                    } ${isSlow && viewed ? 'animate-pulse' : ''}`}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center w-full px-2 transition-all duration-300 flex-col gap-1">
            <div className="text-xs text-gray-500 mb-1">
              Nhóm {currentGroupIdx + 1}/{sequenceInfo?.totalGroups ?? 0}
              {' · '}Lần {displayGroupNum}
              {inReviewTail && <span className="text-red-500 ml-1">· Ôn tập</span>}
            </div>
            {avgViewTime > 0 && (
              <div className="text-[10px] text-gray-400">
                ⏱ TB {(avgViewTime / 1000).toFixed(1)}s
                {slowWordIds.size > 0 && <span className="ml-2 text-red-400">🐢 {slowWordIds.size} chậm</span>}
                {fastWordIds.size > 0 && <span className="ml-2 text-green-400">⚡ {fastWordIds.size} nhanh</span>}
              </div>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPhase('settings');
              }}
              onMouseEnter={resetTimeout}
              className="flex items-center gap-1.5 mx-1 px-4 py-1 bg-beige-strong text-grey-dark hover:brightness-105 ease-in-out
                rounded-full text-sm font-medium transition-all duration-200
                hover:scale-105 active:scale-95"
            >
              <Settings className="w-3.5 h-3.5" />
              Settings
            </button>
          </div>
        )}
      </div>

      {/* Scrollable card list */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth px-8 py-12"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {orderedWords.map((item, index) => {
          const wordToShow =
            gameMode === 'en-vi' ? item.Word : item.Meaning;
          const meaningToShow =
            gameMode === 'en-vi' ? item.Meaning : item.Word;

          return (
            <div
              key={index}
              ref={(el) => {
                cardRefs.current[index] = el;
              }}
              className="min-h-screen w-full flex items-center justify-center"
              style={{ scrollSnapAlign: 'center' }}
            >
              <Card
                index={index + 1}
                idPage={item.id}
                word={wordToShow}
                level={item.Level}
                type={item.Type}
                pronunciation={item.Pronounce}
                meaning={meaningToShow}
                example={item.Example}
                synonyms={item.Synonyms}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RepetitionPage;
