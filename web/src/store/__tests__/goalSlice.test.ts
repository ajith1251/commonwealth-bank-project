import { describe, it, expect } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import goalReducer, {
  updateGoalRedux,
  selectGoalsMap,
  selectGoalIds,
  selectGoalsLoading,
  selectGoalsError,
} from '../goalSlice'
import type { Goal } from '../../types'
import type { RootState } from '../index'

// Helper to create a store with preloaded state
function createTestStore(preloadedGoals: Goal[] = []) {
  const store = configureStore({
    reducer: { goals: goalReducer },
    preloadedState: preloadedGoals.length > 0
      ? {
          goals: {
            goalsMap: Object.fromEntries(preloadedGoals.map((g) => [g.id, g])),
            goalIds: preloadedGoals.map((g) => g.id),
            loading: false,
            error: null,
          },
        }
      : undefined,
  })
  return store
}

const mockGoal: Goal = {
  id: 'goal-1',
  name: 'Test Goal',
  targetAmount: 5000,
  targetDate: '2026-12-31T00:00:00Z',
  balance: 1000,
  created: '2026-01-01T00:00:00Z',
  accountId: null,
  transactionIds: null,
  tagIds: null,
  icon: '🎯',
  userId: 'user-1',
}

const mockGoal2: Goal = {
  id: 'goal-2',
  name: 'Second Goal',
  targetAmount: 10000,
  targetDate: '2027-06-30T00:00:00Z',
  balance: 500,
  created: '2026-02-01T00:00:00Z',
  accountId: null,
  transactionIds: null,
  tagIds: null,
  icon: null,
  userId: 'user-1',
}

describe('goalSlice reducers', () => {
  describe('updateGoalRedux', () => {
    it('should add a goal to an empty map', () => {
      const store = createTestStore()
      store.dispatch(updateGoalRedux(mockGoal))

      const state = store.getState() as RootState
      expect(selectGoalsMap(state)).toEqual({ 'goal-1': mockGoal })
    })

    it('should update an existing goal in the map', () => {
      const store = createTestStore([mockGoal])
      const updated = { ...mockGoal, name: 'Updated Goal', icon: '🚀' }
      store.dispatch(updateGoalRedux(updated))

      const state = store.getState() as RootState
      expect(selectGoalsMap(state)['goal-1'].name).toBe('Updated Goal')
      expect(selectGoalsMap(state)['goal-1'].icon).toBe('🚀')
    })

    it('should not modify other goals when updating one', () => {
      const store = createTestStore([mockGoal, mockGoal2])
      const updated = { ...mockGoal, name: 'Updated' }
      store.dispatch(updateGoalRedux(updated))

      const state = store.getState() as RootState
      expect(selectGoalsMap(state)['goal-2'].name).toBe('Second Goal')
    })
  })

  describe('selectors', () => {
    it('should return empty map and ids from initial state', () => {
      const store = createTestStore()
      const state = store.getState() as RootState
      expect(selectGoalsMap(state)).toEqual({})
      expect(selectGoalIds(state)).toEqual([])
      expect(selectGoalsLoading(state)).toBe(false)
      expect(selectGoalsError(state)).toBeNull()
    })

    it('should return correct values with preloaded goals', () => {
      const store = createTestStore([mockGoal, mockGoal2])
      const state = store.getState() as RootState
      expect(selectGoalIds(state)).toEqual(['goal-1', 'goal-2'])
      expect(Object.keys(selectGoalsMap(state)).length).toBe(2)
    })
  })
})
