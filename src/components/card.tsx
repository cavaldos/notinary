
'use client';

import React, { useState } from 'react';
import { Volume2, Eye } from 'lucide-react';

interface CardProps {
    word: string;
    definition: string;
    example: string;
    pronunciation: string;
}

const Card: React.FC<CardProps> = ({ word, definition, example, pronunciation }) => {
    const [showExample, setShowExample] = useState(false);

    const handleTouchStart = () => {
        setShowExample(true);
    };

    const handleTouchEnd = () => {
        setShowExample(false);
    };

    const handleMouseDown = () => {
        setShowExample(true);
    };

    const handleMouseUp = () => {
        setShowExample(false);
    };

    return (
        <div className="text-center mb-8 py-4 rounded-lg ">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
                {word}
            </h1>

            {/* Pronunciation */}
            <div className="custom_sd inline-flex items-center bg-beige rounded-full px-4 py-1 shadow-sm mb-8">
                <span className="text-gray-600 mr-2">
                    {pronunciation}
                </span>
                <button
                    className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                    <Volume2 className="w-5 h-5" />
                </button>
            </div>

            {/* Definition */}
            <div className="space-y-4">
                <p className="text-xl text-gray-700">
                    <span className="font-semibold">{"partOfSpeech"}</span> {definition}
                </p>

                {/* Example với tính năng ẩn/hiện */}
                <div className="max-w-md mx-auto">
                    <div className="flex items-center justify-center mb-2">
                        <span className="font-semibold text-gray-600 mr-2">Example:</span>
                        <button
                            onTouchStart={handleTouchStart}
                            onTouchEnd={handleTouchEnd}
                            onMouseDown={handleMouseDown}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            className="text-gray-500 hover:text-gray-700 active:text-gray-800 transition-colors select-none p-2 rounded-full"
                            title="Giữ để hiện example"
                        >
                            <Eye className="w-5 h-5" />
                        </button>
                    </div>

                    {showExample ? (
                        <p className="text-gray-600 text-lg leading-relaxed select-none">
                            {example}
                        </p>
                    ) : (
                        <p className="text-gray-400 text-lg leading-relaxed blur-sm select-none">
                            {example}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Card;