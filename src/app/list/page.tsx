'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft,
    Search,
    Volume2,
    ChevronRight,
    ChevronDown,
    X,
    Loader2,
} from 'lucide-react';
import { useDictionary } from '@/hooks/useDictionary';
import useTextToSpeech from '@/hooks/useTextToSpeech';
import { hasTypeTag, normalizeTypeTags } from '@/lib/type-tags';
import NotionService from '@/services/notion.service';
import type { DictionaryItem } from '@/redux/features/dictionarySlice';

const spaceOptions = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'];

const WordList: React.FC = () => {
    const router = useRouter();
    const { fetchData, dictionary, loading } = useDictionary();
    const { speak } = useTextToSpeech();

    // ── Filters ──
    const [space, setSpace] = useState('L1');
    const [search, setSearch] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('');

    // ── Popup ──
    const [popupItem, setPopupItem] = useState<DictionaryItem | null>(null);
    const [moving, setMoving] = useState(false);

    // ── Derived data ──
    const types = useMemo(() => {
        const set = new Set<string>();
        dictionary.forEach((item) => {
            normalizeTypeTags(item.Type).forEach((type) => set.add(type));
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

    // ── Filter items ──
    const filtered = useMemo(
        () =>
            dictionary.filter((item) => {
                if (selectedType && !hasTypeTag(item.Type, selectedType)) return false;
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
            }),
        [dictionary, selectedType, selectedLevel, search],
    );

    // ── Handlers ──
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

    const openPopup = useCallback((item: DictionaryItem) => {
        setPopupItem(item);
    }, []);

    const closePopup = useCallback(() => {
        setPopupItem(null);
    }, []);

    const handleMove = useCallback(
        async (direction: 'prev' | 'next') => {
            if (!popupItem || moving) return;

            setMoving(true);
            try {
                await NotionService.updateSpacedTime(
                    popupItem.id,
                    space,
                    direction === 'next' ? 'up' : 'down',
                );
                closePopup();
                await fetchData(space);
            } catch (err) {
                console.error('Move failed:', err);
                alert('Failed to move item. Please try again.');
            } finally {
                setMoving(false);
            }
        },
        [popupItem, moving, space, closePopup, fetchData],
    );

    useEffect(() => {
        fetchData(space);
    }, [fetchData, space]);

    // ── Close popup on Escape ──
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closePopup();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [closePopup]);

    // ── Determine if prev/next is possible from current space ──
    const currentLevelIndex = spaceOptions.indexOf(space);
    const canPrev = currentLevelIndex > 0;
    const canNext = currentLevelIndex < spaceOptions.length - 1;

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

            {/* ── Space filter chips ── */}
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
            <div className="flex-1 overflow-y-auto pb-8">
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
                                onClick={() => openPopup(item)}
                                className="group bg-white rounded-xl shadow-sm
                                           px-4 py-3 flex items-center gap-2.5
                                           hover:shadow-md hover:-translate-y-0.5
                                           active:scale-[0.98]
                                           transition-all duration-200 cursor-pointer"
                            >
                                {/* Word — click to speak */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSpeak(item.Word);
                                    }}
                                    className="flex items-center gap-1.5 shrink-0
                                               text-[15px] font-bold text-gray-900 leading-tight
                                               hover:text-blue-600 active:scale-95
                                               transition-all"
                                >
                                    <Volume2
                                        size={14}
                                        className="opacity-40 group-hover:opacity-100"
                                    />
                                    {item.Word}
                                </button>

                                {/* Type badges */}
                                {normalizeTypeTags(item.Type).map((type) => (
                                    <span
                                        key={type}
                                        className="text-[11px] font-medium text-gray-400 bg-gray-100
                                                   rounded-md px-1.5 py-0.5 shrink-0 leading-none"
                                    >
                                        {type}
                                    </span>
                                ))}

                                {/* Meaning */}
                                <span className="text-sm text-gray-600 leading-snug truncate min-w-0">
                                    {item.Meaning}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Popup overlay ── */}
            {popupItem && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4
                               bg-black/20 backdrop-blur-sm"
                    onClick={closePopup}
                >
                    <div
                        className="w-full max-w-sm bg-white rounded-2xl shadow-xl
                                   overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* ── Card header ── */}
                        <div className="flex items-start justify-between px-5 pt-5 pb-3">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <button
                                        onClick={() => handleSpeak(popupItem.Word)}
                                        className="text-blue-600 hover:text-blue-700
                                                   active:scale-95 transition-all shrink-0"
                                    >
                                        <Volume2 size={18} />
                                    </button>
                                    <h2 className="text-lg font-bold text-gray-900 truncate">
                                        {popupItem.Word}
                                    </h2>
                                </div>
                                <p className="text-sm text-gray-600 leading-snug mt-1">
                                    {popupItem.Meaning}
                                </p>
                                {normalizeTypeTags(popupItem.Type).length > 0 && (
                                    <div className="flex gap-1.5 mt-2">
                                        {normalizeTypeTags(popupItem.Type).map((type) => (
                                            <span
                                                key={type}
                                                className="text-[11px] font-medium text-gray-400 bg-gray-100
                                                           rounded-md px-1.5 py-0.5 leading-none"
                                            >
                                                {type}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={closePopup}
                                className="p-1 hover:opacity-60 active:scale-90 transition-all shrink-0"
                            >
                                <X size={20} className="text-gray-400" />
                            </button>
                        </div>

                        {/* ── Current level indicator ── */}
                        <div className="px-5 pb-3">
                            <span className="text-xs font-medium text-gray-400">
                                Current:{' '}
                                <span className="text-grey-dark font-bold">{space}</span>
                            </span>
                        </div>

                        {/* ── Prev / Next buttons ── */}
                        <div className="flex gap-3 px-5 pb-5">
                            <button
                                onClick={() => handleMove('prev')}
                                disabled={!canPrev || moving}
                                className={`flex-1 flex items-center justify-center gap-1.5
                                           text-sm font-bold rounded-xl py-2.5
                                           transition-all duration-150
                                           ${!canPrev || moving
                                               ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                               : 'bg-beige/60 text-grey-dark hover:bg-beige active:scale-[0.97]'
                                           }`}
                            >
                                {moving ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <ChevronLeft size={16} />
                                )}
                                Prev
                                {!moving && canPrev && (
                                    <span className="text-[10px] opacity-50">
                                        {spaceOptions[currentLevelIndex - 1]}
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={() => handleMove('next')}
                                disabled={!canNext || moving}
                                className={`flex-1 flex items-center justify-center gap-1.5
                                           text-sm font-bold rounded-xl py-2.5
                                           transition-all duration-150
                                           ${!canNext || moving
                                               ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                               : 'bg-grey-dark text-white hover:brightness-110 active:scale-[0.97]'
                                           }`}
                            >
                                Next
                                {moving ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <ChevronRight size={16} />
                                )}
                                {!moving && canNext && (
                                    <span className="text-[10px] opacity-60">
                                        {spaceOptions[currentLevelIndex + 1]}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WordList;
