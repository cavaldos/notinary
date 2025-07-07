
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import NotionService from '@/services/notion.service';

interface DictionaryItem {
    id: string;
    Word: string;
    Level: string;
    Type: string;
    Pronounce: string;
    Meaning: string;
}

interface DictionaryState {
    total: number;
    dictionary: DictionaryItem[];
    loading: boolean;
    error: string | null;
}

const initialState: DictionaryState = {
    total: 0,
    dictionary: [],
    loading: false,
    error: null,
};

// Async thunk để fetch dữ liệu từ API
export const fetchDictionaryData = createAsyncThunk(
    'dictionary/fetchData',
    async (space: string, { rejectWithValue }) => {
        try {
            const response: any = await NotionService.en.getSpacedTimeItems(200, space);
            if (response && response.data && Array.isArray(response.data)) {
                const filteredData = response.data.filter(
                    (item: any) => item.Word !== null && item.Word.trim() !== ''
                );
                return {
                    total: response.data.length,
                    dictionary: filteredData || []
                };
            } else {
                return {
                    total: 0,
                    dictionary: []
                };
            }
        } catch (error: any) {
            console.error('Error fetching vocabulary:', error);
            return rejectWithValue(error.message || 'Failed to fetch vocabulary');
        }
    }
);

const dictionarySlice = createSlice({
    name: 'dictionary',
    initialState,
    reducers: {
        clearDictionary: (state) => {
            state.dictionary = [];
            state.total = 0;
            state.error = null;
        },
        setDictionary: (state, action) => {
            state.dictionary = action.payload;
            state.total = action.payload.length;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchDictionaryData.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDictionaryData.fulfilled, (state, action) => {
                state.loading = false;
                state.total = action.payload.total;
                state.dictionary = action.payload.dictionary;
                state.error = null;
            })
            .addCase(fetchDictionaryData.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
                state.total = 0;
                state.dictionary = [];
            });
    },
});

export const { clearDictionary, setDictionary } = dictionarySlice.actions;
export default dictionarySlice.reducer;
