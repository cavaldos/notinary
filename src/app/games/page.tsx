'use client';

import React, { useState, useRef, useEffect, useCallback, use } from 'react';

import { useDictionary } from '@/hooks/useDictionary';

const GamesPage: React.FC = () => {
    const { fetchData, dictionary } = useDictionary();
    const space = 'L2'; // Static space for games page
    useEffect(() => {
        fetchData(space);
    }, [fetchData, space]);
    console.log('Dictionary data:', dictionary);
    return (
        <div className="min-h-screen p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-center mb-8">
                    Games
                </h1>

                <div className="text-center text-gray-600">
                    <p>Trang games đã được clean. Bạn có thể bắt đầu code lại từ đây.</p>
                </div>
            </div>
        </div>
    );
};

export default GamesPage;