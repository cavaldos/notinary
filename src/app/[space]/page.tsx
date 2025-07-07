'use client'
import React, { useState, useRef, useEffect, useCallback, use } from 'react';

import Card from '@/components/cardspace';
import { useDictionary } from '@/hooks/useDictionary';

const SpaceTime = ({ params }: { params: Promise<{ space: string }> }) => {
    const { fetchData, dictionary } = useDictionary();
    const { space } = use(params);

    const [currentIndex, setCurrentIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

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

    // Scroll down by 10 items
    const scrollDownByTen = useCallback(() => {
        const newIndex = Math.min(currentIndex + 30, dictionary.length - 1);
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
            {/* <div className='fixed top-0 left-0 right-0 z-50 bg-beige mx-auto max-w-[60%] 
                      mt-[30px] py-[5px] px-[10px] p-2 rounded-full text-center text-shadow-grey-dark font-bold'>
                Dynamic Island ({currentIndex + 1}/{dictionary.length})
            </div> */}

            {/* Scroll Down Button */}
            <button
                onClick={scrollDownByTen}
                className="fixed bottom-[80px] right-8 z-50 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-full shadow-lg transition-colors duration-200"
                disabled={currentIndex >= dictionary.length - 10}
            >
                ↓ 10
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
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SpaceTime;