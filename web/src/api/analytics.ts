import axios from 'axios'
import { config } from '../config'

const API_ROOT = config.apiRoot

export interface AnalyticsSummary {
  totalSaved: number
  totalTarget: number
  averageProgress: number
  activeGoals: number
  completedGoals: number
  totalGoals: number
}

export interface ProgressEntry {
  date: string
  amount: number
  goalId?: string
}

export interface GoalPerformanceEntry {
  goalId: string
  name: string
  icon: string | null
  targetAmount: number
  balance: number
  progressPercent: number
}

export interface GoalHealthEntry {
  goalId: string
  name: string
  icon: string | null
  progressPercent: number
  daysUntilDeadline: number
  status: 'completed' | 'on_track' | 'attention' | 'overdue'
}

export interface GoalHealthResult {
  completed: GoalHealthEntry[]
  onTrack: GoalHealthEntry[]
  attention: GoalHealthEntry[]
  overdue: GoalHealthEntry[]
}

export interface DeadlineEntry {
  goalId: string
  name: string
  icon: string | null
  targetDate: string
  daysUntilDeadline: number
  progressPercent: number
}

export interface PortfolioDistributionEntry {
  goalId: string
  name: string
  icon: string | null
  targetAmount: number
  percentage: number
}

export interface GoalAnalyticsResult {
  performance: GoalPerformanceEntry[]
  health: GoalHealthResult
  distribution: PortfolioDistributionEntry[]
  deadlines: DeadlineEntry[]
}

export interface ActivityEntry {
  id: string
  goalId: string | null
  type: string
  metadata: Record<string, unknown> | null
  createdAt: string
}

export async function fetchAnalyticsSummary(): Promise<AnalyticsSummary> {
  const response = await axios.get<AnalyticsSummary>(`${API_ROOT}/api/analytics/summary`)
  return response.data
}

export async function fetchProgressHistory(goalId?: string, daysBack?: number): Promise<ProgressEntry[]> {
  const params: Record<string, string> = {}
  if (goalId && goalId !== 'all') params.goalId = goalId
  if (daysBack) params.daysBack = String(daysBack)
  const response = await axios.get<ProgressEntry[]>(`${API_ROOT}/api/analytics/progress`, { params })
  return response.data
}

export async function fetchGoalAnalytics(): Promise<GoalAnalyticsResult> {
  const response = await axios.get<GoalAnalyticsResult>(`${API_ROOT}/api/analytics/goals`)
  return response.data
}

export async function fetchActivities(limit?: number): Promise<ActivityEntry[]> {
  const params: Record<string, string> = {}
  if (limit) params.limit = String(limit)
  const response = await axios.get<ActivityEntry[]>(`${API_ROOT}/api/activity`, { params })
  return response.data
}
