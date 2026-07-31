import { Router, Request, Response } from 'express'
import Database from 'better-sqlite3'
import { v4 as uuidv4 } from 'uuid'
import { Goal } from '../types'
import { SQL } from '../sql'
import { AnalyticsRepository } from '../analytics/analytics.repository'
import { recordCheckin } from '../engagement/checkin'
import {
  validate,
  requiredName,
  optionalName,
  positiveTargetAmount,
  validTargetDate,
  requiredUserId,
  optionalIcon,
} from '../middleware/validate'

/**
 * Helper: maps a raw SQLite row to a Goal object.
 * SQLite stores arrays as JSON strings, so we parse them back.
 */
function rowToGoal(row: Record<string, unknown>): Goal {
  return {
    id: row.id as string,
    name: row.name as string,
    targetAmount: row.targetAmount as number,
    targetDate: row.targetDate as string,
    balance: row.balance as number,
    created: row.created as string,
    accountId: (row.accountId as string) ?? null,
    transactionIds: row.transactionIds
      ? (JSON.parse(row.transactionIds as string) as string[])
      : null,
    tagIds: row.tagIds ? (JSON.parse(row.tagIds as string) as string[]) : null,
    icon: (row.icon as string) ?? null,
    userId: row.userId as string,
  }
}

// Use unknown for bind params since better-sqlite3 accepts any value type at runtime.
type BindParams = Record<string, unknown>

/** Serialise an array to a JSON string for SQLite storage, or return null. */
function serialiseArray(arr: string[] | null): string | null {
  return arr ? JSON.stringify(arr) : null
}

/**
 * Executes a prepared statement with the given parameters.
 */
function runStatement(db: Database.Database, sql: string, params: BindParams): void {
  db.prepare(sql).run(params)
}

