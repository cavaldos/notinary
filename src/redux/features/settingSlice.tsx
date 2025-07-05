
import { createSlice } from '@reduxjs/toolkit';


interface SettingState {
    language: string;
    theme: string;
    speed?: number;

}

const initialState: SettingState = {
    language: 'en',
    theme: 'light',
    speed: 1, // Default speed
    

};

const settingSlice = createSlice({
    name: 'setting',
    initialState,
    reducers: {
        setLanguage: (state, action) => {
            state.language = action.payload;
        },
        setTheme: (state, action) => {
            state.theme = action.payload;
        },
        setSpeed: (state, action) => {
            state.speed = action.payload;
        },

    },
});

export const { setLanguage, setTheme, setSpeed } = settingSlice.actions;


export default settingSlice.reducer;
