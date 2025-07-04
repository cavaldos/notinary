'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Card from '../../components/card';
import NotionService from '@/services/notion.service';

const VocabularyApp: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

    const [dictionary, setDictionary] = useState([] as any[]);

    useEffect(() => {
        // Fetch data from Notion API
        const fetchData = async () => {
            try {
                const response: any = await NotionService.getEntireWord();
                // filter nhuwngx từ có word banng null
                const filteredData = response.data.filter((item: any) => item.Word !== null && item.Word.trim() !== '');

                setDictionary(filteredData || []);
            } catch (error) {
                console.error('Error fetching vocabulary:', error);
            }
        };

        fetchData();
    }, []);



    // Scroll to specific card with smooth animation
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
        <div className="flex flex-col h-screen mb-[20px] w-full max-w-full">
            <div className='fixed top-0 left-0 right-0 z-50 bg-beige mx-auto max-w-[60%] 
                      mt-[30px] py-[5px] px-[10px] p-2 rounded-full text-center text-shadow-grey-dark font-bold'>
                Dynamic Island ({currentIndex + 1}/{dictionary.length})
            </div>

            {/* Main Content */}
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
                            idPage={item.id}
                            word={item.Word}
                            level={item.Level}
                            type={item.Type}
                            pronunciation={item.Pronunce}
                            meaning={item.Meaning}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VocabularyApp;