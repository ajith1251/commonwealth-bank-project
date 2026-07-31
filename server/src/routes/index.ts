import { Express } from 'express'
import Database from 'better-sqlite3'
import { createGoalsRouter } from './goals'
import { createAnalyticsRouter } from '../analytics/analytics.routes'
import { createActivityRouter } from '../analytics/activity.routes'
import { createReportRouter, createSharedReportRouter } from '../reports/report.routes'
import {
  createEngagementRouter,
  createFocusGoalRouter,
} from '../engagement/engagement.routes'

/**
 * Mount all API routes onto the Express application.
 */
export function mountRoutes(app: Express, db: Database.Database): void {
  app.use('/api/Goal', createGoalsRouter(db))
  app.use('/api/analytics', createAnalyticsRouter(db))
  app.use('/api/activity', createActivityRouter(db))
  app.use('/api/reports', createReportRouter(db))
  app.use('/api/shared/reports', createSharedReportRouter(db))
  app.use('/api/engagement', createEngagementRouter(db))
  app.use('/api/focus-goal', createFocusGoalRouter(db))

  // Health-check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })
}
