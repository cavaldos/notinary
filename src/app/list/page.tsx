'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Search, Volume2 } from 'lucide-react';
import { useDictionary } from '@/hooks/useDictionary';
import useTextToSpeech from '@/hooks/useTextToSpeech';

const WordList: React.FC = () => {
    const router = useRouter();
    const { fetchData, dictionary, loading } = useDictionary();
    const { speak } = useTextToSpeech();
    const [space, setSpace] = useState('L1');
    const [search, setSearch] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('');
    const spaceOptions = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'];

    const types = useMemo(() => {
        const set = new Set<string>();
        dictionary.forEach((item) => {
            if (item.Type) set.add(item.Type);
        });
        return Array.from(set).sort();
    }, [dictionary]);

    const levels = useMemo(() => {
        const set = new Set<string>();
        dictionary.forEach((item) => {
            if (item.Level) set.add(item.Level);
        });
        return Array.from(set).sort();
    }, [dictionary]);

    const handleSpeak = useCallback(
        (word: string) => {
            speak(word, {
                language: process.env.NEXT_PUBLIC_SPEECH_LANGUAGE || 'en',
                rate: 0.8,
                pitch: 1,
            });
        },
        [speak],
    );

    useEffect(() => {
        fetchData(space);
    }, [fetchData, space]);

    const filtered = dictionary.filter((item) => {
        if (selectedType && item.Type !== selectedType) return false;
        if (selectedLevel === '__none__') {
            if (item.Level) return false;
        } else if (selectedLevel && item.Level !== selectedLevel) {
            return false;
        }
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
            item.Word.toLowerCase().includes(q) ||
            item.Meaning.toLowerCase().includes(q)
        );
    });

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

                <span className="text-sm text-grey-dark opacity-50 font-medium">
                    {dictionary.length} words
                </span>
            </div>

            {/* ── Search bar ── */}
            <div className="px-4 pb-3 max-w-xl mx-auto w-full">
                <div className="relative">
                    <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                        type="text"
                        placeholder="Search word or meaning..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-beige/40 rounded-xl text-sm
                                   text-grey-dark placeholder:text-gray-400
                                   outline-none border border-transparent
                                   focus:border-grey-dark/20 focus:bg-beige/60
                                   transition-all"
                    />
                </div>
            </div>

            {/* ── Type filter chips ── */}
            {types.length > 0 && (
                <div className="px-4 pb-3 max-w-xl mx-auto w-full overflow-x-auto">
                    <div className="flex gap-1.5">
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
            )}

            {/* ── Level filter chips ── */}
            <div className="px-4 pb-3 max-w-xl mx-auto w-full overflow-x-auto">
                <div className="flex gap-1.5">
                    {spaceOptions.map((level) => (
                        <button
                            key={level}
                            onClick={() => {
                                setSpace(level);
                                setSearch('');
                                setSelectedType('');
                                setSelectedLevel('');
                            }}
                            className={`shrink-0 text-xs font-bold rounded-full px-3 py-1 transition-all
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

            {/* ── Level filter ── */}
            {levels.length > 0 && (
                <div className="px-4 pb-3 max-w-xl mx-auto w-full overflow-x-auto">
                    <div className="flex gap-1.5">
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

            {/* ── Word list ── */}
            <div className="flex-1 overflow-y-auto pb-24">
                {loading && dictionary.length === 0 ? (
                    <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                        Loading...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
                        <Search size={24} />
                        <span className="text-sm">No words found</span>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2.5 max-w-xl mx-auto px-4">
                        {filtered.map((item, index) => (
                            <div
                                key={item.id || index}
                                className="bg-white rounded-xl shadow-sm
                                           px-4 py-3 flex items-center gap-2.5
                                           hover:shadow-md hover:-translate-y-0.5
                                           active:scale-[0.98]
                                           transition-all duration-200"
                            >
                                {/* Word — click to speak */}
                                <button
                                    onClick={() => handleSpeak(item.Word)}
                                    className="flex items-center gap-1.5 shrink-0
                                               text-[15px] font-bold text-gray-900 leading-tight
                                               hover:text-blue-600 active:scale-95
                                               transition-all"
                                >
                                    <Volume2 size={14} className="opacity-40 group-hover:opacity-100" />
                                    {item.Word}
                                </button>

                                {/* Type badge */}
                                {item.Type && (
                                    <span className="text-[11px] font-medium text-gray-400 bg-gray-100
                                                     rounded-md px-1.5 py-0.5 shrink-0 leading-none">
                                        {item.Type}
                                    </span>
                                )}

                                {/* Meaning */}
                                <span className="text-sm text-gray-500 leading-snug truncate min-w-0">
                                    {item.Meaning}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WordList;
