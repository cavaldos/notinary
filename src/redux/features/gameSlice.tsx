import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { DictionaryItem } from './dictionarySlice';

export interface Question {
    correctWord: DictionaryItem;
    options: DictionaryItem[];
}

export interface SavedGameData {
    questions: Question[];
    currentQ: number;
    score: number;
    wrongWords: DictionaryItem[];
    skippedWords: DictionaryItem[];
    gameMode: 'vi-en' | 'en-vi';
    questionCount: number;
    space: string;
    typeFilter: string;
    selectedLevels: string[];
    autoHideAnswers: boolean;
}

interface GameState {
    savedGame: SavedGameData | null;
}

const initialState: GameState = {
    savedGame: null,
};

const gameSlice = createSlice({
    name: 'game',
    initialState,
    reducers: {
        saveGame(state, action: PayloadAction<SavedGameData>) {
            state.savedGame = action.payload;
        },
        clearSavedGame(state) {
            state.savedGame = null;
        },
    },
});

export const { saveGame, clearSavedGame } = gameSlice.actions;
export default gameSlice.reducer;
