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

const hasDataProperty = (value: unknown): value is { data: unknown } => {
    return typeof value === 'object' && value !== null && 'data' in value;
};

/**
 * Cache-first, stale-while-revalidate thunk.
 *
 * 1. Always attempts to fetch fresh data from the API.
 * 2. If the fetch fails (rate limit, network error) AND cached data exists,
 *    returns the cached data as a graceful fallback — never shows error to user
 *    if we have something to show.
 * 3. The reducer skips loading state when cached data exists, so the user
 *    sees the old data immediately while new data loads in the background.
 */
export const fetchDictionaryData = createAsyncThunk(
    'dictionary/fetchData',
    async (space: string, { getState, rejectWithValue }) => {
        const state = getState() as RootState;
        const cachedSpace = state.dictionary.spaces[space];
        const hasCached = cachedSpace?.loaded === true;

        try {
            const response = await NotionService.getSpacedTimeItems(200, space);
            const responseData = hasDataProperty(response) ? response.data : undefined;

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
