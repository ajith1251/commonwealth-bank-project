import { Router, Request, Response } from 'express'
import { AnalyticsService } from './analytics.service'
import { AnalyticsRepository } from './analytics.repository'
import type Database from 'better-sqlite3'

export function createAnalyticsRouter(db: Database.Database): Router {
  const router = Router()
  const repo = new AnalyticsRepository(db)
  const service = new AnalyticsService(repo)

  // GET /api/analytics/summary
  router.get('/summary', (_req: Request, res: Response) => {
    try {
      const summary = service.getSummary()
      res.json(summary)
    } catch (err) {
      console.error('[Analytics] summary error:', err)
      res.status(500).json({ error: 'Failed to get analytics summary' })
    }
  })

  // GET /api/analytics/progress
  router.get('/progress', (req: Request, res: Response) => {
    try {
      const goalId = req.query.goalId as string | undefined
      const daysBack = req.query.daysBack ? parseInt(req.query.daysBack as string, 10) : undefined
      const history = service.getProgressHistory(goalId, daysBack)
      res.json(history)
    } catch (err) {
      console.error('[Analytics] progress error:', err)
      res.status(500).json({ error: 'Failed to get progress history' })
    }
  })

  // GET /api/analytics/goals
  router.get('/goals', (_req: Request, res: Response) => {
    try {
      const performance = service.getGoalPerformance()
      const health = service.getGoalHealth()
      const distribution = service.getPortfolioDistribution()
      const deadlines = service.getDeadlines()
      res.json({ performance, health, distribution, deadlines })
    } catch (err) {
      console.error('[Analytics] goals error:', err)
      res.status(500).json({ error: 'Failed to get goal analytics' })
    }
  })

  // GET /api/analytics/health
  router.get('/health', (_req: Request, res: Response) => {
    try {
      const health = service.getGoalHealth()
      res.json(health)
    } catch (err) {
      console.error('[Analytics] health error:', err)
      res.status(500).json({ error: 'Failed to get goal health' })
    }
  })

  // GET /api/analytics/deadlines
  router.get('/deadlines', (_req: Request, res: Response) => {
    try {
      const deadlines = service.getDeadlines()
      res.json(deadlines)
    } catch (err) {
      console.error('[Analytics] deadlines error:', err)
      res.status(500).json({ error: 'Failed to get deadlines' })
    }
  })

  // GET /api/analytics/distribution
  router.get('/distribution', (_req: Request, res: Response) => {
    try {
      const distribution = service.getPortfolioDistribution()
      res.json(distribution)
    } catch (err) {
      console.error('[Analytics] distribution error:', err)
      res.status(500).json({ error: 'Failed to get distribution' })
    }
  })

  return router
}

export { AnalyticsRepository, AnalyticsService }
