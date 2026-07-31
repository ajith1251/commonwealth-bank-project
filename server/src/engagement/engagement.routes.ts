/**
 * Engagement & Consistency routes.
 *   /api/engagement/checkin  — record a daily check-in (once per local day)
 *   /api/engagement/summary  — streak + activity summary
 *   /api/engagement/calendar — heatmap data (range in days)
 *   /api/engagement/weekly-review
 *   /api/engagement/actions  — next best actions (rule-based)
 *   /api/engagement/achievements
 *   /api/focus-goal          — focus goal selection
 */
import { Router, Request, Response } from 'express'
import type Database from 'better-sqlite3'
import { validate } from '../middleware/validate'
import { EngagementRepository } from './engagement.repository'
import { EngagementService } from './engagement.service'
import { CHECKIN_TYPES, DEFAULT_USER_ID, type CheckinType } from './engagement.types'

function validCheckinType(body: Record<string, unknown>): { field: string; message: string } | null {
  const type = body.type
  if (typeof type !== 'string' || !CHECKIN_TYPES.includes(type as CheckinType)) {
    return { field: 'type', message: 'type must be one of: ' + CHECKIN_TYPES.join(', ') }
  }
  return null
}

function validFocusGoalId(body: Record<string, unknown>): { field: string; message: string } | null {
  const goalId = body.goalId
  if (typeof goalId !== 'string' || goalId.trim() === '') {
    return { field: 'goalId', message: 'goalId must be a non-empty string' }
  }
  return null
}

export function createEngagementRouter(db: Database.Database): Router {
  const router = Router()
  const service = new EngagementService(new EngagementRepository(db), DEFAULT_USER_ID)

  // POST /api/engagement/checkin
  router.post('/checkin', validate(validCheckinType), (req: Request, res: Response) => {
    try {
      const result = service.recordCheckin(req.body.type as CheckinType)
      res.json(result)
    } catch (err) {
      console.error('[Engagement] checkin error:', err)
      res.status(500).json({ error: 'Failed to record check-in' })
    }
  })

  // GET /api/engagement/summary
  router.get('/summary', (_req: Request, res: Response) => {
    try {
      res.json(service.getSummary())
    } catch (err) {
      console.error('[Engagement] summary error:', err)
      res.status(500).json({ error: 'Failed to get engagement summary' })
    }
  })

  // GET /api/engagement/calendar?range=30|90|365
  router.get('/calendar', (req: Request, res: Response) => {
    try {
      const range = parseInt(String(req.query.range ?? '90'), 10)
      const days = Math.min(Math.max(isNaN(range) ? 90 : range, 1), 365)
      res.json(service.getCalendarWithCounts(days))
    } catch (err) {
      console.error('[Engagement] calendar error:', err)
      res.status(500).json({ error: 'Failed to get activity calendar' })
    }
  })

  // GET /api/engagement/weekly-review
  router.get('/weekly-review', (_req: Request, res: Response) => {
    try {
      res.json(service.getWeeklyReview())
    } catch (err) {
      console.error('[Engagement] weekly review error:', err)
      res.status(500).json({ error: 'Failed to get weekly review' })
    }
  })

  // GET /api/engagement/actions
  router.get('/actions', (_req: Request, res: Response) => {
    try {
      res.json({ actions: service.getNextBestActions() })
    } catch (err) {
      console.error('[Engagement] actions error:', err)
      res.status(500).json({ error: 'Failed to get next best actions' })
    }
  })

  // GET /api/engagement/achievements
  router.get('/achievements', (_req: Request, res: Response) => {
    try {
      service.evaluateAchievements() // lazy unlock
      res.json(service.getAchievements())
    } catch (err) {
      console.error('[Engagement] achievements error:', err)
      res.status(500).json({ error: 'Failed to get achievements' })
    }
  })

  return router
}

/** Focus-goal routes mounted at /api/focus-goal. */
export function createFocusGoalRouter(db: Database.Database): Router {
  const router = Router()
  const service = new EngagementService(new EngagementRepository(db), DEFAULT_USER_ID)

  // GET /api/focus-goal
  router.get('/', (_req: Request, res: Response) => {
    try {
      res.json({ goal: service.getFocusGoal() })
    } catch (err) {
      console.error('[Engagement] focus get error:', err)
      res.status(500).json({ error: 'Failed to get focus goal' })
    }
  })

  // PUT /api/focus-goal
  router.put('/', validate(validFocusGoalId), (req: Request, res: Response) => {
    try {
      const result = service.setFocusGoal(String(req.body.goalId))
      if (!result.ok) {
        res.status(400).json({ error: 'Focus goal must be an active, incomplete goal' })
        return
      }
      res.json({ goal: result.goal })
    } catch (err) {
      console.error('[Engagement] focus set error:', err)
      res.status(500).json({ error: 'Failed to set focus goal' })
    }
  })

  return router
}
