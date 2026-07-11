'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft,
    Search,
    Volume2,
    ChevronDown,
    ChevronRight,
    Users,
    SlidersHorizontal,
    X,
} from 'lucide-react';
import { useDictionary } from '@/hooks/useDictionary';
import useTextToSpeech from '@/hooks/useTextToSpeech';
import { hasTypeTag, normalizeTypeTags } from '@/lib/type-tags';
import type { DictionaryItem } from '@/redux/features/dictionarySlice';

const spaceOptions = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'];

// ── Synonym clustering via Union-Find (connected components) ──
function buildSynonymGroups(items: DictionaryItem[]): DictionaryItem[][] {
    if (items.length === 0) return [];

    // Map from word text (lowercase + trim) to index in the items array
    const wordToIndex = new Map<string, number>();
    items.forEach((item, idx) => {
        wordToIndex.set(item.Word.toLowerCase().trim(), idx);
    });

    // Union-Find data structure
    const parent = items.map((_, i) => i);
    const rank = new Array(items.length).fill(0);

    const find = (x: number): number => {
        if (parent[x] !== x) parent[x] = find(parent[x]);
        return parent[x];
    };

    const union = (a: number, b: number) => {
        const ra = find(a);
        const rb = find(b);
        if (ra === rb) return;
        if (rank[ra] < rank[rb]) {
            parent[ra] = rb;
        } else if (rank[ra] > rank[rb]) {
            parent[rb] = ra;
        } else {
            parent[rb] = ra;
            rank[ra]++;
        }
    };

    // Build edges: connect words that appear in each other's Synonyms
    items.forEach((item, idx) => {
        if (!item.Synonyms || item.Synonyms.length === 0) return;
        for (const synonym of item.Synonyms) {
            const targetIdx = wordToIndex.get(synonym.toLowerCase().trim());
            if (targetIdx !== undefined && targetIdx !== idx) {
                union(idx, targetIdx);
            }
        }
    });

    // Collect connected components into groups
    const groupMap = new Map<number, DictionaryItem[]>();
    items.forEach((item, idx) => {
        const root = find(idx);
        if (!groupMap.has(root)) {
            groupMap.set(root, []);
        }
        groupMap.get(root)!.push(item);
    });

    return Array.from(groupMap.values());
}

// ── Synonym graph with BFS depth levels ──
interface SynonymNode {
    item: DictionaryItem;
    depth: number; // 0 = root, 1 = direct synonym, 2+ = indirect (synonym of synonym...)
    directSynonyms: string[]; // words in the group that are this item's direct synonyms
}

/**
 * Build a synonym graph for a group and compute BFS depth levels.
 * depth=0: the "root" word (first word in the group)
 * depth=1: direct synonyms of the root
 * depth=2: synonyms of synonyms, etc.
 */
function computeSynonymGraph(group: DictionaryItem[]): SynonymNode[] {
    if (group.length === 0) return [];
    if (group.length === 1) {
        return [{ item: group[0], depth: 0, directSynonyms: [] }];
    }

    // Build word→item lookup within the group (lowercased + trimmed)
    const wordToItem = new Map<string, DictionaryItem>();
    group.forEach((item) => wordToItem.set(item.Word.toLowerCase().trim(), item));

    // Build adjacency list: only links to other group members count
    const adj = new Map<string, string[]>();
    group.forEach((item) => {
        const key = item.Word.toLowerCase().trim();
        // Use Set to deduplicate (Notion data may have duplicate relation entries)
        const neighborSet = new Set<string>();
        if (item.Synonyms) {
            for (const syn of item.Synonyms) {
                const synKey = syn.toLowerCase().trim();
                if (wordToItem.has(synKey) && synKey !== key) {
                    neighborSet.add(synKey);
                }
            }
        }
        adj.set(key, Array.from(neighborSet));
    });

    // BFS from the first word in the group to assign depth levels
    const root = group[0].Word.toLowerCase().trim();
    const visited = new Set<string>();
    const depthMap = new Map<string, number>();
    const queue: Array<{ key: string; depth: number }> = [{ key: root, depth: 0 }];

    while (queue.length > 0) {
        const { key, depth } = queue.shift()!;
        if (visited.has(key)) continue;
        visited.add(key);
        depthMap.set(key, depth);

        for (const nKey of adj.get(key) ?? []) {
            if (!visited.has(nKey)) {
                queue.push({ key: nKey, depth: depth + 1 });
            }
        }
    }

    // Fallback: assign depth 0 to any unreachable nodes (shouldn't happen in a DSU group)
    group.forEach((item) => {
        const key = item.Word.toLowerCase().trim();
        if (!depthMap.has(key)) {
            depthMap.set(key, 0);
        }
    });

    // Build result with direct synonym lists
    return group.map((item) => {
        const key = item.Word.toLowerCase().trim();
        const direct = (adj.get(key) ?? []).map((k) => wordToItem.get(k)!.Word);
        return {
            item,
            depth: depthMap.get(key) ?? 0,
            directSynonyms: direct,
        };
    });
}

