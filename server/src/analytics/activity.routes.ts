import { Router, Request, Response } from 'express'
import { AnalyticsRepository, AnalyticsService } from './analytics.routes'
import type Database from 'better-sqlite3'

export function createActivityRouter(db: Database.Database): Router {
  const router = Router()
  const repo = new AnalyticsRepository(db)
  const service = new AnalyticsService(repo)

  // GET /api/activity
  router.get('/', (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20
      const activities = service.getActivities(limit)
      res.json(activities)
    } catch (err) {
      console.error('[Activity] list error:', err)
      res.status(500).json({ error: 'Failed to get activities' })
    }
  })

  return router
}
