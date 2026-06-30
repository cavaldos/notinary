'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Copy, Check, Download } from 'lucide-react';
import { useDictionary } from '@/hooks/useDictionary';

const ExportPage: React.FC = () => {
    const router = useRouter();
    const { fetchData, dictionary, loading } = useDictionary();
    const [space, setSpace] = useState('L1');
    const [selectedType, setSelectedType] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('');
    const [copied, setCopied] = useState(false);

    const spaceOptions = ['L1', 'L2', 'L3', 'L4', 'L5'];

    // Lấy danh sách các Type có trong dictionary
    const types = useMemo(() => {
        const set = new Set<string>();
        dictionary.forEach((item) => {
            if (item.Type) set.add(item.Type);
        });
        return Array.from(set).sort();
    }, [dictionary]);

    // Lấy danh sách các Level có trong dictionary
    const levels = useMemo(() => {
        const set = new Set<string>();
        dictionary.forEach((item) => {
            if (item.Level) set.add(item.Level);
        });
        return Array.from(set).sort();
    }, [dictionary]);

    // Fetch data khi đổi space
    useEffect(() => {
        fetchData(space);
    }, [fetchData, space]);

    // Reset type & level khi đổi space
    useEffect(() => {
        setSelectedType('');
        setSelectedLevel('');
    }, [space]);

    // Lọc từ theo Type và Level
    const filteredWords = useMemo(() => {
        let words = dictionary;
        if (selectedType) {
            words = words.filter((item) => item.Type === selectedType);
        }
        if (selectedLevel === '') {
            // All — không lọc
        } else if (selectedLevel === '__none__') {
            words = words.filter((item) => !item.Level);
        } else {
            words = words.filter((item) => item.Level === selectedLevel);
        }
        return words;
    }, [dictionary, selectedType, selectedLevel]);

    // Chuỗi xuất: "word1, word2, word3, ..."
    const exportText = useMemo(() => {
        return filteredWords.map((item) => item.Word).join(', ');
    }, [filteredWords]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(exportText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback cho trình duyệt cũ
            const textarea = document.createElement('textarea');
            textarea.value = exportText;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="flex flex-col h-screen max-w-full select-none">
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:opacity-70 active:scale-90 transition-all"
                >
                    <ChevronLeft size={24} />
                </button>

                <h1 className="text-lg font-bold text-grey-dark">Export</h1>

                <span className="text-sm text-grey-dark opacity-50 font-medium">
                    {filteredWords.length} words
                </span>
            </div>

            {/* ── Space Time selector ── */}
            <div className="px-4 pb-2 max-w-xl mx-auto w-full">
                <label className="text-xs font-medium text-grey-dark opacity-60 mb-1.5 block">
                    Space Time
                </label>
                <div className="flex gap-1.5">
                    {spaceOptions.map((level) => (
                        <button
                            key={level}
                            onClick={() => setSpace(level)}
                            className={`shrink-0 text-xs font-bold rounded-full px-3 py-1.5 transition-all
                                ${space === level
                                    ? 'bg-grey-dark text-white shadow-sm'
                                    : 'bg-beige/60 text-grey-dark hover:bg-beige'
                                }`}
                        >
                            {level}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Type filter ── */}
            <div className="px-4 pb-3 max-w-xl mx-auto w-full">
                <label className="text-xs font-medium text-grey-dark opacity-60 mb-1.5 block">
                    Type
                </label>
                <div className="flex gap-1.5 overflow-x-auto">
                    <button
                        onClick={() => setSelectedType('')}
                        className={`shrink-0 text-xs font-medium rounded-full px-3 py-1.5 transition-all
                            ${selectedType === ''
                                ? 'bg-grey-dark text-white shadow-sm'
                                : 'bg-beige/60 text-grey-dark hover:bg-beige'
                            }`}
                    >
                        All
                    </button>
                    {types.map((type) => (
                        <button
                            key={type}
                            onClick={() => setSelectedType(type)}
                            className={`shrink-0 text-xs font-medium rounded-full px-3 py-1.5 transition-all
                                ${selectedType === type
                                    ? 'bg-grey-dark text-white shadow-sm'
                                    : 'bg-beige/60 text-grey-dark hover:bg-beige'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Level filter ── */}
            {levels.length > 0 && (
                <div className="px-4 pb-3 max-w-xl mx-auto w-full">
                    <label className="text-xs font-medium text-grey-dark opacity-60 mb-1.5 block">
                        Level
                    </label>
                    <div className="flex gap-1.5 overflow-x-auto">
                        <button
                            onClick={() => setSelectedLevel('')}
                            className={`shrink-0 text-xs font-medium rounded-full px-3 py-1.5 transition-all
                                ${selectedLevel === ''
                                    ? 'bg-grey-dark text-white shadow-sm'
                                    : 'bg-beige/60 text-grey-dark hover:bg-beige'
                                }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setSelectedLevel('__none__')}
                            className={`shrink-0 text-xs font-medium rounded-full px-3 py-1.5 transition-all
                                ${selectedLevel === '__none__'
                                    ? 'bg-grey-dark text-white shadow-sm'
                                    : 'bg-beige/60 text-grey-dark hover:bg-beige'
                                }`}
                        >
                            None
                        </button>
                        {levels.map((level) => (
                            <button
                                key={level}
                                onClick={() => setSelectedLevel(level)}
                                className={`shrink-0 text-xs font-medium rounded-full px-3 py-1.5 transition-all
                                    ${selectedLevel === level
                                        ? 'bg-grey-dark text-white shadow-sm'
                                        : 'bg-beige/60 text-grey-dark hover:bg-beige'
                                    }`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Export result ── */}
            <div className="flex-1 overflow-y-auto px-4 pb-28">
                {loading && dictionary.length === 0 ? (
                    <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                        Loading...
                    </div>
                ) : filteredWords.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
                        <Download size={24} />
                        <span className="text-sm">No words found</span>
                    </div>
                ) : (
                    <div className="max-w-xl mx-auto">
                        {/* Nút Copy */}
                        <div className="flex justify-end mb-2">
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-1.5 text-xs font-medium
                                           bg-grey-dark text-white rounded-full px-4 py-2
                                           hover:opacity-90 active:scale-95 transition-all"
                            >
                                {copied ? (
                                    <>
                                        <Check size={14} /> Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy size={14} /> Copy
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Kết quả export — hover để xem nghĩa */}
                        <div className="bg-white rounded-xl shadow-sm p-4
                                        text-sm text-gray-700 leading-relaxed
                                        break-words">
                            {filteredWords.map((item, index) => (
                                <React.Fragment key={item.id || index}>
                                    <span className="group relative inline-flex cursor-pointer">
                                        <span className="border-b border-dotted border-gray-300 hover:border-gray-500 transition-colors">
                                            {item.Word}
                                        </span>
                                        {/* Tooltip hiện nghĩa khi hover */}
                                        <span className="invisible group-hover:visible opacity-0 group-hover:opacity-100
                                                       absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5
                                                       px-2.5 py-1.5 rounded-lg text-xs leading-tight
                                                       bg-grey-dark text-white shadow-lg
                                                       whitespace-nowrap max-w-[280px] overflow-hidden text-ellipsis
                                                       transition-all duration-200 z-10
                                                       pointer-events-none">
                                            {item.Meaning}
                                            {/* Mũi tên */}
                                            <span className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0
                                                           border-l-4 border-r-4 border-t-4
                                                           border-l-transparent border-r-transparent border-t-grey-dark" />
                                        </span>
                                    </span>
                                    {index < filteredWords.length - 1 && (
                                        <span className="text-gray-400">, </span>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>

                        {/* Thông tin */}
                        <div className="mt-2 text-xs text-gray-400 text-center">
                            {filteredWords.length} word{filteredWords.length !== 1 ? 's' : ''}
                            {selectedType ? ` · ${selectedType}` : ''}
                            {selectedLevel === '__none__' ? ' · None' : selectedLevel ? ` · Level ${selectedLevel}` : ''}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExportPage;
