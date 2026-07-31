import axios from 'axios'
import { config } from '../config'
import type {
  ActivityEntry,
  DeadlineEntry,
  GoalHealthResult,
  GoalPerformanceEntry,
  PortfolioDistributionEntry,
} from './analytics'

const API_ROOT = config.apiRoot

// ── Types (mirror server/src/reports/report.types.ts) ─────────────────

export type ReportPeriod = '30d' | '90d' | '6m' | '12m' | 'all' | 'custom'

export type ReportSectionKey =
  | 'executiveSummary'
  | 'savingsGrowth'
  | 'goalPerformance'
  | 'distribution'
  | 'health'
  | 'deadlines'
  | 'goalDetails'
  | 'activities'
  | 'engagement'

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

export const ALL_SECTIONS: ReportSectionKey[] = [
  'executiveSummary',
  'savingsGrowth',
  'goalPerformance',
  'distribution',
  'health',
  'deadlines',
  'goalDetails',
  'activities',
  'engagement',
]

export interface ReportConfig {
  title?: string
  period: ReportPeriod
  startDate?: string | null
  endDate?: string | null
  goalIds: 'all' | string[]
  sections: ReportSectionKey[]
}

export interface ReportSummary {
  totalSaved: number
  totalTarget: number
  averageProgress: number
  activeGoals: number
  completedGoals: number
  totalGoals: number
}

export interface ReportPeriodRange {
  startDate: string | null
  endDate: string
  label: string
}

export interface ReportGoalDetail {
  goalId: string
  name: string
  icon: string | null
  balance: number
  targetAmount: number
  progressPercent: number
  targetDate: string
  status: GoalStatus
}

export interface ReportSavingsPoint {
  date: string
  amount: number
}

export type GoalStatus = 'completed' | 'on_track' | 'attention' | 'overdue'

/** Deadline row enriched with a derived status (mirrors backend). */
export interface ReportDeadline extends DeadlineEntry {
  status: GoalStatus
}

/** Consistency & engagement snapshot section (mirrors backend). */
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
  heatmap: Array<{ date: string; count: number }>
}

export interface ReportSnapshot {
  reportId: string | null
  title: string
  generatedAt: string
  period: ReportPeriodRange
  filters: {
    goalIds: 'all' | string[]
    goalCount: number
    sections: ReportSectionKey[]
  }
  summary: ReportSummary
  savingsTrend?: ReportSavingsPoint[]
  goalPerformance?: GoalPerformanceEntry[]
  distribution?: PortfolioDistributionEntry[]
  health?: GoalHealthResult
  deadlines?: ReportDeadline[]
  goalDetails?: ReportGoalDetail[]
  activities?: ActivityEntry[]
  engagement?: ReportEngagement
}

export interface ReportMeta {
  id: string
  title: string
  configuration: ReportConfig
  generatedAt: string
  updatedAt: string
  activeShares: number
  earliestExpiry: string | null
}

export interface ReportShare {
  id: string
  reportId: string
  createdAt: string
  expiresAt: string | null
  revokedAt: string | null
  viewCount: number
  active: boolean
}

export interface CreateShareResult {
  token: string
  link: string
  share: ReportShare
}

// ── API functions ─────────────────────────────────────────────────────

export async function previewReport(config: ReportConfig): Promise<ReportSnapshot> {
  const res = await axios.post<{ report: ReportSnapshot }>(`${API_ROOT}/api/reports/preview`, config)
  return res.data.report
}

export async function generateReport(config: ReportConfig): Promise<ReportSnapshot> {
  const res = await axios.post<{ report: ReportSnapshot }>(`${API_ROOT}/api/reports`, config)
  return res.data.report
}

export async function fetchReports(): Promise<ReportMeta[]> {
  const res = await axios.get<ReportMeta[]>(`${API_ROOT}/api/reports`)
  return res.data
}

export async function fetchReport(id: string): Promise<ReportSnapshot> {
  const res = await axios.get<{ report: ReportSnapshot }>(`${API_ROOT}/api/reports/${id}`)
  return res.data.report
}

/** Downloads the PDF and returns the filename derived from Content-Disposition. */
export async function downloadReportPdf(id: string): Promise<{ blob: Blob; filename: string }> {
  const res = await axios.get<Blob>(`${API_ROOT}/api/reports/${id}/pdf`, {
    responseType: 'blob',
  })
  return { blob: res.data, filename: parseFilename(res.headers['content-disposition']) }
}

export async function createShare(reportId: string, expiresInDays: number | null): Promise<CreateShareResult> {
  const res = await axios.post<CreateShareResult>(`${API_ROOT}/api/reports/${reportId}/share`, {
    expiresInDays,
  })
  return res.data
}

export async function fetchShares(reportId: string): Promise<ReportShare[]> {
  const res = await axios.get<ReportShare[]>(`${API_ROOT}/api/reports/${reportId}/shares`)
  return res.data
}

export async function revokeShare(reportId: string, shareId: string): Promise<void> {
  await axios.delete(`${API_ROOT}/api/reports/${reportId}/shares/${shareId}`)
}

export interface SharedReportResult {
  report: ReportSnapshot
  share: {
    expiresAt: string | null
    viewCount: number
    canDownload: boolean
  }
}

export async function fetchSharedReport(token: string): Promise<SharedReportResult> {
  const res = await axios.get<SharedReportResult>(`${API_ROOT}/api/shared/reports/${encodeURIComponent(token)}`)
  return res.data
}

export async function downloadSharedPdf(token: string): Promise<{ blob: Blob; filename: string }> {
  const res = await axios.get<Blob>(`${API_ROOT}/api/shared/reports/${encodeURIComponent(token)}/pdf`, {
    responseType: 'blob',
  })
  return { blob: res.data, filename: parseFilename(res.headers['content-disposition']) }
}

export function parseFilename(disposition: string | undefined): string {
  const match = /filename="?([^";]+)"?/.exec(disposition ?? '')
  return match?.[1] ?? 'financial-goals-report.pdf'
}
