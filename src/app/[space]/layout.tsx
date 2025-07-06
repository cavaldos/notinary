'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';

import { useDictionary } from '@/hooks/useDictionary';


const SpaceLayout = ({ children }: { children: React.ReactNode }) => {
    const { total, fetchData } = useDictionary();
    const params = useParams();
    const space = params?.space as string;



    const [isExpanded, setIsExpanded] = useState(false);
    const dynamicIconRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const router = useRouter();

    const Item = [{
        label: "Fa",
        path: "/Familiar"
    },
    {
        label: "Co",
        path: "/Competent"
    },
    {
        label: "Ex",
        path: "/Expert"
    },
    {
        label: "Ma",
        path: "/Mastery"
    }];

    // Hàm để reset timeout
    const resetTimeout = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        if (isExpanded) {
            timeoutRef.current = setTimeout(() => {
                setIsExpanded(false);
            }, 5000);
        }
    }, [isExpanded]);
    useEffect(() => {
        fetchData(space);
    }, [fetchData, space]);
    // Effect để xử lý click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dynamicIconRef.current && !dynamicIconRef.current.contains(event.target as Node)) {
                if (isExpanded) {
                    setIsExpanded(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isExpanded]);

    // Effect để xử lý timeout khi isExpanded thay đổi
    useEffect(() => {
        resetTimeout();

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [isExpanded, resetTimeout]);

    const handleDynamicClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    const handleItemClick = (path: string, e: React.MouseEvent) => {
        e.stopPropagation();

        router.push(path);
    };

    // Hàm để reset timeout khi hover hoặc tương tác
    const handleMouseEnter = () => {
        resetTimeout();
    };

    const handleMouseLeave = () => {
        resetTimeout();
    };

    return (
        <div className="flex flex-col h-screen mb-[20px] w-full max-w-full select-none">
            <div
                ref={dynamicIconRef}
                onClick={handleDynamicClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className={`fixed top-0 left-0 right-0 z-50 bg-beige mx-auto transition-all duration-300 ease-in-out
                      mt-[30px] py-[5px] px-[10px] p-2 rounded-full text-center text-shadow-grey-dark font-bold
                      ${isExpanded ? 'max-w-[80%]' : 'max-w-[60%]'}`}>

                {!isExpanded ? (
                    <div
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                    >
                        {space} {total > 0 ? `${total}` : ''}
                    </div>
                ) : (
                    <div className="flex items-center justify-between w-full px-2 transition-all duration-300">
                        {Item.map((item, index) => (
                            <button
                                key={index}
                                onClick={(e) => handleItemClick(item.path, e)}
                                onMouseEnter={handleMouseEnter}
                                className="flex-1 mx-1 px-4 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 ease-in-out
                                         rounded-full text-sm font-medium transition-all duration-200
                                         hover:scale-105 active:scale-95 text-center"
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div
                className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth px-8 py-12 "
            >
                {children}
            </div>
        </div>
    );
};

export default SpaceLayout;