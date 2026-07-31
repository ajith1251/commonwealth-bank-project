/**
 * Engagement Repository — persistence for daily check-ins, the focus goal,
 * and unlocked achievements.
 */
import Database from 'better-sqlite3'
import { v4 as uuidv4 } from 'uuid'
import type { CheckinRow, CheckinType } from './engagement.types'
import type { Goal } from '../types'

interface CheckinDbRow {
  id: string
  user_id: string
  activity_date: string
  first_activity_at: string
  last_activity_at: string
  activity_count: number
  types: string
  created_at: string
}

function rowToCheckin(row: CheckinDbRow): CheckinRow {
  return {
    id: row.id,
    userId: row.user_id,
    activityDate: row.activity_date,
    firstActivityAt: row.first_activity_at,
    lastActivityAt: row.last_activity_at,
    activityCount: row.activity_count,
    types: JSON.parse(row.types || '[]') as CheckinType[],
    createdAt: row.created_at,
  }
}

export class EngagementRepository {
  constructor(private db: Database.Database) {}

  // ── Check-ins ────────────────────────────────────────────────────────

  findCheckin(userId: string, activityDate: string): CheckinRow | null {
    const row = this.db
      .prepare('SELECT * FROM user_checkins WHERE user_id = ? AND activity_date = ?')
      .get(userId, activityDate) as CheckinDbRow | undefined
    return row ? rowToCheckin(row) : null
  }

  insertCheckin(
    userId: string,
    activityDate: string,
    firstActivityAt: string,
    types: CheckinType[],
  ): void {
    this.db
      .prepare(
        `INSERT INTO user_checkins (id, user_id, activity_date, first_activity_at, last_activity_at, activity_count, types, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        uuidv4(),
        userId,
        activityDate,
        firstActivityAt,
        firstActivityAt,
        1,
        JSON.stringify(types),
        firstActivityAt,
      )
  }

  touchCheckin(userId: string, activityDate: string, lastActivityAt: string, types: CheckinType[]): void {
    this.db
      .prepare(
        `UPDATE user_checkins
         SET last_activity_at = ?, activity_count = activity_count + 1, types = ?
         WHERE user_id = ? AND activity_date = ?`,
      )
      .run(lastActivityAt, JSON.stringify(types), userId, activityDate)
  }

  /** All active date keys for a user (local YYYY-MM-DD). */
  listActiveDates(userId: string): string[] {
    const rows = this.db
      .prepare('SELECT activity_date FROM user_checkins WHERE user_id = ?')
      .all(userId) as Array<{ activity_date: string }>
    return rows.map((r) => r.activity_date)
  }

  /** Check-ins within an inclusive date range. */
  listCheckinsInRange(userId: string, startDate: string, endDate: string): CheckinRow[] {
    const rows = this.db
      .prepare(
        `SELECT * FROM user_checkins
         WHERE user_id = ? AND activity_date BETWEEN ? AND ?
         ORDER BY activity_date ASC`,
      )
      .all(userId, startDate, endDate) as CheckinDbRow[]
    return rows.map(rowToCheckin)
  }

  // ── Focus goal ───────────────────────────────────────────────────────

  getFocusGoalId(userId: string): string | null {
    const row = this.db
      .prepare('SELECT goal_id FROM focus_goal WHERE user_id = ?')
      .get(userId) as { goal_id: string } | undefined
    return row?.goal_id ?? null
  }

  setFocusGoal(userId: string, goalId: string, updatedAt: string): void {
    this.db
      .prepare(
        `INSERT INTO focus_goal (user_id, goal_id, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET goal_id = excluded.goal_id, updated_at = excluded.updated_at`,
      )
      .run(userId, goalId, updatedAt)
  }

  clearFocusGoal(userId: string): void {
    this.db.prepare('DELETE FROM focus_goal WHERE user_id = ?').run(userId)
  }

  // ── Achievements ─────────────────────────────────────────────────────

  listUnlockedCodes(userId: string): string[] {
    const rows = this.db
      .prepare('SELECT code FROM achievements WHERE user_id = ?')
      .all(userId) as Array<{ code: string }>
    return rows.map((r) => r.code)
  }

  /** Unlocked achievement codes with their unlock timestamps. */
  listUnlocked(userId: string): Array<[string, string]> {
    const rows = this.db
      .prepare('SELECT code, unlocked_at FROM achievements WHERE user_id = ?')
      .all(userId) as Array<{ code: string; unlocked_at: string }>
    return rows.map((r) => [r.code, r.unlocked_at])
  }

  unlockAchievement(userId: string, code: string, name: string, description: string, unlockedAt: string): void {
    this.db
      .prepare(
        `INSERT INTO achievements (id, user_id, code, name, description, unlocked_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(uuidv4(), userId, code, name, description, unlockedAt)
  }

  // ── Goals / activities queries used by the service ───────────────────

  listGoals(): Goal[] {
    const rows = this.db.prepare('SELECT * FROM goals').all() as Array<Record<string, unknown>>
    return rows.map((row) => ({
      id: row.id as string,
      name: row.name as string,
      targetAmount: row.targetAmount as number,
      targetDate: row.targetDate as string,
      balance: row.balance as number,
      created: row.created as string,
      accountId: (row.accountId as string | null) ?? null,
      transactionIds: row.transactionIds ? (JSON.parse(row.transactionIds as string) as string[]) : null,
      tagIds: row.tagIds ? (JSON.parse(row.tagIds as string) as string[]) : null,
      icon: (row.icon as string | null) ?? null,
      userId: row.userId as string,
    }))
  }

  getGoal(goalId: string): Goal | null {
    const row = this.db.prepare('SELECT * FROM goals WHERE id = ?').get(goalId) as
      | Record<string, unknown>
      | undefined
    if (!row) return null
    return {
      id: row.id as string,
      name: row.name as string,
      targetAmount: row.targetAmount as number,
      targetDate: row.targetDate as string,
      balance: row.balance as number,
      created: row.created as string,
      accountId: (row.accountId as string | null) ?? null,
      transactionIds: row.transactionIds ? (JSON.parse(row.transactionIds as string) as string[]) : null,
      tagIds: row.tagIds ? (JSON.parse(row.tagIds as string) as string[]) : null,
      icon: (row.icon as string | null) ?? null,
      userId: row.userId as string,
    }
  }

  /** Activity rows in a time window [startIso, endIso). */
  listActivitiesBetween(startIso: string, endIso: string): Array<{
    id: string
    goalId: string | null
    type: string
    metadata: Record<string, unknown> | null
    createdAt: string
  }> {
    const rows = this.db
      .prepare(
        `SELECT id, goal_id as goalId, type, metadata, created_at as createdAt
         FROM activities
         WHERE created_at >= ? AND created_at < ?
         ORDER BY created_at ASC`,
      )
      .all(startIso, endIso) as Array<{
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
      metadata: r.metadata ? (JSON.parse(r.metadata) as Record<string, unknown>) : null,
      createdAt: r.createdAt,
    }))
  }

  countReportsBetween(startIso: string, endIso: string): number {
    const row = this.db
      .prepare('SELECT COUNT(*) as c FROM reports WHERE generated_at >= ? AND generated_at < ?')
      .get(startIso, endIso) as { c: number }
    return row.c
  }

  newId(): string {
    return uuidv4()
  }
}
