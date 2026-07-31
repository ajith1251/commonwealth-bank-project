/**
 * Engagement & Consistency — domain types.
 * Check-ins qualify a user for one daily streak entry; raw activity events
 * remain separate in the `activities` table.
 */
/** Demo single-user mode — matches the seeded user (no auth in this app). */
export const DEFAULT_USER_ID = '62a29c15f4605c4c9fa7f306'

/** Meaningful activities that can qualify a daily check-in. */
export const CHECKIN_TYPES = [
  'VIEW_DASHBOARD',
  'VIEW_GOAL',
  'VIEW_ANALYTICS',
  'CREATE_GOAL',
  'UPDATE_GOAL',
  'GENERATE_REPORT',
] as const
export type CheckinType = (typeof CHECKIN_TYPES)[number]

export interface CheckinRow {
  id: string
  userId: string
  activityDate: string // 'YYYY-MM-DD' local
  firstActivityAt: string
  lastActivityAt: string
  activityCount: number
  types: CheckinType[]
  createdAt: string
}

export interface WeekDayMarker {
  label: string // M, T, W, T, F, S, S
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
  weeklyConsistency: number // percent
  lastActiveAt: string | null
  weekDays: WeekDayMarker[]
}

export interface CalendarDay {
  date: string // 'YYYY-MM-DD'
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

export interface AchievementDefinition {
  code: string
  name: string
  description: string
}

export interface Achievement extends AchievementDefinition {
  unlocked: boolean
  unlockedAt: string | null
}

export interface CheckinResult {
  summary: EngagementSummary
  newlyUnlocked: Achievement[]
}

/** Achievements catalogue — deterministic, earned from real events. */
export const ACHIEVEMENTS: AchievementDefinition[] = [
  { code: 'first_goal', name: 'First Goal', description: 'Created your first goal' },
  { code: 'first_update', name: 'First Update', description: 'Updated a goal for the first time' },
  { code: 'streak_7', name: '7 Day Streak', description: 'Checked in for 7 consecutive days' },
  { code: 'streak_30', name: '30 Day Streak', description: 'Checked in for 30 consecutive days' },
  { code: 'halfway_there', name: 'Halfway There', description: 'Reached 50% progress on a goal' },
  { code: 'goal_completed', name: 'Goal Completed', description: 'Completed a financial goal' },
  { code: 'analytics_explorer', name: 'Analytics Explorer', description: 'Explored the analytics dashboard' },
  { code: 'first_report', name: 'First Report', description: 'Generated your first analytics report' },
]

