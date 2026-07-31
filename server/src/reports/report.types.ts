/**
 * Report Center — domain types.
 * The report representation is independent from the UI: a normalized,
 * immutable snapshot that drives web preview, PDF generation and sharing.
 */
import type {
  ProgressEntry,
  GoalPerformanceEntry,
  PortfolioDistribution,
  GoalHealthResult,
  DeadlineEntry,
  ActivityEntry,
} from '../analytics/analytics.types'

export const REPORT_PERIODS = ['30d', '90d', '6m', '12m', 'all', 'custom'] as const
export type ReportPeriod = (typeof REPORT_PERIODS)[number]

export const REPORT_SECTION_KEYS = [
  'executiveSummary',
  'savingsGrowth',
  'goalPerformance',
  'distribution',
  'health',
  'deadlines',
  'goalDetails',
  'activities',
  'engagement',
] as const
export type ReportSectionKey = (typeof REPORT_SECTION_KEYS)[number]

/** Section labels shown in the Report Builder UI. */
export const REPORT_SECTION_LABELS: Record<ReportSectionKey, string> = {
  executiveSummary: 'Executive Summary',
  savingsGrowth: 'Savings Growth',
  goalPerformance: 'Goal Performance',
  distribution: 'Portfolio Distribution',
  health: 'Goal Health',
  deadlines: 'Deadline Analysis',
  goalDetails: 'Goal Details',
  activities: 'Activity Summary',
  engagement: 'Consistency & Engagement',
}

/** User-provided report configuration (validated server-side). */
export interface ReportConfig {
  title?: string
  period: ReportPeriod
  /** ISO dates — required when period === 'custom'. */
  startDate?: string | null
  endDate?: string | null
  /** 'all' or a list of goal IDs to scope the report. */
  goalIds: 'all' | string[]
  sections: ReportSectionKey[]
}

export interface ReportPeriodRange {
  startDate: string | null
  endDate: string
  label: string
}

export interface ReportSummary {
  totalSaved: number
  totalTarget: number
  averageProgress: number
  activeGoals: number
  completedGoals: number
  totalGoals: number
}

export interface ReportGoalDetail {
  goalId: string
  name: string
  icon: string | null
  balance: number
  targetAmount: number
  progressPercent: number
  targetDate: string
  status: 'completed' | 'on_track' | 'attention' | 'overdue'
}

export interface ReportSavingsPoint {
  date: string
  amount: number
}

/** Deadline row enriched with a derived status so preview + PDF agree. */
export interface ReportDeadline extends DeadlineEntry {
  status: 'completed' | 'on_track' | 'attention' | 'overdue'
}

/** Consistency & engagement snapshot section — derived from real check-ins. */
export interface ReportEngagement {
  currentStreak: number
  longestStreak: number
  activeDays: number
  activeDaysThisWeek: number
  weeklyConsistency: number
  activeToday: boolean
  goalsReviewed: number
  goalsUpdated: number
  progressAdded: number
  milestonesReached: number
  reportsGenerated: number
  /** Last-30-day heatmap summary (date → activity count). */
  heatmap: Array<{ date: string; count: number }>
}

/**
 * Immutable report snapshot — the single normalized representation
 * used by web preview, PDF generation and the public shared page.
 */
export interface ReportSnapshot {
  reportId: string | null
  title: string
  generatedAt: string
  period: ReportPeriodRange
  filters: {
    goalIds: 'all' | string[]
    goalCount: number
    /** Effective section list — drives preview + PDF so excluded sections never render. */
    sections: ReportSectionKey[]
  }
  summary: ReportSummary
  savingsTrend?: ReportSavingsPoint[]
  goalPerformance?: GoalPerformanceEntry[]
  distribution?: PortfolioDistribution[]
  health?: GoalHealthResult
  deadlines?: ReportDeadline[]
  goalDetails?: ReportGoalDetail[]
  activities?: ActivityEntry[]
  engagement?: ReportEngagement
}

/** Report metadata for history listings. */
export interface ReportMeta {
  id: string
  title: string
  configuration: ReportConfig
  generatedAt: string
  updatedAt: string
  /** Derived share status for the history UI. */
  activeShares: number
  earliestExpiry: string | null
}

/** Share row (token never persisted — only its SHA-256 hash). */
export interface ReportShare {
  id: string
  reportId: string
  createdAt: string
  expiresAt: string | null
  revokedAt: string | null
  viewCount: number
  active: boolean
}

/** Response returned when a new share link is created (token included once). */
export interface ReportShareResult extends ReportShare {
  token: string
  link: string
}

/** Valid expiration choices in days; null = no expiration. */
export const SHARE_EXPIRATION_DAYS = [1, 7, 30] as const
export type ShareExpirationDays = (typeof SHARE_EXPIRATION_DAYS)[number] | null
