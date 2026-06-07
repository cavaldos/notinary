'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BookOpen, Clock, Play, Pause, ArrowDown } from 'lucide-react';

import { useDictionary } from '@/hooks/useDictionary';
import Card from '@/components/cardspace';
import useTextToSpeech from '@/hooks/useTextToSpeech';


const GamesPage: React.FC = () => {
    const { fetchData, dictionary } = useDictionary();
    const [space, setSpace] = useState('L2'); // Space có thể thay đổi
    const spaceOptions = ['L1', 'L2', 'L3', 'L4']; // Các tùy chọn space

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlay, setIsAutoPlay] = useState(false);
    const [autoPlaySpeed, setAutoPlaySpeed] = useState(2); // Tốc độ mặc định 2 giây
    const speedOptions = [0.5,1, 2, 3, 4, 5, 8]; // Các tùy chọn tốc độ
    const containerRef = useRef<HTMLDivElement>(null);
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Chuyển đổi space
    const cycleSpace = () => {
        const currentSpaceIndex = spaceOptions.indexOf(space);
        const nextIndex = (currentSpaceIndex + 1) % spaceOptions.length;
        setSpace(spaceOptions[nextIndex]);
        setCurrentIndex(0); // Reset về từ đầu tiên khi đổi space
    };

    // Chuyển đổi tốc độ
    const cycleSpeed = () => {
        const currentSpeedIndex = speedOptions.indexOf(autoPlaySpeed);
        const nextIndex = (currentSpeedIndex + 1) % speedOptions.length;
        setAutoPlaySpeed(speedOptions[nextIndex]);
    };

    useEffect(() => {
        fetchData(space);
    }, [fetchData, space]);

    // Scroll to specific card with smooth animation
    const scrollToCard = useCallback((index: number) => {
        if (cardRefs.current[index]) {
            cardRefs.current[index]?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, []);

    const { speak } = useTextToSpeech();

    // Hàm phát âm từ hiện tại
    const speakCurrentWord = useCallback(() => {
        if (dictionary.length > 0 && dictionary[currentIndex]) {
            const word = dictionary[currentIndex].Word;
            speak(word, { language: process.env.NEXT_PUBLIC_SPEECH_LANGUAGE || 'en', rate: 0.8, pitch: 1 });
        }
    }, [dictionary, currentIndex, speak]);

    // Chuyển sang từ tiếp theo
    const goToNextWord = useCallback(() => {
        if (dictionary.length > 0) {
            const nextIndex = currentIndex + 1 < dictionary.length ? currentIndex + 1 : 0;
            setCurrentIndex(nextIndex);
            scrollToCard(nextIndex);
        }
    }, [currentIndex, dictionary.length, scrollToCard]);

    // Auto-play: phát âm và chuyển từ theo tốc độ đã chọn
    useEffect(() => {
        if (!isAutoPlay || dictionary.length === 0) return;

        // Phát âm từ hiện tại ngay khi bắt đầu
        speakCurrentWord();

        const intervalId = setInterval(() => {
            goToNextWord();
        }, autoPlaySpeed * 1000);

        return () => {
            clearInterval(intervalId);
        };
    }, [isAutoPlay, dictionary.length, goToNextWord, speakCurrentWord, autoPlaySpeed]);

    const step = 30;

    // Scroll down by 30 items
    const scrollDown = useCallback(() => {
        const newIndex = Math.min(currentIndex + step, dictionary.length - 1);
        setCurrentIndex(newIndex);
        scrollToCard(newIndex);
    }, [currentIndex, dictionary.length, scrollToCard]);

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
        <div className="flex flex-col h-screen mb-[20px] w-full max-w-full">
            {/* Space toggle button */}
            <button
                onClick={cycleSpace}
                className="fixed top-5 left-5 z-50 bg-beige text-gray-800 font-bold py-3 px-4 rounded-xl shadow-lg transition-colors duration-200 flex items-center gap-2"
            >
                <BookOpen className="w-5 h-5" /> {space} ({dictionary.length})
            </button>

            {/* Auto-play toggle button */}
            <button
                onClick={() => setIsAutoPlay(!isAutoPlay)}
                className="fixed top-5 right-5 z-50 bg-beige text-gray-800 font-bold py-3 px-4 rounded-xl shadow-lg transition-colors duration-200 flex items-center gap-2"
            >
                {isAutoPlay ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>

            {/* Speed toggle button */}
            <button
                onClick={cycleSpeed}
                className="fixed top-5 right-32 z-50 bg-beige text-gray-800 font-bold py-3 px-4 rounded-xl shadow-lg transition-colors duration-200 flex items-center gap-2"
            >
                <Clock className="w-5 h-5" /> {autoPlaySpeed}s
            </button>

            {/* Scroll Down Button */}
            <button
                onClick={scrollDown}
                className="fixed bottom-[80px] right-5 z-50 bg-beige text-gray-800 font-bold py-3 px-4 rounded-xl shadow-lg transition-colors duration-200 flex items-center gap-2"
                disabled={currentIndex >= dictionary.length - 10}
            >
                <ArrowDown className="w-5 h-5" /> {step}
            </button>

            <div
                ref={containerRef}
                className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth px-8 py-12"
                style={{ scrollSnapType: 'y mandatory' }}
            >
                {dictionary.map((item, index) => (
                    <div
                        key={index}
                        ref={(el) => { cardRefs.current[index] = el; }}
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
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GamesPage;
