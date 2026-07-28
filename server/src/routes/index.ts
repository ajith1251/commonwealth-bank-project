import { Express } from 'express'
import Database from 'better-sqlite3'
import { createGoalsRouter } from './goals'

/**
 * Mount all API routes onto the Express application.
 */
export function mountRoutes(app: Express, db: Database.Database): void {
  app.use('/api/Goal', createGoalsRouter(db))

  // Health-check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })
}
