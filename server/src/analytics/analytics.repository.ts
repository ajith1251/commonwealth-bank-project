import Database from 'better-sqlite3'
import { v4 as uuidv4 } from 'uuid'
import type {
  AnalyticsSummary,
  ProgressEntry,
  GoalPerformanceEntry,
  GoalHealthEntry,
  DeadlineEntry,
  PortfolioDistribution,
  ActivityEntry,
} from './analytics.types'

export class AnalyticsRepository {
  constructor(private db: Database.Database) {}

  getSummary(): AnalyticsSummary {
    const result = this.db
      .prepare(
        `SELECT
          COALESCE(SUM(balance), 0) as totalSaved,
          COALESCE(SUM(targetAmount), 0) as totalTarget,
          COUNT(*) as totalGoals,
          SUM(CASE WHEN balance >= targetAmount THEN 1 ELSE 0 END) as completedGoals
         FROM goals`,
      )
      .get() as {
      totalSaved: number
      totalTarget: number
      totalGoals: number
      completedGoals: number
    }

    const activeGoals = result.totalGoals - result.completedGoals
    const averageProgress =
      result.totalGoals > 0
        ? Math.round(
            (this.db
              .prepare(
                `SELECT AVG(
                  CASE WHEN targetAmount > 0
                    THEN CAST(MIN(balance, targetAmount) AS REAL) / targetAmount * 100
                    ELSE 0
                  END
                ) as avg_progress FROM goals`,
              )
              .get() as { avg_progress: number }).avg_progress,
          )
        : 0

    return {
      totalSaved: result.totalSaved,
      totalTarget: result.totalTarget,
      averageProgress,
      activeGoals,
      completedGoals: result.completedGoals,
      totalGoals: result.totalGoals,
    }
  }

  getProgressHistory(goalId?: string, daysBack?: number): ProgressEntry[] {
    let sql = `SELECT recorded_at as date, amount, goal_id as goalId FROM goal_progress_history`
    const conditions: string[] = []
    const params: unknown[] = []

    if (goalId && goalId !== 'all') {
      conditions.push('goal_id = ?')
      params.push(goalId)
    }
    if (daysBack && daysBack > 0) {
      conditions.push(`recorded_at >= datetime('now', ? || ' days')`)
      params.push(`-${daysBack}`)
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ')
    }
    sql += ' ORDER BY recorded_at ASC'

    return this.db.prepare(sql).all(...params) as ProgressEntry[]
  }

  getGoalPerformance(): GoalPerformanceEntry[] {
    return this.db
      .prepare(
        `SELECT
          id as goalId,
          name,
          icon,
          targetAmount,
          balance,
          CASE WHEN targetAmount > 0
            THEN CAST(MIN(balance, targetAmount) AS REAL) / targetAmount * 100
            ELSE 0
          END as progressPercent
         FROM goals
         ORDER BY progressPercent DESC`,
      )
      .all() as GoalPerformanceEntry[]
  }

  getGoalHealth(): GoalHealthEntry[] {
    const rows = this.db
      .prepare(
        `SELECT
          id as goalId,
          name,
          icon,
          targetAmount,
          balance,
          targetDate,
          CASE WHEN targetAmount > 0
            THEN CAST(MIN(balance, targetAmount) AS REAL) / targetAmount * 100
            ELSE 0
          END as progressPercent
         FROM goals`,
      )
      .all() as Array<{
      goalId: string
      name: string
      icon: string | null
      targetAmount: number
      balance: number
      targetDate: string
      progressPercent: number
    }>

    const now = new Date()
    return rows.map((r) => {
      const daysUntil = Math.ceil(
        (new Date(r.targetDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      )
      let status: 'completed' | 'on_track' | 'attention' | 'overdue'
      if (r.balance >= r.targetAmount) {
        status = 'completed'
      } else if (daysUntil < 0) {
        status = 'overdue'
      } else if (daysUntil <= 14 || (daysUntil <= 30 && r.progressPercent < 50)) {
        status = 'attention'
      } else {
        status = 'on_track'
      }

      return {
        goalId: r.goalId,
        name: r.name,
        icon: r.icon,
        progressPercent: Math.round(r.progressPercent),
        daysUntilDeadline: daysUntil,
        status,
      }
    })
  }

  getDeadlines(): DeadlineEntry[] {
    return this.db
      .prepare(
        `SELECT
          id as goalId,
          name,
          icon,
          targetDate,
          CASE WHEN targetAmount > 0
            THEN CAST(MIN(balance, targetAmount) AS REAL) / targetAmount * 100
            ELSE 0
          END as progressPercent
         FROM goals
         WHERE balance < targetAmount
         ORDER BY targetDate ASC`,
      )
      .all() as DeadlineEntry[]
  }

  getPortfolioDistribution(): PortfolioDistribution[] {
    const rows = this.db
      .prepare(
        `SELECT
          id as goalId,
          name,
          icon,
          targetAmount
         FROM goals
         ORDER BY targetAmount DESC`,
      )
      .all() as Array<{
      goalId: string
      name: string
      icon: string | null
      targetAmount: number
    }>

    const total = rows.reduce((s, r) => s + r.targetAmount, 0) || 1
    return rows.map((r) => ({
      goalId: r.goalId,
      name: r.name,
      icon: r.icon,
      targetAmount: r.targetAmount,
      percentage: Math.round((r.targetAmount / total) * 1000) / 10,
    }))
  }

  getActivities(limit: number = 20): ActivityEntry[] {
    const rows = this.db
      .prepare(
        `SELECT id, goal_id as goalId, type, metadata, created_at as createdAt
         FROM activities
         ORDER BY created_at DESC
         LIMIT ?`,
      )
      .all(limit) as Array<{
      id: string
      goalId: string | null
      type: string
      metadata: string | null
      createdAt: string
    }>

    return rows.map((r) => ({
      id: r.id,
      goalId: r.goalId,
      type: r.type,
      metadata: r.metadata ? JSON.parse(r.metadata) : null,
      createdAt: r.createdAt,
    }))
  }

  recordProgressSnapshot(goalId: string, amount: number): void {
    const id = uuidv4()
    const now = new Date().toISOString()
    this.db
      .prepare(
        `INSERT INTO goal_progress_history (id, goal_id, amount, recorded_at)
         VALUES (?, ?, ?, ?)`,
      )
      .run(id, goalId, amount, now)
  }

  recordActivity(
    goalId: string | null,
    type: string,
    metadata: Record<string, unknown> | null,
  ): void {
    const id = uuidv4()
    const now = new Date().toISOString()
    this.db
      .prepare(
        `INSERT INTO activities (id, goal_id, type, metadata, created_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(id, goalId, type, metadata ? JSON.stringify(metadata) : null, now)
  }
}
