'use client'
import React, { useState, useRef, useEffect, useCallback, use } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import Card from '@/components/cardspace';
import { useDictionary } from '@/hooks/useDictionary';
import { saveScrollPosition } from '@/redux/features/scrollSlice';
import type { RootState } from '@/redux/store';

const SpaceTime = ({ params }: { params: Promise<{ space: string }> }) => {
    const { fetchData, dictionary } = useDictionary();
    const dispatch = useDispatch();
    const { space } = use(params);

    const savedIndex = useSelector(
        (state: RootState) => state.scroll.positions[space] ?? 0,
    );

    const [currentIndex, setCurrentIndex] = useState(savedIndex);
    const containerRef = useRef<HTMLDivElement>(null);
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
    const hasRestored = useRef(false);

    useEffect(() => {
        fetchData(space);
    }, [fetchData, space]);

    // Scroll to specific card
    const scrollToCard = useCallback(
        (index: number, behavior: ScrollBehavior = 'smooth') => {
            if (cardRefs.current[index]) {
                cardRefs.current[index]?.scrollIntoView({
                    behavior,
                    block: 'center',
                });
            }
        },
        [],
    );

    // ── Khôi phục vị trí cuộn khi data đã load và card được render ──
    useEffect(() => {
        if (
            dictionary.length > 0 &&
            savedIndex > 0 &&
            !hasRestored.current &&
            cardRefs.current[savedIndex]
        ) {
            hasRestored.current = true;
            // Dùng timeout nhỏ để đảm bảo DOM đã render xong
            requestAnimationFrame(() => {
                scrollToCard(savedIndex, 'auto');
            });
        }
    }, [dictionary.length, savedIndex, scrollToCard]);

    // Reset flag khi đổi space
    useEffect(() => {
        hasRestored.current = false;
    }, [space]);

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
                    // Lưu index vào Redux để khi quay lại vẫn nhớ
                    dispatch(saveScrollPosition({ space, index: closestIndex }));
                    scrollToCard(closestIndex);
                }
            }, 150);
        };

        container.addEventListener('scroll', handleScroll);
        return () => {
            container.removeEventListener('scroll', handleScroll);
            clearTimeout(timeoutId);
        };
    }, [currentIndex, scrollToCard, dispatch, space]);

    return (
        <div className="flex flex-col h-screen mb-[20px] w-full max-w-full">
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
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SpaceTime;
