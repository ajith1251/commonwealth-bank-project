import axios from 'axios'
import { config } from '../config'

const API_ROOT = config.apiRoot

export type CheckinType =
  | 'VIEW_DASHBOARD'
  | 'VIEW_GOAL'
  | 'VIEW_ANALYTICS'
  | 'CREATE_GOAL'
  | 'UPDATE_GOAL'
  | 'GENERATE_REPORT'

export interface WeekDayMarker {
  label: string
  active: boolean
}

export interface EngagementSummary {
  userId: string
  currentStreak: number
  longestStreak: number
  activeToday: boolean
  activeDaysThisWeek: number
  activeDaysThisMonth: number
  totalActiveDays: number
  weeklyConsistency: number
  lastActiveAt: string | null
  weekDays: WeekDayMarker[]
}

export interface CalendarDay {
  date: string
  count: number
}

export interface CalendarData {
  range: number
  days: CalendarDay[]
}

export interface WeekMetrics {
  activeDays: number
  goalsReviewed: number
  goalsUpdated: number
  progressAdded: number
  milestonesReached: number
  reportsGenerated: number
}

export interface WeeklyReview {
  current: WeekMetrics
  previous: WeekMetrics | null
  hasComparison: boolean
}

export interface NextBestAction {
  id: string
  type: 'deadline' | 'near_completion' | 'not_reviewed' | 'completed' | 'attention'
  goalId: string
  message: string
}

export interface Achievement {
  code: string
  name: string
  description: string
  unlocked: boolean
  unlockedAt: string | null
}

export interface CheckinResult {
  summary: EngagementSummary
  newlyUnlocked: Achievement[]
}

// ── API functions ─────────────────────────────────────────────────────

export async function recordCheckin(type: CheckinType): Promise<CheckinResult> {
  const res = await axios.post<CheckinResult>(`${API_ROOT}/api/engagement/checkin`, { type })
  return res.data
}

export async function fetchEngagementSummary(): Promise<EngagementSummary> {
  const res = await axios.get<EngagementSummary>(`${API_ROOT}/api/engagement/summary`)
  return res.data
}

export async function fetchEngagementCalendar(range: number): Promise<CalendarData> {
  const res = await axios.get<CalendarData>(`${API_ROOT}/api/engagement/calendar`, {
    params: { range },
  })
  return res.data
}

export async function fetchWeeklyReview(): Promise<WeeklyReview> {
  const res = await axios.get<WeeklyReview>(`${API_ROOT}/api/engagement/weekly-review`)
  return res.data
}

export async function fetchNextBestActions(): Promise<NextBestAction[]> {
  const res = await axios.get<{ actions: NextBestAction[] }>(`${API_ROOT}/api/engagement/actions`)
  return res.data.actions
}

export async function fetchAchievements(): Promise<Achievement[]> {
  const res = await axios.get<Achievement[]>(`${API_ROOT}/api/engagement/achievements`)
  return res.data
}

// ── Focus goal ────────────────────────────────────────────────────────

export async function fetchFocusGoal(): Promise<import('../types').Goal | null> {
  const res = await axios.get<{ goal: import('../types').Goal | null }>(`${API_ROOT}/api/focus-goal`)
  return res.data.goal
}

export async function setFocusGoal(goalId: string): Promise<import('../types').Goal | null> {
  const res = await axios.put<{ goal: import('../types').Goal | null }>(`${API_ROOT}/api/focus-goal`, {
    goalId,
  })
  return res.data.goal
}
