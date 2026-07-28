import axios from 'axios'
import { Goal } from '../types'
import { config } from '../config'

const API_ROOT = config.apiRoot

export interface ApiError {
  message: string
  status?: number
  details?: Array<{ field: string; message: string }>
}

export interface ApiResult<T> {
  data: T | null
  error: ApiError | null
}

/**
 * Fetch all goals for a given user.
 */
export async function fetchGoalsForUser(userId: string): Promise<ApiResult<Goal[]>> {
  try {
    const response = await axios.get<Goal[]>(`${API_ROOT}/api/Goal/ForUser/${userId}`)
    return { data: response.data, error: null }
  } catch (err) {
    const error = parseAxiosError(err)
    console.error('[API] fetchGoalsForUser failed:', error.message)
    return { data: null, error }
  }
}

/**
 * Update a goal via PUT request.
 */
export async function updateGoal(goalId: string, updatedGoal: Goal): Promise<ApiResult<Goal>> {
  try {
    await axios.put(`${API_ROOT}/api/Goal/${goalId}`, updatedGoal)
    return { data: updatedGoal, error: null }
  } catch (err) {
    const error = parseAxiosError(err)
    console.error('[API] updateGoal failed:', error.message)
    return { data: null, error }
  }
}

/**
 * Create a new goal via POST request. Returns the created goal with server-assigned ID.
 */
export async function createGoal(goal: Omit<Goal, 'id' | 'created'>): Promise<ApiResult<Goal>> {
  try {
    const response = await axios.post<Goal>(`${API_ROOT}/api/Goal`, goal)
    return { data: response.data, error: null }
  } catch (err) {
    const error = parseAxiosError(err)
    console.error('[API] createGoal failed:', error.message)
    return { data: null, error }
  }
}

/**
 * Delete a goal via DELETE request.
 */
export async function deleteGoal(goalId: string): Promise<ApiResult<null>> {
  try {
    await axios.delete(`${API_ROOT}/api/Goal/${goalId}`)
    return { data: null, error: null }
  } catch (err) {
    const error = parseAxiosError(err)
    console.error('[API] deleteGoal failed:', error.message)
    return { data: null, error }
  }
}

/**
 * Parse an Axios error into a structured ApiError.
 */
function parseAxiosError(err: unknown): ApiError {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as Record<string, unknown> | undefined
    return {
      message: (data?.error as string) ?? err.message ?? 'Unknown error',
      status: err.response?.status,
      details: data?.details as Array<{ field: string; message: string }> | undefined,
    }
  }
  return { message: String(err) }
}
