'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BookOpen } from 'lucide-react';

import { useDictionary } from '@/hooks/useDictionary';
import Card from '@/components/cardspace';
import useTextToSpeech from '@/hooks/useTextToSpeech';
import { AutoPlayProvider, useAutoPlay } from '@/contexts/auto-play-context';
import AutoPlayPanel from '@/components/auto-play-panel';

// ── Inner component: auto-play effect & touch-hold (must be inside AutoPlayProvider) ──
function AutoPlayController({
    dictionary,
    currentIndex,
    setCurrentIndex,
    scrollToCard,
    playIndexRef,
}: {
    dictionary: { Word: string }[];
    currentIndex: number;
    setCurrentIndex: React.Dispatch<React.SetStateAction<number>>;
    scrollToCard: (index: number) => void;
    playIndexRef: React.MutableRefObject<number>;
}) {
    const { isPlaying, interval, togglePlay } = useAutoPlay();
    const { speak } = useTextToSpeech();
    const wasPlayingRef = useRef(false);

    // ── Auto-play: phát âm → chờ delay → chuyển từ ──
    useEffect(() => {
        if (!isPlaying || dictionary.length === 0) return;

        let cancelled = false;
        let timeoutId: number;

        const playWord = async () => {
            if (cancelled) return;

            const word = dictionary[playIndexRef.current]?.Word;
            if (word) {
                await speak(word, {
                    language: process.env.NEXT_PUBLIC_SPEECH_LANGUAGE || 'en',
                    rate: 0.8,
                    pitch: 1,
                });
            }

            if (cancelled) return;

            timeoutId = window.setTimeout(() => {
                if (cancelled) return;

                const dictLen = dictionary.length;
                const nextIndex =
                    playIndexRef.current + 1 < dictLen ? playIndexRef.current + 1 : 0;
                playIndexRef.current = nextIndex;
                setCurrentIndex(nextIndex);
                scrollToCard(nextIndex);

                playWord();
            }, interval * 1000);
        };

        playWord();

        return () => {
            cancelled = true;
            clearTimeout(timeoutId);
            window.speechSynthesis?.cancel();
        };
    }, [isPlaying, dictionary.length, interval, speak, scrollToCard, playIndexRef, setCurrentIndex]);

    // ── Touch-hold: giữ → pause, thả → resume ──
    const handleTouchStart = useCallback(() => {
        wasPlayingRef.current = isPlaying;
        if (isPlaying) {
            togglePlay();
        }
    }, [isPlaying, togglePlay]);

    const handleTouchEnd = useCallback(() => {
        if (wasPlayingRef.current) {
            togglePlay();
        }
        wasPlayingRef.current = false;
    }, [togglePlay]);

    const handleTouchCancel = useCallback(() => {
        if (wasPlayingRef.current) {
            togglePlay();
        }
        wasPlayingRef.current = false;
    }, [togglePlay]);

    return (
        <div
            className="contents"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
        >
            {null}
        </div>
    );
}

// ── Main page ──
const GamesPage: React.FC = () => {
    const { fetchData, dictionary } = useDictionary();
    const [space, setSpace] = useState('L2');
    const spaceOptions = ['L1', 'L2', 'L3', 'L4'];

    const [currentIndex, setCurrentIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
    const playIndexRef = useRef(0);
    playIndexRef.current = currentIndex;

    // Space toggle
    const cycleSpace = () => {
        const currentSpaceIndex = spaceOptions.indexOf(space);
        const nextIndex = (currentSpaceIndex + 1) % spaceOptions.length;
        setSpace(spaceOptions[nextIndex]);
        setCurrentIndex(0);
    };

    useEffect(() => {
        fetchData(space);
    }, [fetchData, space]);

    // Scroll to specific card
    const scrollToCard = useCallback((index: number) => {
        if (cardRefs.current[index]) {
            cardRefs.current[index]?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, []);

    // Handle scroll event with snap effect
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

    return (
        <AutoPlayProvider>
            <div className="flex flex-col h-screen mb-[20px] w-full max-w-full">
                {/* Space toggle button */}
                <button
                    onClick={cycleSpace}
                    className="fixed top-5 left-5 z-50 bg-beige text-gray-800 font-bold py-3 px-4 rounded-xl shadow-lg transition-colors duration-200 flex items-center gap-2"
                >
                    <BookOpen className="w-5 h-5" /> {space} ({dictionary.length})
                </button>

                {/* Auto-play controller + touch-hold (inside provider) */}
                <AutoPlayController
                    dictionary={dictionary}
                    currentIndex={currentIndex}
                    setCurrentIndex={setCurrentIndex}
                    scrollToCard={scrollToCard}
                    playIndexRef={playIndexRef}
                />

                {/* Cards */}
                <div
                    ref={containerRef}
                    className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth px-8 py-12"
                    style={{ scrollSnapType: 'y mandatory' }}
                >
                    {dictionary.map((item, index) => (
                        <div
                            key={index}
                            ref={(el) => {
                                cardRefs.current[index] = el;
                            }}
                            className="min-h-screen w-full flex items-center justify-center"
                            style={{ scrollSnapAlign: 'center' }}
                        >
                            <Card
                                index={index}
                                idPage={item.id}
                                word={item.Word}
                                level={item.Level}
                                type={item.Type}
                                pronunciation={item.Pronounce}
                                meaning={item.Meaning}
                                example={item.Example}
                                synonyms={item.Synonyms}
                                genre={item.Genre}
                            />
                        </div>
                    ))}
                </div>

                {/* Floating Auto-Play Panel */}
                <AutoPlayPanel />
            </div>
        </AutoPlayProvider>
    );
};

export default GamesPage;
