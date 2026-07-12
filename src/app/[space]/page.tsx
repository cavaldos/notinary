'use client'
import React, { useState, useRef, useEffect, useCallback, use } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import Card from '@/components/cardspace';
import { useDictionary } from '@/hooks/useDictionary';
import { saveScrollPosition } from '@/redux/features/scrollSlice';
import type { RootState } from '@/redux/store';

// ── Easing scroll animation (chậm → nhanh → chậm) ──
function animatedScrollTo(
    container: HTMLElement,
    targetPosition: number,
    duration: number = 400,
) {
    const startPosition = container.scrollTop;
    const distance = targetPosition - startPosition;
    if (Math.abs(distance) < 1) return;

    // Nhảy tức thì nếu duration = 0
    if (duration <= 0) {
        container.scrollTop = targetPosition;
        return;
    }

    // Tạm tắt snap để animation mượt, không bị ngắt quãng
    const prevSnap = container.style.scrollSnapType;
    container.style.scrollSnapType = 'none';

    const startTime = performance.now();

    // easeInOutCubic: chậm → nhanh → chậm
    const easeInOutCubic = (t: number): number =>
        t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeInOutCubic(progress);

        container.scrollTop = startPosition + distance * easedProgress;

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // Khôi phục snap sau khi animation hoàn tất
            container.style.scrollSnapType = prevSnap;
        }
    };

    requestAnimationFrame(animate);
}

const SpaceTime = ({ params }: { params: Promise<{ space: string }> }) => {
    const { fetchData, dictionary } = useDictionary();
    const dispatch = useDispatch();
    const { space } = use(params);

    const savedIndex = useSelector(
        (state: RootState) => state.scroll.positions[space] ?? 0,
    );

    const [currentIndex, setCurrentIndex] = useState(savedIndex);
    const currentIndexRef = useRef(savedIndex);
    const containerRef = useRef<HTMLDivElement>(null);
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
    const hasRestored = useRef(false);

    useEffect(() => {
        fetchData(space);
    }, [fetchData, space]);

    // ── Scroll đến card với easing ──
    const scrollToCard = useCallback(
        (index: number, duration: number = 400) => {
            const card = cardRefs.current[index];
            const container = containerRef.current;
            if (!card || !container) return;

            const containerRect = container.getBoundingClientRect();
            const cardRect = card.getBoundingClientRect();
            const targetPosition =
                container.scrollTop +
                (cardRect.top - containerRect.top) -
                container.clientHeight / 2 +
                card.offsetHeight / 2;

            currentIndexRef.current = index;
            animatedScrollTo(container, targetPosition, duration);
        },
        [],
    );

    // ── Keyboard shortcuts: Home → đầu, End → cuối ──
    useEffect(() => {
        if (dictionary.length === 0) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Home') {
                e.preventDefault();
                scrollToCard(0, 500);
            } else if (e.key === 'End') {
                e.preventDefault();
                scrollToCard(dictionary.length - 1, 500);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [dictionary.length, scrollToCard]);

    // ── Khôi phục vị trí cuộn khi quay lại ──
    useEffect(() => {
        if (
            dictionary.length > 0 &&
            savedIndex > 0 &&
            !hasRestored.current &&
            cardRefs.current[savedIndex]
        ) {
            hasRestored.current = true;
            // Không animation khi khôi phục — nhảy tức thì
            requestAnimationFrame(() => {
                scrollToCard(savedIndex, 0);
            });
        }
    }, [dictionary.length, savedIndex, scrollToCard]);

    // Reset flag khi đổi space
    useEffect(() => {
        hasRestored.current = false;
    }, [space]);

    // ── Snap effect khi cuộn tay ──
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
                    currentIndexRef.current = closestIndex;
                    setCurrentIndex(closestIndex);
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

    const step10 = Math.max(1, Math.round(dictionary.length * 0.1));
    const scrollUp10 = () =>
        scrollToCard(Math.max(0, currentIndexRef.current - step10), 400);
    const scrollDown10 = () =>
        scrollToCard(
            Math.min(dictionary.length - 1, currentIndexRef.current + step10),
            400,
        );

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

            {/* Floating scroll buttons — ↑ lên 10% / ↓ xuống 10% */}
            <div className="fixed bottom-12 right-6 flex flex-col gap-1.5 z-[999]">
                <button
                    onClick={scrollUp10}
                    className="w-7 h-7 rounded-full bg-beige text-grey-dark shadow-md hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center text-xs font-bold"
                    title={`Lên ${step10} từ (Home = đầu)`}
                >
                    ↑
                </button>
                <button
                    onClick={scrollDown10}
                    className="w-7 h-7 rounded-full bg-beige text-grey-dark shadow-md hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center text-xs font-bold"
                    title={`Xuống ${step10} từ (End = cuối)`}
                >
                    ↓
                </button>
            </div>
        </div>
    );
};

export default SpaceTime;
