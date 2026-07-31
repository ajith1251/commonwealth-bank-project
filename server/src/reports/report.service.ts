/**
 * Report Service — assembles an immutable ReportSnapshot from the existing
 * analytics services. No analytics calculations are duplicated in the UI.
 */
import crypto from 'crypto'
import { AnalyticsService } from '../analytics/analytics.service'
import { EngagementService } from '../engagement/engagement.service'
import { ReportRepository } from './report.repository'
import type {
  ReportConfig,
  ReportEngagement,
  ReportGoalDetail,
  ReportPeriodRange,
  ReportSavingsPoint,
  ReportSectionKey,
  ReportSnapshot,
} from './report.types'

/** Status for deadline rows — same rules as goal health, applied to incomplete goals. */
function deadlineStatus(progressPercent: number, targetDate: string): ReportGoalDetail['status'] {
  const daysUntil = Math.ceil(
    (new Date(targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  )
  if (daysUntil < 0) return 'overdue'
  if (daysUntil <= 14 || (daysUntil <= 30 && progressPercent < 50)) return 'attention'
  return 'on_track'
}

const PRESET_DAYS: Record<string, number> = {
  '30d': 30,
  '90d': 90,
  '6m': 182,
  '12m': 365,
}

function formatPeriodDate(date: Date): string {
  return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** "Financial Goals Report — July 2026" style default titles. */
export function defaultReportTitle(endDate: string): string {
  const d = new Date(endDate)
  const month = d.toLocaleDateString('en-US', { month: 'long' })
  return `Financial Goals Report — ${month} ${d.getFullYear()}`
}

function computeStatus(
  balance: number,
  targetAmount: number,
  targetDate: string,
  progressPercent: number,
): ReportGoalDetail['status'] {
  const daysUntil = Math.ceil(
    (new Date(targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  )
  if (balance >= targetAmount) return 'completed'
  if (daysUntil < 0) return 'overdue'
  if (daysUntil <= 14 || (daysUntil <= 30 && progressPercent < 50)) return 'attention'
  return 'on_track'
}

export class ReportService {
  constructor(
    private repo: ReportRepository,
    private analytics: AnalyticsService,
    private engagement?: EngagementService,
  ) {}

  /** Assembles a snapshot from real analytics data (never hardcoded). */
  assembleSnapshot(config: ReportConfig, reportId: string | null): ReportSnapshot {
    const now = new Date()

    // ── Period ────────────────────────────────────────────────────────
    const period = this.resolvePeriod(config, now)

    // ── Goals (scope) ────────────────────────────────────────────────
    // Full goal rows come from the goals table (includes targetDate).
    const detailRows = this.repo
      .getGoalDetailRows(config.goalIds)
      .map((row) => {
        const progressPercent =
          row.targetAmount > 0
            ? Math.round((Math.min(row.balance, row.targetAmount) / row.targetAmount) * 100)
            : 0
        return {
          ...row,
          progressPercent,
          status: computeStatus(row.balance, row.targetAmount, row.targetDate, progressPercent),
        }
      })
      .sort((a, b) => b.progressPercent - a.progressPercent)
    const goalCount = detailRows.length
    const goalDetails = detailRows

    // ── Summary ──────────────────────────────────────────────────────
    const totalSaved = detailRows.reduce((s, g) => s + g.balance, 0)
    const totalTarget = detailRows.reduce((s, g) => s + g.targetAmount, 0)
    const completedGoals = detailRows.filter((g) => g.status === 'completed').length
    const averageProgress =
      detailRows.length > 0
        ? Math.round(
            detailRows.reduce((s, g) => s + Math.min(g.progressPercent, 100), 0) /
              detailRows.length,
          )
        : 0

    const sections = new Set<ReportSectionKey>(config.sections)
    const snapshot: ReportSnapshot = {
      reportId,
      title: config.title && config.title.trim() ? config.title.trim() : defaultReportTitle(period.endDate),
      generatedAt: now.toISOString(),
      period,
      filters: { goalIds: config.goalIds, goalCount, sections: config.sections },
      summary: {
        totalSaved,
        totalTarget,
        averageProgress,
        activeGoals: detailRows.length - completedGoals,
        completedGoals,
        totalGoals: detailRows.length,
      },
    }

    // ── Savings growth (summed across goals per day) ──────────────────
    if (sections.has('savingsGrowth')) {
      const history = this.analytics.getProgressHistory(undefined, PRESET_DAYS[config.period])
      const byDate = new Map<string, number>()
      for (const entry of history) {
        if (config.goalIds !== 'all' && !config.goalIds.includes(entry.goalId ?? '')) continue
        const date = entry.date.split('T')[0]
        if (period.startDate && date < period.startDate.split('T')[0]) continue
        if (date > period.endDate.split('T')[0]) continue
        byDate.set(date, (byDate.get(date) ?? 0) + entry.amount)
      }
      const trend: ReportSavingsPoint[] = Array.from(byDate.entries())
        .map(([date, amount]) => ({ date, amount: Math.round(amount * 100) / 100 }))
        .sort((a, b) => a.date.localeCompare(b.date))
      snapshot.savingsTrend = trend
    }

    // ── Goal performance ─────────────────────────────────────────────
    if (sections.has('goalPerformance')) {
      snapshot.goalPerformance = goalDetails
    }

    // ── Portfolio distribution ───────────────────────────────────────
    if (sections.has('distribution')) {
      const distribution = this.analytics
        .getPortfolioDistribution()
        .filter((d) => config.goalIds === 'all' || config.goalIds.includes(d.goalId))
      // Recompute percentages for the scoped set.
      const total = distribution.reduce((s, d) => s + d.targetAmount, 0) || 1
      snapshot.distribution = distribution.map((d) => ({
        ...d,
        percentage: Math.round((d.targetAmount / total) * 1000) / 10,
      }))
    }

    // ── Goal health ──────────────────────────────────────────────────
    if (sections.has('health')) {
      const health = this.analytics.getGoalHealth()
      snapshot.health = {
        completed: health.completed.filter((h) => config.goalIds === 'all' || config.goalIds.includes(h.goalId)),
        onTrack: health.onTrack.filter((h) => config.goalIds === 'all' || config.goalIds.includes(h.goalId)),
        attention: health.attention.filter((h) => config.goalIds === 'all' || config.goalIds.includes(h.goalId)),
        overdue: health.overdue.filter((h) => config.goalIds === 'all' || config.goalIds.includes(h.goalId)),
      }
    }

    // ── Deadlines ────────────────────────────────────────────────────
    if (sections.has('deadlines')) {
      snapshot.deadlines = this.analytics
        .getDeadlines()
        .filter((d) => config.goalIds === 'all' || config.goalIds.includes(d.goalId))
        .map((d) => ({ ...d, status: deadlineStatus(d.progressPercent, d.targetDate) }))
    }

    // ── Goal details table ───────────────────────────────────────────
    if (sections.has('goalDetails')) {
      snapshot.goalDetails = detailRows
    }

    // ── Activity summary ─────────────────────────────────────────────
    if (sections.has('activities')) {
      const activities = this.analytics
        .getActivities(50)
        .filter((a) => config.goalIds === 'all' || (a.goalId && config.goalIds.includes(a.goalId)))
        .filter((a) => {
          if (!period.startDate) return true
          return new Date(a.createdAt).getTime() >= new Date(period.startDate).getTime()
        })
        .slice(0, 10)
      snapshot.activities = activities
    }

    // ── Consistency & engagement ────────────────────────────────────
    if (sections.has('engagement')) {
      snapshot.engagement = this.assembleEngagement()
    }

    return snapshot
  }

  /** Engagement snapshot from the real engagement service (real check-ins). */
  private assembleEngagement(): ReportEngagement {
    if (!this.engagement) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        activeDays: 0,
        activeDaysThisWeek: 0,
        weeklyConsistency: 0,
        activeToday: false,
        goalsReviewed: 0,
        goalsUpdated: 0,
        progressAdded: 0,
        milestonesReached: 0,
        reportsGenerated: 0,
        heatmap: [],
      }
    }
    const summary = this.engagement.getSummary()
    const weekly = this.engagement.getWeeklyReview()
    const calendar = this.engagement.getCalendarWithCounts(30)
    return {
      currentStreak: summary.currentStreak,
      longestStreak: summary.longestStreak,
      activeDays: summary.totalActiveDays,
      activeDaysThisWeek: summary.activeDaysThisWeek,
      weeklyConsistency: summary.weeklyConsistency,
      activeToday: summary.activeToday,
      goalsReviewed: weekly.current.goalsReviewed,
      goalsUpdated: weekly.current.goalsUpdated,
      progressAdded: weekly.current.progressAdded,
      milestonesReached: weekly.current.milestonesReached,
      reportsGenerated: weekly.current.reportsGenerated,
      heatmap: calendar.days.slice(-30),
    }
  }

  private resolvePeriod(config: ReportConfig, now: Date): ReportPeriodRange {
    if (config.period === 'custom' && config.startDate && config.endDate) {
      const start = new Date(config.startDate)
      const end = new Date(config.endDate)
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end) {
        return {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          label: `${formatPeriodDate(start)} — ${formatPeriodDate(end)}`,
        }
      }
    }
    if (config.period === 'all') {
      return {
        startDate: null,
        endDate: now.toISOString(),
        label: `All available data — ${formatPeriodDate(now)}`,
      }
    }
    const days = PRESET_DAYS[config.period] ?? 30
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    return {
      startDate: start.toISOString(),
      endDate: now.toISOString(),
      label: `${formatPeriodDate(start)} — ${formatPeriodDate(now)}`,
    }
  }

  // ── Persistence ─────────────────────────────────────────────────────

  generate(config: ReportConfig): ReportSnapshot {
    const reportId = this.repo.newId()
    const snapshot = this.assembleSnapshot(config, reportId)
    this.repo.insertReport(reportId, snapshot.title, config, snapshot, snapshot.generatedAt)
    return snapshot
  }

  getReport(id: string): ReportSnapshot | null {
    return this.repo.findReport(id)
  }

  listReports() {
    return this.repo.listReports()
  }

  // ── Sharing ─────────────────────────────────────────────────────────

  createShare(reportId: string, expiresInDays: number | null) {
    if (!this.repo.hasReport(reportId)) return null
    const token = crypto.randomBytes(32).toString('hex')
    const tokenHash = this.hashToken(token)
    const now = new Date()
    const expiresAt =
      expiresInDays && expiresInDays > 0
        ? new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null
    const shareId = this.repo.newId()
    this.repo.insertShare(shareId, reportId, tokenHash, now.toISOString(), expiresAt)
    return { token, shareId }
  }

  listShares(reportId: string) {
    if (!this.repo.hasReport(reportId)) return null
    return this.repo.listSharesByReport(reportId)
  }

  revokeShare(reportId: string, shareId: string): boolean {
    const share = this.repo.findShareById(shareId)
    if (!share || share.reportId !== reportId) return false
    if (share.revokedAt) return true // idempotent
    this.repo.revokeShare(shareId, new Date().toISOString())
    return true
  }

  /**
   * Resolves a share token. Returns 'ok' with the share + report,
   * or an error code ('not_found' | 'expired' | 'revoked') for the UI.
   */
  resolveShareToken(
    token: string,
  ): { status: 'ok'; share: import('./report.types').ReportShare; snapshot: ReportSnapshot } | { status: 'expired' | 'revoked' | 'not_found' } {
    if (!token || typeof token !== 'string') return { status: 'not_found' }
    const share = this.repo.findShareByTokenHash(this.hashToken(token))
    if (!share) return { status: 'not_found' }
    if (share.revokedAt) return { status: 'revoked' }
    if (share.expiresAt && new Date(share.expiresAt).getTime() <= Date.now()) {
      return { status: 'expired' }
    }
    const snapshot = this.repo.findReport(share.reportId)
    if (!snapshot) return { status: 'not_found' }
    return { status: 'ok', share, snapshot }
  }

  recordShareView(shareId: string): void {
    this.repo.incrementViewCount(shareId)
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex')
  }
}
