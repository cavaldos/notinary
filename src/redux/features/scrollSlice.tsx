import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ScrollState {
  /** Lưu index cuộn hiện tại theo từng space (L1, L2, ...) */
  positions: Record<string, number>;
}

const initialState: ScrollState = {
  positions: {},
};

const scrollSlice = createSlice({
  name: 'scroll',
  initialState,
  reducers: {
    saveScrollPosition: (
      state,
      action: PayloadAction<{ space: string; index: number }>,
    ) => {
      const { space, index } = action.payload;
      state.positions[space] = index;
    },
    clearScrollPosition: (state, action: PayloadAction<string>) => {
      delete state.positions[action.payload];
    },
    clearAllScrollPositions: (state) => {
      state.positions = {};
    },
  },
});

export const { saveScrollPosition, clearScrollPosition, clearAllScrollPositions } =
  scrollSlice.actions;
export default scrollSlice.reducer;