export function createGoalsRouter(db: Database.Database): Router {
  const router = Router()
  const analyticsRepo = new AnalyticsRepository(db)

  // ── GET /api/Goal ─────────────────────────────────────────────────
  router.get('/', (_req: Request, res: Response) => {
    const rows = db.prepare(SQL.SELECT_ALL_GOALS).all() as Record<string, unknown>[]
    const goals = rows.map(rowToGoal)
    res.json(goals)
  })

  // ── GET /api/Goal/ForUser/:userId ─────────────────────────────────
  router.get('/ForUser/:userId', (req: Request, res: Response) => {
    const { userId } = req.params
    const rows = db
      .prepare(SQL.SELECT_GOALS_BY_USER)
      .all(userId) as Record<string, unknown>[]
    const goals = rows.map(rowToGoal)
    res.json(goals)
  })

  // ── GET /api/Goal/:id ─────────────────────────────────────────────
  router.get('/:id', (req: Request, res: Response) => {
    const { id } = req.params
    const row = db.prepare(SQL.SELECT_GOAL_BY_ID).get(id) as Record<string, unknown> | undefined

    if (!row) {
      res.status(404).json({ error: 'Goal not found' })
      return
    }

    res.json(rowToGoal(row))
  })

  // ── POST /api/Goal ────────────────────────────────────────────────
  router.post(
    '/',
    validate(requiredName, positiveTargetAmount, validTargetDate, requiredUserId),
    (req: Request, res: Response) => {
    const body = req.body ?? {}
    const id = uuidv4()
    const now = new Date().toISOString()

    const goal: Goal = {
      id,
      name: body.name ?? '',
      targetAmount: body.targetAmount ?? 0,
      targetDate: body.targetDate ?? now,
      balance: body.balance ?? 0,
      created: now,
      accountId: body.accountId ?? null,
      transactionIds: body.transactionIds ?? null,
      tagIds: body.tagIds ?? null,
      icon: body.icon ?? null,
      userId: body.userId ?? '',
    }

    runStatement(db, SQL.INSERT_GOAL, {
      id: goal.id,
      name: goal.name,
      targetAmount: goal.targetAmount,
      targetDate: goal.targetDate,
      balance: goal.balance,
      created: goal.created,
      accountId: goal.accountId,
      transactionIds: serialiseArray(goal.transactionIds),
      tagIds: serialiseArray(goal.tagIds),
      icon: goal.icon,
      userId: goal.userId,
    })

    // Track progress snapshot + activity
    analyticsRepo.recordProgressSnapshot(String(goal.id), Number(goal.balance))
    analyticsRepo.recordActivity(goal.id, 'GOAL_CREATED', {
      name: String(goal.name),
      targetAmount: Number(goal.targetAmount),
      icon: goal.icon as string | null,
    })
    recordCheckin(db, 'CREATE_GOAL')

    res.status(201).json(goal)
  })

  // ── PUT /api/Goal/:id ─────────────────────────────────────────────
  router.put(
    '/:id',
    validate(optionalName, positiveTargetAmount, validTargetDate, optionalIcon),
    (req: Request, res: Response) => {
    const { id } = req.params
    const existing = db.prepare('SELECT * FROM goals WHERE id = ?').get(id) as Record<string, unknown> | undefined

    if (!existing) {
      res.status(404).json({ error: 'Goal not found' })
      return
    }

    const body: Record<string, unknown> = req.body ?? {}

    const goal = {
      id,
      name: (body.name as string | undefined) ?? (existing.name as string),
      targetAmount: (body.targetAmount as number | undefined) ?? (existing.targetAmount as number),
      targetDate: (body.targetDate as string | undefined) ?? (existing.targetDate as string),
      balance: (body.balance as number | undefined) ?? (existing.balance as number),
      created: (body.created as string | undefined) ?? (existing.created as string),
      accountId: body.accountId !== undefined ? (body.accountId as string | null) : (existing.accountId as string | null),
      transactionIds: body.transactionIds !== undefined
        ? (body.transactionIds as string[] | null)
        : existing.transactionIds
          ? (JSON.parse(existing.transactionIds as string) as string[])
          : null,
      tagIds: body.tagIds !== undefined
        ? (body.tagIds as string[] | null)
        : existing.tagIds
          ? (JSON.parse(existing.tagIds as string) as string[])
          : null,
      icon: body.icon !== undefined ? (body.icon as string | null) : (existing.icon as string | null),
      userId: (body.userId as string | undefined) ?? (existing.userId as string),
    }

    runStatement(db, SQL.UPDATE_GOAL, {
      id: goal.id,
      name: goal.name,
      targetAmount: goal.targetAmount,
      targetDate: goal.targetDate,
      balance: goal.balance,
      created: goal.created,
      accountId: goal.accountId,
      transactionIds: serialiseArray(goal.transactionIds),
      tagIds: serialiseArray(goal.tagIds),
      icon: goal.icon,
      userId: goal.userId,
    })

    // Track progress snapshot + activity
    const oldBalance = Number(existing.balance)
    const newBalance = Number(goal.balance)
    if (newBalance !== oldBalance) {
      analyticsRepo.recordProgressSnapshot(String(id), newBalance)
      analyticsRepo.recordActivity(String(id), 'GOAL_UPDATED', {
        name: String(goal.name),
        oldBalance,
        newBalance,
        amountAdded: newBalance - oldBalance,
      })

      // Check if goal was just completed
      const existingTarget = Number(existing.targetAmount)
      const goalTarget = Number(goal.targetAmount)
      const wasComplete = oldBalance >= existingTarget
      const nowComplete = newBalance >= goalTarget
      if (!wasComplete && nowComplete) {
        analyticsRepo.recordActivity(String(id), 'GOAL_COMPLETED', {
          name: String(goal.name),
          balance: newBalance,
          targetAmount: goalTarget,
        })
      }

      // Check milestone reached
      const oldPct = oldBalance / existingTarget
      const newPct = newBalance / goalTarget
      const milestoneThresholds = [0.25, 0.5, 0.75]
      for (const threshold of milestoneThresholds) {
        if (oldPct < threshold && newPct >= threshold) {
          analyticsRepo.recordActivity(String(id), 'MILESTONE_REACHED', {
            name: String(goal.name),
            milestone: `${Math.round(threshold * 100)}%`,
          })
        }
      }
    }
    recordCheckin(db, 'UPDATE_GOAL')

    res.status(204).send()
  })

  // ── DELETE /api/Goal/:id ──────────────────────────────────────────
  router.delete('/:id', (req: Request, res: Response) => {
    const { id } = req.params
    const existing = db.prepare(SQL.SELECT_GOAL_ID).get(id) as Record<string, unknown> | undefined

    if (!existing) {
      res.status(404).json({ error: 'Goal not found' })
      return
    }

    // Record activity before deleting
    analyticsRepo.recordActivity(String(id), 'GOAL_DELETED', {
      name: String(existing.name),
    })

    db.prepare(SQL.DELETE_GOAL).run(id)
    res.status(204).send()
  })

  return router
}
