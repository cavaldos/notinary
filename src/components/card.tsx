'use client';

import React from 'react';
import { Volume2, SquareChevronUp } from 'lucide-react';
import NotionService from '@/services/notion.service';
interface CardProps {
    word: string;
    level: string;
    type: string;
    meaning: string;
    pronunciation: string;
    idPage: string; // Thêm idPage để xác định trang trong Notion
}

const Card: React.FC<CardProps> = ({ idPage, word, level, type, meaning, pronunciation }) => {

    const showMeaning = true;

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
    const UpdateToDone = async (idPage: any) => {
        try {
            await NotionService.upDateToDone(idPage);

        } catch (error) {
            console.error('Lỗi khi cập nhật:', error);
        }
    };

    return (
        <div className="text-center mb-8 py-4 rounded-lg min-w-[400px] flex flex-col items-center justify-center  h-[400px]">

            <h1 className="text-5xl font-bold text-gray-900 mb-6 select-none">
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
            <button
                onClick={() => UpdateToDone(idPage)}
                className='text-black rounded-full w-16 h-16 flex items-center justify-center transition-colors mt-auto hover:bg-gray-100 active:bg-gray-200'>
                <SquareChevronUp size={40} />
            </button>
        </div>
    );
}

export default Card;