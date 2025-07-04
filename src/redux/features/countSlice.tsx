
import { createSlice } from '@reduxjs/toolkit';

interface CountState {
  value: number;
}

const initialState: CountState = {
  value: 0,
};

const countSlice = createSlice({
  name: 'count',
  initialState,
  reducers: {
	increment: (state) => {
	  state.value += 1;
	},
	decrement: (state) => {
	  state.value -= 1;
	},
	incrementByAmount: (state, action) => {
	  state.value += action.payload;
	},
  },
});

export const { increment, decrement, incrementByAmount } = countSlice.actions;
export default countSlice.reducer;
