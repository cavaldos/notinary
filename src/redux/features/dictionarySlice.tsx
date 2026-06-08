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

export const fetchDictionaryData = createAsyncThunk(
    'dictionary/fetchData',
    async (space: string, { getState, rejectWithValue }) => {
        const state = getState() as RootState;
        const cachedSpace = state.dictionary.spaces[space];

        if (cachedSpace?.loaded) {
            return {
                space,
                total: cachedSpace.total,
                dictionary: cachedSpace.dictionary,
                fromCache: true,
            };
        }

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
                };
            }

            return {
                space,
                total: 0,
                dictionary: [],
                fromCache: false,
            };
        } catch (error: unknown) {
            console.error('Error fetching vocabulary:', error);
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
            };
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchDictionaryData.pending, (state, action) => {
                const space = action.meta.arg;
                state.currentSpace = space;
                state.spaces[space] ??= createEmptySpaceState();
                state.spaces[space].loading = true;
                state.spaces[space].error = null;
            })
            .addCase(fetchDictionaryData.fulfilled, (state, action) => {
                const { space, total, dictionary } = action.payload;
                state.currentSpace = space;
                state.spaces[space] = {
                    total,
                    dictionary,
                    loading: false,
                    error: null,
                    loaded: true,
                };
            })
            .addCase(fetchDictionaryData.rejected, (state, action) => {
                const payload = action.payload as { space: string; message: string } | undefined;
                const space = payload?.space ?? action.meta.arg;
                state.currentSpace = space;
                state.spaces[space] = {
                    ...createEmptySpaceState(),
                    error: payload?.message ?? 'Failed to fetch vocabulary',
                };
            });
    },
});

export const { clearDictionary, setCurrentSpace, setDictionary } = dictionarySlice.actions;
export default dictionarySlice.reducer;
