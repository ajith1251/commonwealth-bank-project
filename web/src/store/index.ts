import { configureStore } from '@reduxjs/toolkit'
import goalReducer from './goalSlice'
import themeReducer from './themeSlice'

export const store = configureStore({
  reducer: {
    goals: goalReducer,
    theme: themeReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// Re-export theme selectors for convenience
export { selectMode, toggleMode, setMode } from './themeSlice'
export type { ThemeMode } from './themeSlice'
