'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDictionary } from '@/hooks/useDictionary';
import type { DictionaryItem } from '@/redux/features/dictionarySlice';
import { RotateCcw } from 'lucide-react';

type Question = {
    correctWord: DictionaryItem;
    options: DictionaryItem[];
};

const hideWordInExample = (example: string, word: string): React.ReactNode => {
    if (!word) return example;
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = example.split(regex);
    return parts.map((part, i) =>
        part.toLowerCase() === word.toLowerCase()
            ? <span key={i} className="font-bold text-gray-400">______</span>
            : part
    );
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

    const [space, setSpace] = useState('L2');
    const [typeFilter, setTypeFilter] = useState('all');
    const [gameStarted, setGameStarted] = useState(false);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQ, setCurrentQ] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [gameFinished, setGameFinished] = useState(false);
    const [wrongWords, setWrongWords] = useState<DictionaryItem[]>([]);
    const [questionCount, setQuestionCount] = useState(20);

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
        const totalQuestions = Math.min(shuffled.length, questionCount);
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
        setWrongWords([]);
        setSelectedAnswer(null);
        setShowResult(false);
        setGameFinished(false);
        setGameStarted(true);
    }, [filteredItems, dictionary, itemsByType, questionCount]);

    const handleSelectAnswer = (word: string) => {
        if (showResult) return;
        setSelectedAnswer(word);
        setShowResult(true);
        if (word === questions[currentQ].correctWord.Word) {
            setScore(prev => prev + 1);
        } else {
            setWrongWords(prev => [...prev, questions[currentQ].correctWord]);
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

    const replayGame = () => {
        setCurrentQ(0);
        setScore(0);
        setWrongWords([]);
        setSelectedAnswer(null);
        setShowResult(false);
        setGameFinished(false);
    };

    const resetGame = () => {
        setGameStarted(false);
        setGameFinished(false);
        setQuestions([]);
        setCurrentQ(0);
        setSelectedAnswer(null);
        setShowResult(false);
        setScore(0);
        setWrongWords([]);
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

                <div className="mb-8 w-full max-w-xs">
                    <label className="block text-gray-600 dark:text-gray-400 mb-2 text-sm font-medium">
                        Questions: <span className="font-bold text-gray-600 dark:text-gray-400">{questionCount}</span>
                    </label>
                    <input
                        type="range"
                        min={5}
                        max={Math.max(5, filteredItems.length)}
                        value={Math.min(questionCount, Math.max(5, filteredItems.length))}
                        onChange={e => setQuestionCount(Number(e.target.value))}
                        className="w-full h-2 bg-beige dark:bg-gray-400 rounded-full appearance-none cursor-pointer accent-gray-900 dark:accent-gray-100"
                    />
                    <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
                        <span>5</span>
                        <span>{filteredItems.length}</span>
                    </div>
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
            <div className="flex flex-col items-center min-h-screen p-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-4 mt-8">Game Over</h1>
                <div className="text-7xl font-bold text-gray-900 mb-2">
                    {score} / {questions.length}
                </div>
                <p className="text-gray-400 mb-8 text-lg">
                    {score === questions.length
                        ? 'Perfect!'
                        : score >= questions.length * 0.7
                            ? 'Great job!'
                            : score >= questions.length * 0.5
                                ? 'Good effort!'
                                : 'Keep practicing!'}
                </p>

                <div className="flex gap-4 mb-8">
                    <button
                        onClick={replayGame}
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

                {wrongWords.length > 0 && (
                    <div className="w-full max-w-md">
                        <h2 className="text-lg font-semibold text-gray-700 mb-3 text-center">
                            Words to review ({wrongWords.length})
                        </h2>
                        <div className="space-y-2">
                            {wrongWords.map((word, i) => (
                                <div
                                    key={i}
                                    className="flex items-center bg-white rounded-xl px-4 py-3 shadow-sm gap-2"
                                >
                                    <div className="flex items-center gap-2 shrink-0 min-w-0">
                                        <span className="text-red-400 font-bold shrink-0">&#10005;</span>
                                        <span className="font-semibold text-gray-900 truncate">{word.Word}</span>
                                        {word.Type && (
                                            <span className="text-xs text-purple-500 bg-purple-50 px-1.5 py-0.5 rounded shrink-0">
                                                {word.Type}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-gray-500 text-sm text-right ml-auto min-w-0 truncate">
                                        {word.Meaning}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {wrongWords.length === 0 && (
                    <p className="text-green-600 font-medium">No mistakes — you nailed it!</p>
                )}
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
                {/* Meaning - Vietnamese definition */}
                <p className="text-gray-900 text-2xl font-semibold leading-relaxed mb-4">
                    {currentQuestion.correctWord.Meaning}
                </p>

                {/* Level & Type badges (render independently) */}
                {(currentQuestion.correctWord.Level || currentQuestion.correctWord.Type) && (
                    <div className="flex items-center justify-center gap-2 mb-3">
                        {currentQuestion.correctWord.Level && (
                            <span className="inline-block px-2.5 py-0.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">
                                {currentQuestion.correctWord.Level}
                            </span>
                        )}
                        {currentQuestion.correctWord.Type && (
                            <span className="inline-block px-2.5 py-0.5 bg-purple-50 text-purple-600 text-xs font-medium rounded-full">
                                {currentQuestion.correctWord.Type}
                            </span>
                        )}
                    </div>
                )}

                {/* Synonyms */}
                {currentQuestion.correctWord.Synonyms && currentQuestion.correctWord.Synonyms.length > 0 && (
                    <div className="mb-3 text-xs text-gray-500">
                        <span className="font-medium text-gray-400">Synonyms: </span>
                        {currentQuestion.correctWord.Synonyms.join(', ')}
                    </div>
                )}

                {/* Example with hidden keyword */}
                {currentQuestion.correctWord.Example && (
                    <div className="mt-4 p-3.5 bg-gray-50 rounded-xl text-sm text-gray-600 italic text-left">
                        <span className="not-italic font-semibold text-gray-500 text-xs uppercase tracking-wider block mb-1.5">
                            Example
                        </span>
                        {hideWordInExample(currentQuestion.correctWord.Example, currentQuestion.correctWord.Word)}
                    </div>
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