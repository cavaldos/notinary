'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDictionary } from '@/hooks/useDictionary';
import type { DictionaryItem } from '@/redux/features/dictionarySlice';
import { Volume2, RotateCcw } from 'lucide-react';
import useTextToSpeech from '@/hooks/useTextToSpeech';

type Question = {
    correctWord: DictionaryItem;
    options: DictionaryItem[];
};

const normalizeType = (type: string): string => {
    const t = type.toLowerCase().trim();
    if (t === 'verb' || t === 'in-verb') return 'verb';
    return t;
};

const typeDisplayLabels: Record<string, string> = {
    all: 'All',
    verb: 'Verb',
    noun: 'Noun',
    adj: 'Adj',
    adv: 'Adv',
    phrase: 'Phrase',
};

const GameSelectPage: React.FC = () => {
    const { fetchData, dictionary, loading } = useDictionary();
    const { speak } = useTextToSpeech();

    const [space, setSpace] = useState('L2');
    const [typeFilter, setTypeFilter] = useState('all');
    const [gameStarted, setGameStarted] = useState(false);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQ, setCurrentQ] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [gameFinished, setGameFinished] = useState(false);

    const spaceOptions = ['L1', 'L2', 'L3', 'L4'];
    const typeOptions = ['all', 'verb', 'noun', 'adj', 'adv', 'phrase'];

    useEffect(() => {
        fetchData(space);
    }, [fetchData, space]);

    const itemsByType = useMemo(() => {
        const map = new Map<string, DictionaryItem[]>();
        for (const item of dictionary) {
            const t = normalizeType(item.Type);
            if (!map.has(t)) map.set(t, []);
            map.get(t)!.push(item);
        }
        return map;
    }, [dictionary]);

    const filteredItems = useMemo(() => {
        if (typeFilter === 'all') return dictionary;
        return itemsByType.get(typeFilter) ?? [];
    }, [dictionary, itemsByType, typeFilter]);

    const shuffleArray = <T,>(arr: T[]): T[] => {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    };

    const generateQuestions = useCallback(() => {
        if (filteredItems.length < 4) return;

        const shuffled = shuffleArray(filteredItems);
        const totalQuestions = Math.min(shuffled.length, 20);
        const selectedWords = shuffled.slice(0, totalQuestions);

        const generatedQuestions: Question[] = selectedWords.map((correctWord) => {
            const correctType = normalizeType(correctWord.Type);

            const sameTypePool = (itemsByType.get(correctType) ?? [])
                .filter(item => item.Word !== correctWord.Word);
            let distractorPool = shuffleArray(sameTypePool);

            if (distractorPool.length < 3) {
                const otherTypePool = dictionary.filter(
                    item => item.Word !== correctWord.Word && normalizeType(item.Type) !== correctType
                );
                distractorPool = [...distractorPool, ...shuffleArray(otherTypePool)];
            }

            const distractors = distractorPool.slice(0, 3);
            const options = shuffleArray([correctWord, ...distractors]);

            return { correctWord, options };
        });

        setQuestions(generatedQuestions);
        setCurrentQ(0);
        setScore(0);
        setSelectedAnswer(null);
        setShowResult(false);
        setGameFinished(false);
        setGameStarted(true);
    }, [filteredItems, dictionary, itemsByType]);

    const handleSelectAnswer = (word: string) => {
        if (showResult) return;
        setSelectedAnswer(word);
        setShowResult(true);
        if (word === questions[currentQ].correctWord.Word) {
            setScore(prev => prev + 1);
        }
    };

    const handleNext = () => {
        if (currentQ + 1 < questions.length) {
            setCurrentQ(prev => prev + 1);
            setSelectedAnswer(null);
            setShowResult(false);
        } else {
            setGameFinished(true);
        }
    };

    const speakWord = (word: string) => {
        speak(word, { language: 'en' });
    };

    const resetGame = () => {
        setGameStarted(false);
        setGameFinished(false);
        setQuestions([]);
        setCurrentQ(0);
        setSelectedAnswer(null);
        setShowResult(false);
        setScore(0);
    };

    if (!gameStarted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Game Select</h1>

                <div className="mb-6 w-full max-w-xs">
                    <label className="block text-gray-600 mb-2 text-sm font-medium">Space</label>
                    <div className="flex gap-2">
                        {spaceOptions.map(s => (
                            <button
                                key={s}
                                onClick={() => setSpace(s)}
                                className={`flex-1 py-2 px-4 rounded-xl font-medium transition-all ${space === s ? 'bg-white shadow-md font-bold text-gray-900' : 'bg-beige text-gray-600'}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mb-8 w-full max-w-xs">
                    <label className="block text-gray-600 mb-2 text-sm font-medium">Type</label>
                    <div className="flex flex-wrap gap-2 justify-center">
                        {typeOptions.map(t => (
                            <button
                                key={t}
                                onClick={() => setTypeFilter(t)}
                                className={`py-2 px-4 rounded-xl font-medium transition-all ${typeFilter === t ? 'bg-white shadow-md font-bold text-gray-900' : 'bg-beige text-gray-600'}`}
                            >
                                {typeDisplayLabels[t]}
                            </button>
                        ))}
                    </div>
                    <p className="text-gray-400 text-xs mt-2 text-center">
                        {loading ? 'Loading...' : `${filteredItems.length} words available`}
                    </p>
                </div>

                <button
                    onClick={generateQuestions}
                    disabled={filteredItems.length < 4 || loading}
                    className="bg-white shadow-md text-gray-900 py-3 px-8 rounded-xl font-bold text-lg disabled:opacity-50 transition-opacity"
                >
                    {loading ? 'Loading...' : 'Start Game'}
                </button>
            </div>
        );
    }

    if (gameFinished) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Game Over</h1>
                <div className="text-7xl font-bold text-gray-900 mb-2">
                    {score} / {questions.length}
                </div>
                <p className="text-gray-400 mb-8 text-lg">
                    {score === questions.length
                        ? 'Perfect!'
                        : score >= questions.length * 0.7
                            ? 'Great job!'
                            : score >= questions.length * 0.4
                                ? 'Good effort!'
                                : 'Keep practicing!'}
                </p>
                <div className="flex gap-4">
                    <button
                        onClick={resetGame}
                        className="inline-flex items-center gap-2 bg-beige text-gray-800 py-3 px-6 rounded-xl font-bold"
                    >
                        <RotateCcw className="w-4 h-4" /> Play Again
                    </button>
                    <button
                        onClick={resetGame}
                        className="bg-white shadow-md text-gray-900 py-3 px-6 rounded-xl font-bold"
                    >
                        Change Settings
                    </button>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentQ];
    if (!currentQuestion) return null;

    return (
        <div className="flex flex-col items-center min-h-screen p-6">
            <div className="w-full max-w-md mb-6">
                <div className="flex justify-between text-gray-400 text-sm mb-2">
                    <span>{currentQ + 1} / {questions.length}</span>
                    <span>{score} correct</span>
                </div>
                <div className="w-full bg-beige rounded-full h-2">
                    <div
                        className="bg-gray-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-md mb-8 text-center">
                <p className="text-gray-900 text-2xl font-semibold leading-relaxed">
                    {currentQuestion.correctWord.Meaning}
                </p>
                {currentQuestion.correctWord.Pronounce && (
                    <button
                        onClick={() => speakWord(currentQuestion.correctWord.Word)}
                        className="mt-4 inline-flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors text-sm"
                    >
                        <Volume2 className="w-4 h-4" /> {currentQuestion.correctWord.Pronounce}
                    </button>
                )}
            </div>

            <div className="w-full max-w-md space-y-3">
                {currentQuestion.options.map((option, i) => {
                    let btnStyle = 'bg-white hover:shadow-md';
                    if (showResult) {
                        if (option.Word === currentQuestion.correctWord.Word) {
                            btnStyle = 'bg-green-50 text-green-800';
                        } else if (option.Word === selectedAnswer) {
                            btnStyle = 'bg-red-50 text-red-800';
                        } else {
                            btnStyle = 'bg-white opacity-50';
                        }
                    }
                    return (
                        <button
                            key={i}
                            onClick={() => handleSelectAnswer(option.Word)}
                            disabled={showResult}
                            className={`w-full py-4 px-6 rounded-xl text-left font-medium text-gray-800 transition-all ${btnStyle}`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="shrink-0">
                                    <span className="text-gray-400 mr-2">{String.fromCharCode(65 + i)}.</span>
                                    {option.Word}
                                </span>
                                <span className="text-xs text-gray-400 truncate min-w-0 flex-1 text-right">
                                    {showResult ? option.Meaning : ''}
                                </span>
                                {showResult && option.Word === currentQuestion.correctWord.Word && (
                                    <span className="text-green-600 font-bold shrink-0 text-xs">Correct</span>
                                )}
                                {showResult && option.Word === selectedAnswer && option.Word !== currentQuestion.correctWord.Word && (
                                    <span className="text-red-600 font-bold shrink-0 text-xs">Wrong</span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            {showResult && (
                <button
                    onClick={handleNext}
                    className="mt-8 bg-white shadow-md text-gray-900 py-3 px-10 rounded-xl font-bold text-lg transition-colors"
                >
                    {currentQ + 1 < questions.length ? 'Next' : 'See Results'}
                </button>
            )}
        </div>
    );
};

export default GameSelectPage;