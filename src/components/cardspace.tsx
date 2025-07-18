'use client';

import React from 'react';
import { Volume2, ArrowRight, ArrowLeft } from 'lucide-react';
import NotionService from '@/services/notion.service';
import { useParams } from 'next/navigation';

interface CardProps {
    index: number;
    idPage: string;
    word: string;
    level: string;
    type: string;
    meaning: string;
    pronunciation: string;
}

const CardSpace: React.FC<CardProps> = ({ index, idPage, word, level, type, meaning, pronunciation }) => {
    const showMeaning = true;
    const params = useParams();
    const { space } = params;

    // Hàm phát âm thanh
    const speakWord = () => {
        if ('speechSynthesis' in window) {
            // Dừng phát âm hiện tại nếu có
            window.speechSynthesis.cancel();

            // Tạo utterance mới
            const utterance = new SpeechSynthesisUtterance(word);

            // Cấu hình giọng nói
            utterance.lang = 'en-US'; // Đặt ngôn ngữ tiếng Anh
            utterance.rate = 0.8; // Tốc độ nói (0.1 - 10)
            utterance.pitch = 1; // Cao độ giọng (0 - 2)
            utterance.volume = 1; // Âm lượng (0 - 1)

            // Phát âm
            window.speechSynthesis.speak(utterance);
        } else {
            // Fallback cho các trình duyệt không hỗ trợ
            console.warn('Trình duyệt không hỗ trợ Text-to-Speech');
            alert('Trình duyệt của bạn không hỗ trợ phát âm thanh');
        }
    };

    const updateSpacedTime = async (idPage: any, selectValue: string, status: string) => {
        try {
            const response: any = await NotionService.en.updateSpacedTime(idPage, selectValue, status);
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
        <div className="text-center mb-8 py-4 rounded-lg min-w-[500px] flex flex-col items-center justify-center  h-[400px]">

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
                        <span className="font-semibold text-gray-600 mr-2">{index}</span>
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

            {/* Navigation buttons - Cải thiện CSS */}
            <div className="flex items-center justify-center gap-10 mt-auto pt-6">
                <button
                    onClick={() => handleSpaceUpdate('down')}
                    className="group flex items-center justify-center w-12 h-12 bg-beige rounded-md transition-all duration-200 hover:cursor-pointer"
                    title="Thẻ trước"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-gray-800 transition-colors" />
                </button>

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