const BatchList: React.FC = () => {
    const router = useRouter();
    const { fetchData, dictionary, loading } = useDictionary();
    const { speak } = useTextToSpeech();

    // ── Filters ──
    const [space, setSpace] = useState('L1');
    const [search, setSearch] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('');

    // ── Collapsed state per group index ──
    const [collapsedGroups, setCollapsedGroups] = useState<Set<number>>(new Set());

    // ── Filter popup state ──
    const [showFilterPopup, setShowFilterPopup] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);

    // Click outside to close filter popup
    useEffect(() => {
        if (!showFilterPopup) return;
        const handleClick = (e: MouseEvent) => {
            if (
                filterRef.current &&
                !filterRef.current.contains(e.target as Node)
            ) {
                setShowFilterPopup(false);
            }
        };
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClick);
        }, 0);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClick);
        };
    }, [showFilterPopup]);

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

    // ── Synonym groups (recomputed whenever filters change) ──
    const groups = useMemo(() => buildSynonymGroups(filtered), [filtered]);

    // ── Synonym graph with BFS depths for each group ──
    const groupGraphs = useMemo(
        () => groups.map((group) => computeSynonymGraph(group)),
        [groups],
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

    const toggleGroup = useCallback((groupIndex: number) => {
        setCollapsedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(groupIndex)) {
                next.delete(groupIndex);
            } else {
                next.add(groupIndex);
            }
            return next;
        });
    }, []);

    useEffect(() => {
        fetchData(space);
    }, [fetchData, space]);

    // ── Stats for the group header ──
    const totalWithSynonyms = useMemo(
        () => filtered.filter((item) => item.Synonyms && item.Synonyms.length > 0).length,
        [filtered],
    );

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
                    Batch
                </span>
            </div>

            {/* ── Search bar + Filter button ── */}
            <div className="px-4 pb-3 max-w-xl mx-auto w-full">
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
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
                    {/* Filter button */}
                    <div className="relative shrink-0" ref={filterRef}>
                        <button
                            onClick={() => setShowFilterPopup((v) => !v)}
                            className={`p-2.5 rounded-xl transition-all
                                ${showFilterPopup || selectedType || selectedLevel
                                    ? 'bg-grey-dark text-white shadow-sm'
                                    : 'bg-beige/60 text-grey-dark hover:bg-beige'
                                }`}
                        >
                            <SlidersHorizontal size={18} />
                        </button>

                        {/* ── Filter popup ── */}
                        {showFilterPopup && (
                            <div
                                className="absolute right-0 top-full mt-1.5 z-50
                                            bg-white rounded-xl shadow-lg
                                           min-w-[220px] max-h-[70vh] overflow-y-auto
                                           animate-in fade-in slide-in-from-top-1 duration-150"
                            >
                                <div className="p-3 space-y-4">
                                    {/* Section: Space */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Space
                                            </span>
                                            <span className="text-[11px] text-gray-400 font-medium">
                                                {space}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {spaceOptions.map((level) => (
                                                <button
                                                    key={level}
                                                    onClick={() => {
                                                        setSpace(level);
                                                        setSearch('');
                                                        setSelectedType('');
                                                        setSelectedLevel('');
                                                        setCollapsedGroups(new Set());
                                                        setShowFilterPopup(false);
                                                    }}
                                                    className={`text-xs font-bold rounded-full px-3 py-1.5 transition-all
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

                                    {/* Section: Type */}
                                    {types.length > 0 && (
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                    Type
                                                </span>
                                                {selectedType && (
                                                    <button
                                                        onClick={() => setSelectedType('')}
                                                        className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
                                                    >
                                                        Clear
                                                    </button>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {types.map((type) => (
                                                    <button
                                                        key={type}
                                                        onClick={() => {
                                                            setSelectedType(
                                                                selectedType === type ? '' : type,
                                                            );
                                                        }}
                                                        className={`text-xs font-medium rounded-full px-3 py-1.5 transition-all
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

                                    {/* Section: Level */}
                                    {levels.length > 0 && (
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                    Level
                                                </span>
                                                {selectedLevel && (
                                                    <button
                                                        onClick={() => setSelectedLevel('')}
                                                        className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
                                                    >
                                                        Clear
                                                    </button>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                <button
                                                    onClick={() => setSelectedLevel(
                                                        selectedLevel === '__none__' ? '' : '__none__',
                                                    )}
                                                    className={`text-xs font-medium rounded-full px-3 py-1.5 transition-all
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
                                                        onClick={() => {
                                                            setSelectedLevel(
                                                                selectedLevel === level ? '' : level,
                                                            );
                                                        }}
                                                        className={`text-xs font-medium rounded-full px-3 py-1.5 transition-all
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
                                </div>

                                {/* Active filter summary footer */}
                                {(selectedType || selectedLevel) && (
                                    <div className="border-t border-gray-100 px-3 py-2">
                                        <button
                                            onClick={() => {
                                                setSelectedType('');
                                                setSelectedLevel('');
                                                setShowFilterPopup(false);
                                            }}
                                            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-500 transition-colors"
                                        >
                                            <X size={12} />
                                            Reset all filters
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Hint bar + Active filter tags ── */}
            <div className="px-4 pb-3 max-w-xl mx-auto w-full">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    {totalWithSynonyms > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <Users size={12} />
                            <span>
                                {totalWithSynonyms} word{totalWithSynonyms > 1 ? 's' : ''} with synonyms
                            </span>
                        </div>
                    )}

                    {/* Active filter badges */}
                    {selectedType && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-grey-dark bg-beige/60 rounded-full px-2 py-0.5 leading-none">
                            {selectedType}
                            <button
                                onClick={() => setSelectedType('')}
                                className="hover:text-red-400 transition-colors"
                            >
                                <X size={10} />
                            </button>
                        </span>
                    )}
                    {selectedLevel && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-grey-dark bg-beige/60 rounded-full px-2 py-0.5 leading-none">
                            {selectedLevel === '__none__' ? 'No Level' : selectedLevel}
                            <button
                                onClick={() => setSelectedLevel('')}
                                className="hover:text-red-400 transition-colors"
                            >
                                <X size={10} />
                            </button>
                        </span>
                    )}
                    <span className="text-xs text-gray-400 ml-auto">
                        {filtered.length} word{filtered.length !== 1 ? 's' : ''}
                        {groups.length > 0 && ` · ${groups.length} group${groups.length !== 1 ? 's' : ''}`}
                    </span>
                </div>
            </div>

            {/* ── Grouped word list ── */}
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
                    <div className="flex flex-col gap-3 max-w-xl mx-auto px-4 pb-4">
                        {groups.map((group, groupIdx) => {
                            const isCollapsed = collapsedGroups.has(groupIdx);
                            // Use pre-computed synonym graph with BFS depth levels
                            const graph = groupGraphs[groupIdx];

                            const groupMeaning =
                                group.find((item) => item.Meaning)?.Meaning || '';
                            const maxDepth = Math.max(
                                ...graph.map((n) => n.depth),
                                0,
                            );

                            // Collect all synonyms across the group
                            const allSynonyms = new Set<string>();
                            group.forEach((item) => {
                                if (item.Synonyms) {
                                    item.Synonyms.forEach((s) =>
                                        allSynonyms.add(s),
                                    );
                                }
                            });

                            return (
                                <div
                                    key={groupIdx}
                                    className="bg-white rounded-xl shadow-sm overflow-hidden
                                               transition-all duration-200"
                                >
                                    {/* ── Group header ── */}
                                    <button
                                        onClick={() => toggleGroup(groupIdx)}
                                        className="w-full flex items-center justify-between px-4 py-3
                                                   hover:bg-beige/20 active:bg-beige/30
                                                   transition-all duration-150"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            {/* Group size badge */}
                                            <span
                                                className={`text-xs font-bold rounded-full px-2 py-0.5 shrink-0 leading-none
                                                    ${group.length > 1
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-gray-100 text-gray-400'
                                                    }`}
                                            >
                                                {group.length}
                                            </span>

                                            {/* Group info */}
                                            <div className="min-w-0 text-left">
                                                {/* Depth range */}
                                                {group.length > 1 && maxDepth > 0 && (
                                                    <span className="text-[11px] text-blue-400 font-medium">
                                                        L1–L{maxDepth + 1}
                                                    </span>
                                                )}
                                                {/* Synonym preview chips (collapsed header) */}
                                                {isCollapsed && group.length > 1 && (
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {Array.from(allSynonyms)
                                                            .slice(0, 4)
                                                            .map((syn, idx) => (
                                                                <span
                                                                    key={`preview-${groupIdx}-${idx}`}
                                                                    className="text-[10px] text-gray-400 bg-gray-50
                                                                               rounded px-1.5 py-0.5 leading-none"
                                                                >
                                                                    {syn}
                                                                </span>
                                                            ))}
                                                        {allSynonyms.size > 4 && (
                                                            <span className="text-[10px] text-gray-400">
                                                                +{allSynonyms.size - 4} more
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {isCollapsed ? (
                                            <ChevronRight
                                                size={16}
                                                className="text-gray-400 shrink-0 transition-transform"
                                            />
                                        ) : (
                                            <ChevronDown
                                                size={16}
                                                className="text-gray-400 shrink-0 transition-transform"
                                            />
                                        )}
                                    </button>

                                    {/* ── Group items (sorted by depth) ── */}
                                    {!isCollapsed && (
                                        <div className="divide-y divide-gray-200/30 border-t border-gray-200/30">
                                            {graph
                                                .slice()
                                                .sort(
                                                    (a, b) =>
                                                        a.depth - b.depth ||
                                                        a.item.Word.localeCompare(
                                                            b.item.Word,
                                                        ),
                                                )
                                                .map((node, itemIdx) => {
                                                    const { item, depth, directSynonyms } =
                                                        node;
                                                    return (
                                                        <div
                                                            key={item.id || `${groupIdx}-${itemIdx}`}
                                                            className="px-4 py-2.5 flex flex-col gap-1
                                                                       hover:bg-beige/20 transition-all duration-150"
                                                        >
                                                            <div className="flex items-center gap-2.5">
                                                                {/* Depth badge */}
                                                                <span
                                                                    className={`text-[10px] font-bold rounded px-1.5 py-0.5 leading-none shrink-0
                                                                        ${
                                                                            depth === 0
                                                                                ? 'bg-purple-100 text-purple-700'
                                                                                : depth === 1
                                                                                  ? 'bg-blue-100 text-blue-700'
                                                                                  : depth === 2
                                                                                    ? 'bg-teal-100 text-teal-700'
                                                                                    : 'bg-orange-100 text-orange-700'
                                                                        }`}
                                                                >
                                                                    L{depth + 1}
                                                                </span>

                                                                {/* Word with TTS */}
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
                                                                {normalizeTypeTags(item.Type).map(
                                                                    (type) => (
                                                                        <span
                                                                            key={type}
                                                                            className="text-[11px] font-medium text-gray-400 bg-gray-100
                                                                                       rounded-md px-1.5 py-0.5 shrink-0 leading-none"
                                                                        >
                                                                            {type}
                                                                        </span>
                                                                    ),
                                                                )}

                                                                {/* Level badge */}
                                                                {item.Level && (
                                                                    <span className="text-[10px] font-medium text-gray-400 bg-gray-50
                                                                                       rounded px-1.5 py-0.5 shrink-0 leading-none">
                                                                        {item.Level}
                                                                    </span>
                                                                )}

                                                                {/* Meaning */}
                                                                <span className="text-sm text-gray-600 leading-snug truncate min-w-0">
                                                                    {item.Meaning}
                                                                </span>
                                                            </div>

                                                            {/* Direct synonym tags */}
                                                            {directSynonyms.length > 0 && (
                                                                <div className="flex flex-wrap gap-1 pl-[1.75rem]">
                                                                    <span className="text-[10px] text-gray-400 leading-none mt-0.5">
                                                                        →
                                                                    </span>
                                                                    {directSynonyms.map(
                                                                        (syn, synIdx) => (
                                                                            <span
                                                                                key={`${groupIdx}-${itemIdx}-${synIdx}`}
                                                                                className="text-[11px] font-medium text-blue-500 bg-blue-50
                                                                                           rounded-md px-1.5 py-0.5 leading-none"
                                                                            >
                                                                                {syn}
                                                                            </span>
                                                                        ),
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BatchList;
