'use client';

import React from 'react';
import { Volume2 } from 'lucide-react';

interface CardProps {
    word: string;
    level: string;
    type: string;
    meaning: string;
    pronunciation: string;
}

const Card: React.FC<CardProps> = ({ word, level, type, meaning, pronunciation }) => {

    // const [showMeaning, setshowMeaning] = useState(true);

    const showMeaning = true; // Temporarily set to true for testing
    // const handleTouchStart = () => {
    //     setshowMeaning(true);
    // };

    // const handleTouchEnd = () => {
    //     setshowMeaning(false);
    // };

    // const handleMouseDown = () => {
    //     setshowMeaning(true);
    // };

    // const handleMouseUp = () => {
    //     setshowMeaning(false);
    // };

    return (
        <div className="text-center mb-8 py-4 rounded-lg min-w-[400px] flex flex-col items-center justify-center">
            {/* <button
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="text-gray-500 hover:text-gray-700 ml-auto mr-4  active:text-gray-800 transition-colors select-none p-2 rounded-full"
            >
                <Eye className=" w-20 h-20 p-3" />
            </button> */}
            <h1 className="text-5xl font-bold text-gray-900 mb-6 select-none">
                {word}
            </h1>

            {/* Pronunciation */}
            <div className="custom_sd inline-flex items-center bg-beige rounded-full px-4 py-1 shadow-sm mb-8 select-none">
                <span className="text-gray-600 mr-2">
                    {pronunciation}
                </span>
                <button
                    className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                    <Volume2 className="w-5 h-5" />
                </button>
            </div>

            <div className="space-y-4">
                {/* Type và Level tags */}
                <div className="flex items-center justify-center gap-2 mb-4">
                    <span className="inline-block bg-[#dcebdd] text-black px-3 py-1 rounded-md text-sm font-medium">
                        {type}
                    </span>
                    <span className="inline-block bg-[#fbded9] text-black px-3 py-1 rounded-md text-sm font-medium">
                        {level}
                    </span>
                </div>

                {/* Example với tính năng ẩn/hiện */}
                <div className="max-w-md mx-auto">
                    <div className="flex items-center justify-center mb-2">
                        <span className="font-semibold text-gray-600 mr-2">Mean:</span>
                    </div>

                    {showMeaning ? (
                        <p className="text-gray-600 text-lg leading-relaxed select-none">
                            {meaning}
                        </p>
                    ) : (
                        <p className="text-gray-400 text-lg leading-relaxed blur-sm select-none">
                            {meaning}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Card;