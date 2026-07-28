import { Router, Request, Response } from 'express'
import Database from 'better-sqlite3'
import { v4 as uuidv4 } from 'uuid'
import { Goal } from '../types'
import { SQL } from '../sql'
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
 * This wrapper avoids conditional type inference issues with better-sqlite3's generic prepare().run().
 */
function runStatement(db: Database.Database, sql: string, params: BindParams): void {
  db.prepare(sql).run(params)
}

export function createGoalsRouter(db: Database.Database): Router {
  const router = Router()

  // ── GET /api/Goal ─────────────────────────────────────────────────
  // Returns all goals (mirrors GoalsService.GetAsync())
  router.get('/', (_req: Request, res: Response) => {
    const rows = db.prepare(SQL.SELECT_ALL_GOALS).all() as Record<string, unknown>[]
    const goals = rows.map(rowToGoal)
    res.json(goals)
  })

  // ── GET /api/Goal/ForUser/:userId ─────────────────────────────────
  // Returns goals filtered by user ID (from test spec: GetForUser route)
  router.get('/ForUser/:userId', (req: Request, res: Response) => {
    const { userId } = req.params
    const rows = db
      .prepare(SQL.SELECT_GOALS_BY_USER)
      .all(userId) as Record<string, unknown>[]
    const goals = rows.map(rowToGoal)
    res.json(goals)
  })

  // ── GET /api/Goal/:id ─────────────────────────────────────────────
  // Returns a single goal by ID, or 404 if not found
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
  // Creates a new goal, returns 201 with the created resource
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

    res.status(201).json(goal)
  })

  // ── PUT /api/Goal/:id ─────────────────────────────────────────────
  // Replaces an existing goal entirely. Returns 204 on success, 404 if not found.
  // Preserves the original ID (mirrors UpdateAsync behaviour).
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

    // Preserve the original ID (mirrors `updatedGoal.Id = goal.Id` in the C# controller)
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

    // Return 204 No Content (matches the C# controller)
    res.status(204).send()
  })

  // ── DELETE /api/Goal/:id ──────────────────────────────────────────
  // Deletes a goal by ID. Returns 204 on success, 404 if not found.
  router.delete('/:id', (req: Request, res: Response) => {
    const { id } = req.params
    const existing = db.prepare(SQL.SELECT_GOAL_ID).get(id)

    if (!existing) {
      res.status(404).json({ error: 'Goal not found' })
      return
    }

    db.prepare(SQL.DELETE_GOAL).run(id)
    res.status(204).send()
  })

  return router
}
