'use client';

import React from 'react';
import { Volume2, ArrowRight, ArrowLeft } from 'lucide-react';
import NotionService from '@/services/notion.service';
import { useParams } from 'next/navigation';
import useTextToSpeech from '@/hooks/useTextToSpeech';
import { normalizeTypeTags } from '@/lib/type-tags';

interface CardProps {
    index: number;
    idPage: string;
    word: string;
    level: string;
    type: string[];
    meaning: string;
    pronunciation: string;
    example?: string;
    synonyms?: string[];
    genre?: string;
}

const CardSpace: React.FC<CardProps> = ({ index, idPage, word, level, type, meaning, pronunciation, example, synonyms = [], genre }) => {
    const showMeaning = true;
    const typeTags = normalizeTypeTags(type);
    const params = useParams();
    const { space } = params;

    const { speak, stop } = useTextToSpeech();

    // Hàm phát âm thanh (sử dụng hook chung)
    const speakWord = () => {
        speak(word, { language: process.env.NEXT_PUBLIC_SPEECH_LANGUAGE || 'en' });
    };


    const updateSpacedTime = async (idPage: any, selectValue: string, status: string) => {
        try {
            const response: any = await NotionService.updateSpacedTime(idPage, selectValue, status);
            if (response.success) {
                console.log('Cập nhật thành công:', response.data);
            } else {
                console.error('Cập nhật thất bại:', response.error);
            }
        } catch (error) {
            console.error('Lỗi khi cập nhật:', error);
        }
    };

    // Handle the case where space might be undefined
    const handleSpaceUpdate = (status: string) => {
        if (space && typeof space === 'string') {
            updateSpacedTime(idPage, space, status);
        } else {
            console.warn('Space parameter is undefined or not a string');
        }
    };

    return (
        <div className="text-center mb-15 py-4 rounded-lg w-full max-w-[500px] flex flex-col items-center justify-center min-h-[400px] h-auto">

            <h1 className="text-4xl font-bold text-gray-900 mb-6 select-none">
                {word}
            </h1>

            {/* Pronunciation */}
            <div
                onClick={speakWord}
                className="custom_sd inline-flex items-center bg-beige rounded-full px-4 py-1 shadow-sm mb-8 select-none hover:cursor-pointer">

                <span className="text-gray-600 mr-2">
                    {pronunciation}
                </span>
                <button
                    className="text-gray-600 hover:text-gray-800 transition-colors p-1 rounded-full hover:bg-gray-100 active:bg-gray-200"
                    title="Phát âm từ này"
                >
                    <Volume2 className="w-5 h-5" />
                </button>
            </div>

            <div className="space-y-4">
                {/* Type, Level và Genre tags */}
                <div className="flex items-center justify-center gap-2 mb-4">
                    {typeTags.map((typeTag) => (
                        <span key={typeTag} className="inline-block bg-[#dcebdd] text-gray-800 px-3 py-1 rounded-md text-sm font-medium">
                            {typeTag}
                        </span>
                    ))}
                    {level && (
                        <span className="inline-block bg-[#fbded9] text-gray-800 px-3 py-1 rounded-md text-sm font-medium">
                            {level}
                        </span>
                    )}
                    {genre && (
                        <span className="inline-block bg-[#fef3c7] text-gray-800 px-3 py-1 rounded-md text-sm font-medium">
                            {genre}
                        </span>
                    )}
                </div>

                {/* Meaning */}
                <div className="max-w-md mx-auto">
                    {showMeaning ? (
                        <p className="text-gray-600 text-lg leading-relaxed select-none whitespace-normal break-words">
                            {meaning}
                        </p>
                    ) : (
                        <p className="text-gray-400 text-lg leading-relaxed blur-sm select-none whitespace-normal break-words">
                            {meaning}
                        </p>
                    )}
                </div>

                {/* Synonyms */}
                {synonyms.length > 0 && (
                    <div className="max-w-md mx-auto">
                        <div className="flex flex-wrap items-center justify-center gap-2">
                            {synonyms.map((synonym, i) => (
                                <span
                                    key={`${synonym}-${i}`}
                                    className="inline-block bg-beige text-gray-800 px-3 py-1 rounded-md text-sm font-medium"
                                >
                                    {synonym}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Example sentence */}
                {example && (
                    <div className="max-w-md mx-auto mt-4 p-1 bg-beige rounded-md">
                        <p className="text-gray-700 text-sm italic leading-relaxed select-none whitespace-normal break-words">
                            "{example}"
                        </p>
                    </div>
                )}

            </div>

            {/* Navigation buttons - Cải thiện CSS */}
            <div className="flex items-center justify-center gap-5 mt-auto pt-6">
                <button
                    onClick={() => handleSpaceUpdate('down')}
                    className="group flex items-center justify-center w-12 h-12 bg-beige rounded-md transition-all duration-200 hover:cursor-pointer"
                    title="Thẻ trước"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-gray-800 transition-colors" />
                </button>
                <div className="flex items-center justify-center">
                    <span className="font-semibold text-gray-600">{index}</span>
                </div>
                <button
                    onClick={() => handleSpaceUpdate('up')}
                    className="group flex items-center justify-center w-12 h-12 bg-beige rounded-md transition-all duration-200 hover:cursor-pointer"
                    title="Thẻ tiếp theo"
                >
                    <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-gray-800 transition-colors" />
                </button>
            </div>
        </div>
    );
}

export default CardSpace;
