import { createSlice } from '@reduxjs/toolkit'
import type { RootState } from './index'

export type ThemeMode = 'light' | 'dark'

interface ThemeState {
  mode: ThemeMode
}

const initialState: ThemeState = {
  mode: 'light',
}

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleMode(state) {
      state.mode = state.mode === 'light' ? 'dark' : 'light'
    },
    setMode(state, action) {
      state.mode = action.payload
    },
  },
})

export const { toggleMode, setMode } = themeSlice.actions
export const selectMode = (state: RootState): ThemeMode => state.theme.mode
export default themeSlice.reducer
