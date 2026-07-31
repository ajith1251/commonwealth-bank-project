import { AnalyticsRepository } from './analytics.repository'
import type {
  AnalyticsSummary,
  ProgressEntry,
  GoalPerformanceEntry,
  GoalHealthResult,
  DeadlineEntry,
  PortfolioDistribution,
  ActivityEntry,
} from './analytics.types'

export class AnalyticsService {
  constructor(private repo: AnalyticsRepository) {}

  getSummary(): AnalyticsSummary {
    return this.repo.getSummary()
  }

  getProgressHistory(goalId?: string, daysBack?: number): ProgressEntry[] {
    const data = this.repo.getProgressHistory(goalId, daysBack)
    // Deduplicate entries recorded on the same day for the same goal
    const seen = new Set<string>()
    return data.filter((entry) => {
      const date = entry.date.split('T')[0]
      const key = `${entry.goalId || 'all'}-${date}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  getGoalPerformance(): GoalPerformanceEntry[] {
    return this.repo.getGoalPerformance()
  }

  getGoalHealth(): GoalHealthResult {
    const entries = this.repo.getGoalHealth()
    return {
      completed: entries.filter((e) => e.status === 'completed'),
      onTrack: entries.filter((e) => e.status === 'on_track'),
      attention: entries.filter((e) => e.status === 'attention'),
      overdue: entries.filter((e) => e.status === 'overdue'),
    }
  }

  getDeadlines(): DeadlineEntry[] {
    return this.repo.getDeadlines()
  }

  getPortfolioDistribution(): PortfolioDistribution[] {
    return this.repo.getPortfolioDistribution()
  }

  getActivities(limit?: number): ActivityEntry[] {
    return this.repo.getActivities(limit)
  }

  recordProgressSnapshot(goalId: string, amount: number): void {
    this.repo.recordProgressSnapshot(goalId, amount)
  }

  recordActivity(
    goalId: string | null,
    type: string,
    metadata: Record<string, unknown> | null,
  ): void {
    this.repo.recordActivity(goalId, type, metadata)
  }
}
