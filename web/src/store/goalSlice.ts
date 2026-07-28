import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { Goal } from '../types'
import {
  fetchGoalsForUser as fetchGoalsApi,
  deleteGoal as deleteGoalApi,
  createGoal as createGoalApi,
} from '../api/lib'
import { config } from '../config'
import type { RootState } from './index'

interface GoalState {
  /** Goals keyed by their ID for O(1) lookups */
  goalsMap: Record<string, Goal>
  /** Ordered list of goal IDs */
  goalIds: string[]
  /** Loading state */
  loading: boolean
  /** Error message, if any */
  error: string | null
}

const initialState: GoalState = {
  goalsMap: {},
  goalIds: [],
  loading: false,
  error: null,
}

// User ID from config (env variable with seed-data default)
const USER_ID = config.userId

export const fetchGoals = createAsyncThunk('goals/fetchGoals', async (_, { rejectWithValue }) => {
  const result = await fetchGoalsApi(USER_ID)
  if (result.error) {
    return rejectWithValue(result.error.message)
  }
  return result.data!
})

export const createGoal = createAsyncThunk('goals/createGoal', async (goal: Omit<Goal, 'id' | 'created'>, { rejectWithValue }) => {
  const result = await createGoalApi(goal)
  if (result.error) {
    return rejectWithValue(result.error.message)
  }
  return result.data!
})

export const removeGoal = createAsyncThunk('goals/removeGoal', async (goalId: string, { rejectWithValue }) => {
  const result = await deleteGoalApi(goalId)
  if (result.error) {
    return rejectWithValue(result.error.message)
  }
  return goalId
})

const goalSlice = createSlice({
  name: 'goals',
  initialState,
  reducers: {
    updateGoalRedux(state, action: PayloadAction<Goal>) {
      const goal = action.payload
      state.goalsMap[goal.id] = goal
    },
  },
  extraReducers: (builder) => {
    builder
      // ── Fetch ────────────────────────────────────────
      .addCase(fetchGoals.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchGoals.fulfilled, (state, action) => {
        const goals = action.payload
        state.goalsMap = {}
        state.goalIds = goals.map((g) => {
          state.goalsMap[g.id] = g
          return g.id
        })
        state.loading = false
      })
      .addCase(fetchGoals.rejected, (state, action) => {
        state.loading = false
        state.error = (action.payload as string) ?? action.error.message ?? 'Failed to fetch goals'
      })
      // ── Create ───────────────────────────────────────
      .addCase(createGoal.fulfilled, (state, action) => {
        const goal = action.payload
        state.goalsMap[goal.id] = goal
        state.goalIds.unshift(goal.id)
      })
      .addCase(createGoal.rejected, (state, action) => {
        state.error = (action.payload as string) ?? 'Failed to create goal'
      })
      // ── Delete ───────────────────────────────────────
      .addCase(removeGoal.fulfilled, (state, action) => {
        const goalId = action.payload
        delete state.goalsMap[goalId]
        state.goalIds = state.goalIds.filter((id) => id !== goalId)
      })
      .addCase(removeGoal.rejected, (state, action) => {
        state.error = (action.payload as string) ?? 'Failed to delete goal'
      })
  },
})

export const { updateGoalRedux } = goalSlice.actions
export const selectGoalsMap = (state: RootState): Record<string, Goal> => state.goals.goalsMap
export const selectGoalIds = (state: RootState): string[] => state.goals.goalIds
export const selectGoalsLoading = (state: RootState): boolean => state.goals.loading
export const selectGoalsError = (state: RootState): string | null => state.goals.error
export default goalSlice.reducer
