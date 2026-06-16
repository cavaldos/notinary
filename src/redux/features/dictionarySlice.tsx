import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import NotionService from '@/services/notion.service';
import type { RootState } from '@/redux/store';

export interface DictionaryItem {
    id: string;
    Word: string;
    Level: string;
    Type: string;
    Pronounce: string;
    Meaning: string;
    Example?: string;
    Synonyms?: string[];
    Genre?: string;
}

interface DictionarySpaceState {
    total: number;
    dictionary: DictionaryItem[];
    loading: boolean;
    error: string | null;
    loaded: boolean;
    /** Timestamp of last successful fetch (from API or cache fallback) */
    lastFetched: number | null;
}

interface DictionaryState {
    spaces: Record<string, DictionarySpaceState>;
    currentSpace: string | null;
}

const createEmptySpaceState = (): DictionarySpaceState => ({
    total: 0,
    dictionary: [],
    loading: false,
    error: null,
    loaded: false,
    lastFetched: null,
});

const initialState: DictionaryState = {
    spaces: {},
    currentSpace: null,
};

/**
 * How long to wait before re-fetching data from the API.
 * During this window, cached data is considered "fresh" and no API call is made.
 * Default: 5 minutes.
 */
const STALE_TIME_MS = 3 * 60 * 1000;

const isDictionaryItem = (item: unknown): item is DictionaryItem => {
    if (typeof item !== 'object' || item === null) {
        return false;
    }

    const value = item as Record<string, unknown>;
    return typeof value.Word === 'string' && value.Word.trim() !== '';
};

const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message;
    }

    return 'Failed to fetch vocabulary';
};

/**
 * Cache-first, stale-while-revalidate thunk.
 *
 * 1. If cached data exists and is fresh (within STALE_TIME_MS), skip API call entirely.
 * 2. If cached data exists but is stale, show it immediately, fetch fresh in background.
 * 3. If the fetch fails (rate limit, network error) AND cached data exists,
 *    returns cached data as fallback — never shows error if we have something.
 * 4. If no cache exists, show loading and fetch fresh data.
 */
export const fetchDictionaryData = createAsyncThunk(
    'dictionary/fetchData',
    async (space: string, { getState, rejectWithValue }) => {
        const state = getState() as RootState;
        const cachedSpace = state.dictionary.spaces[space];
        const hasCached = cachedSpace?.loaded === true;

        // ── Stale-time check: skip API call if data is fresh enough ──
        if (hasCached && cachedSpace?.lastFetched) {
            const age = Date.now() - cachedSpace.lastFetched;
            if (age < STALE_TIME_MS) {
                console.log(
                    `[dictionarySlice] Data for "${space}" is fresh (${Math.round(age / 1000)}s old), skipping fetch`
                );
                return {
                    space,
                    total: cachedSpace.total,
                    dictionary: cachedSpace.dictionary,
                    fromCache: true,
                    lastFetched: cachedSpace.lastFetched,
                };
            }
        }

        // ── Fetch fresh data from the API ──
        try {
            const response = await NotionService.getSpacedTimeItems(200, space);

            // The response should have a `data` array from the API route
            const responseData =
                response && typeof response === 'object' && 'data' in response
                    ? (response as { data: unknown }).data
                    : undefined;

            if (Array.isArray(responseData)) {
                const filteredData = responseData.filter(isDictionaryItem);

                return {
                    space,
                    total: responseData.length,
                    dictionary: filteredData,
                    fromCache: false,
                    lastFetched: Date.now(),
                };
            }

            return {
                space,
                total: 0,
                dictionary: [],
                fromCache: false,
                lastFetched: Date.now(),
            };
        } catch (error: unknown) {
            // Rate limited or network error — fall back to cache if available
            if (hasCached && cachedSpace) {
                console.warn(
                    `[dictionarySlice] API error for "${space}", using cached data:`,
                    getErrorMessage(error)
                );
                return {
                    space,
                    total: cachedSpace.total,
                    dictionary: cachedSpace.dictionary,
                    fromCache: true,
                    lastFetched: cachedSpace.lastFetched ?? Date.now(),
                };
            }

            return rejectWithValue({ space, message: getErrorMessage(error) });
        }
    }
);

const dictionarySlice = createSlice({
    name: 'dictionary',
    initialState,
    reducers: {
        clearDictionary: (state, action: PayloadAction<string | undefined>) => {
            if (action.payload) {
                delete state.spaces[action.payload];
                if (state.currentSpace === action.payload) {
                    state.currentSpace = null;
                }
                return;
            }

            state.spaces = {};
            state.currentSpace = null;
        },
        setCurrentSpace: (state, action: PayloadAction<string>) => {
            state.currentSpace = action.payload;
            state.spaces[action.payload] ??= createEmptySpaceState();
        },
        setDictionary: (state, action: PayloadAction<{ space: string; dictionary: DictionaryItem[] }>) => {
            state.currentSpace = action.payload.space;
            state.spaces[action.payload.space] = {
                total: action.payload.dictionary.length,
                dictionary: action.payload.dictionary,
                loading: false,
                error: null,
                loaded: true,
                lastFetched: Date.now(),
            };
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchDictionaryData.pending, (state, action) => {
                const space = action.meta.arg;
                state.currentSpace = space;
                state.spaces[space] ??= createEmptySpaceState();
                state.spaces[space].error = null;

                // Cache-first: don't show loading if we already have data,
                // let the user see stale data while fresh data loads.
                if (!state.spaces[space].loaded) {
                    state.spaces[space].loading = true;
                }
            })
            .addCase(fetchDictionaryData.fulfilled, (state, action) => {
                const { space, total, dictionary, lastFetched } = action.payload;
                state.currentSpace = space;
                state.spaces[space] = {
                    total,
                    dictionary,
                    loading: false,
                    error: null,
                    loaded: true,
                    lastFetched,
                };
            })
            .addCase(fetchDictionaryData.rejected, (state, action) => {
                const payload = action.payload as { space: string; message: string } | undefined;
                const space = payload?.space ?? action.meta.arg;

                // If we have cached data, keep it and suppress the error UI.
                // User never sees an error for data they already have.
                if (state.spaces[space]?.loaded) {
                    state.spaces[space].loading = false;
                    state.spaces[space].error = null;
                } else {
                    // No fallback available — show the error
                    state.spaces[space] = {
                        ...createEmptySpaceState(),
                        error: payload?.message ?? 'Failed to fetch vocabulary',
                    };
                }
            });
    },
});

export const { clearDictionary, setCurrentSpace, setDictionary } = dictionarySlice.actions;
export default dictionarySlice.reducer;
