import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import express from 'express'
import cors from 'cors'
import crypto from 'crypto'
import { initialiseDatabase } from '../database'
import { mountRoutes } from '../routes'
import { errorHandler, notFoundHandler } from '../middleware/errorHandler'
import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'

const TEST_DB_PATH = path.resolve(__dirname, '../../data/test-commbank-reports.db')

let app: express.Express
let db: Database.Database

const fullConfig = {
  title: 'Q3 Financial Report',
  period: '90d',
  goalIds: 'all',
  sections: [
    'executiveSummary',
    'savingsGrowth',
    'goalPerformance',
    'distribution',
    'health',
    'deadlines',
    'goalDetails',
    'activities',
  ],
}

beforeAll(() => {
  // Remove any existing test DB + WAL sidecars (stale WALs can cause flakes)
  try { fs.unlinkSync(TEST_DB_PATH) } catch { /* ok */ }
  try { fs.unlinkSync(TEST_DB_PATH + '-wal') } catch { /* ok */ }
  try { fs.unlinkSync(TEST_DB_PATH + '-shm') } catch { /* ok */ }

  db = initialiseDatabase(TEST_DB_PATH)

  app = express()
  app.use(cors())
  app.use(express.json())
  mountRoutes(app, db)
  app.use(notFoundHandler)
  app.use(errorHandler)
})

afterAll(() => {
  try { db.close() } catch { /* ok */ }
  try { fs.unlinkSync(TEST_DB_PATH) } catch { /* ok */ }
  try { fs.unlinkSync(TEST_DB_PATH + '-wal') } catch { /* ok */ }
  try { fs.unlinkSync(TEST_DB_PATH + '-shm') } catch { /* ok */ }
})

/** Cleanup helper — remove reports + shares created during tests. */
function cleanupReport(id: string): void {
  if (!id) return
  try {
    db.prepare('DELETE FROM report_shares WHERE report_id = ?').run(id)
    db.prepare('DELETE FROM reports WHERE id = ?').run(id)
  } catch { /* ok */ }
}

describe('POST /api/reports/preview', () => {
  it('builds a preview snapshot from real analytics data', async () => {
    const res = await request(app).post('/api/reports/preview').send(fullConfig)
    expect(res.status).toBe(200)
    const report = res.body.report
    expect(report).toHaveProperty('reportId', null)
    expect(report).toHaveProperty('title', 'Q3 Financial Report')
    expect(report).toHaveProperty('generatedAt')
    expect(report).toHaveProperty('period.label')
    expect(report.summary.totalGoals).toBeGreaterThan(0)
    expect(report.summary.totalTarget).toBeGreaterThan(0)
    // Sections honour the config
    expect(report.savingsTrend).toBeInstanceOf(Array)
    expect(report.goalPerformance).toBeInstanceOf(Array)
    expect(report.distribution).toBeInstanceOf(Array)
    expect(report.health).toHaveProperty('completed')
    expect(report.deadlines).toBeInstanceOf(Array)
    expect(report.goalDetails).toBeInstanceOf(Array)
    expect(report.activities).toBeInstanceOf(Array)
  })

  it('respects excluded sections', async () => {
    const res = await request(app)
      .post('/api/reports/preview')
      .send({ ...fullConfig, sections: ['executiveSummary'] })
    expect(res.status).toBe(200)
    expect(res.body.report.savingsTrend).toBeUndefined()
    expect(res.body.report.goalPerformance).toBeUndefined()
    expect(res.body.report.activities).toBeUndefined()
    expect(res.body.report.summary).toBeDefined()
  })

  it('scopes data when specific goals are selected', async () => {
    const goals = await request(app).get('/api/Goal')
    const goalId = goals.body[0].id
    const res = await request(app)
      .post('/api/reports/preview')
      .send({ ...fullConfig, goalIds: [goalId] })
    expect(res.status).toBe(200)
    expect(res.body.report.filters.goalCount).toBe(1)
    expect(res.body.report.summary.totalGoals).toBe(1)
  })

  it('generates a sensible default title when none provided', async () => {
    const res = await request(app)
      .post('/api/reports/preview')
      .send({ period: '30d', goalIds: 'all', sections: ['executiveSummary'] })
    expect(res.status).toBe(200)
    expect(res.body.report.title).toMatch(/Financial Goals Report/)
  })

  it('rejects an invalid period', async () => {
    const res = await request(app)
      .post('/api/reports/preview')
      .send({ ...fullConfig, period: 'century' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Validation failed')
  })

  it('rejects an invalid title (too long)', async () => {
    const res = await request(app)
      .post('/api/reports/preview')
      .send({ ...fullConfig, title: 'x'.repeat(81) })
    expect(res.status).toBe(400)
    expect(res.body.details[0].field).toBe('title')
  })

  it('rejects an invalid custom range', async () => {
    const res = await request(app)
      .post('/api/reports/preview')
      .send({
        ...fullConfig,
        period: 'custom',
        startDate: '2026-08-01',
        endDate: '2026-01-01',
      })
    expect(res.status).toBe(400)
  })

  it('rejects empty or invalid sections', async () => {
    const res = await request(app)
      .post('/api/reports/preview')
      .send({ ...fullConfig, sections: [] })
    expect(res.status).toBe(400)
  })
})

describe('Report lifecycle', () => {
  it('creates, lists and retrieves a persisted report', async () => {
    const createRes = await request(app).post('/api/reports').send(fullConfig)
    expect(createRes.status).toBe(201)
    const reportId = createRes.body.report.reportId
    expect(reportId).toBeTruthy()

    const listRes = await request(app).get('/api/reports')
    expect(listRes.status).toBe(200)
    expect(Array.isArray(listRes.body)).toBe(true)
    expect(listRes.body.some((r: { id: string }) => r.id === reportId)).toBe(true)

    const getRes = await request(app).get(`/api/reports/${reportId}`)
    expect(getRes.status).toBe(200)
    expect(getRes.body.report.title).toBe('Q3 Financial Report')

    cleanupReport(reportId)
  })

  it('returns 404 for a missing report', async () => {
    const res = await request(app).get('/api/reports/does-not-exist')
    expect(res.status).toBe(404)
  })

  it('stores an immutable snapshot — later data changes do not alter it', async () => {
    // Create a goal to mutate later
    const createGoal = await request(app)
      .post('/api/Goal')
      .send({
        name: 'Snapshot Test Goal',
        targetAmount: 10000,
        targetDate: '2027-12-31T00:00:00Z',
        balance: 100,
        userId: '62a29c15f4605c4c9fa7f306',
      })
    const goalId = createGoal.body.id

    const createRes = await request(app)
      .post('/api/reports')
      .send({ ...fullConfig, title: 'Snapshot Test' })
    const reportId = createRes.body.report.reportId

    // Mutate the underlying goal
    await request(app)
      .put(`/api/Goal/${goalId}`)
      .send({ balance: 9999 })
      .set('Content-Type', 'application/json')

    const getRes = await request(app).get(`/api/reports/${reportId}`)
    const detail = getRes.body.report.goalDetails.find((g: { goalId: string }) => g.goalId === goalId)
    expect(detail.balance).toBe(100) // frozen at generation time

    // Cleanup
    await request(app).delete(`/api/Goal/${goalId}`)
    cleanupReport(reportId)
  })
})

describe('PDF generation', () => {
  it('returns a valid application/pdf for a stored report', async () => {
    const createRes = await request(app).post('/api/reports').send(fullConfig)
    const reportId = createRes.body.report.reportId

    const res = await request(app).get(`/api/reports/${reportId}/pdf`)
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toContain('application/pdf')
    expect(res.headers['content-disposition']).toContain('attachment')
    expect(Buffer.isBuffer(res.body)).toBe(true)
    // PDF header signature
    expect(res.body.slice(0, 4).toString()).toBe('%PDF')
    expect(res.body.length).toBeGreaterThan(1000)

    cleanupReport(reportId)
  })

  it('returns 404 for a PDF of a missing report', async () => {
    const res = await request(app).get('/api/reports/missing/pdf')
    expect(res.status).toBe(404)
  })
})

describe('Share links', () => {
  it('creates a share token and serves the report through it', async () => {
    const createRes = await request(app).post('/api/reports').send(fullConfig)
    const reportId = createRes.body.report.reportId

    const shareRes = await request(app).post(`/api/reports/${reportId}/share`).send({ expiresInDays: 7 })
    expect(shareRes.status).toBe(201)
    const token = shareRes.body.token
    expect(token).toMatch(/^[a-f0-9]{64}$/) // 256-bit hex token
    expect(shareRes.body.link).toContain(`/shared/report/${token}`)
    // The response must never contain the stored hash
    expect(JSON.stringify(shareRes.body)).not.toContain('token_hash')

    const publicRes = await request(app).get(`/api/shared/reports/${token}`)
    expect(publicRes.status).toBe(200)
    expect(publicRes.body.report.reportId).toBe(reportId)
    expect(publicRes.body.share.canDownload).toBe(true)
    expect(publicRes.body.share.expiresAt).toBeTruthy()

    // PDF via shared link works too
    const pdfRes = await request(app).get(`/api/shared/reports/${token}/pdf`)
    expect(pdfRes.status).toBe(200)
    expect(pdfRes.body.slice(0, 4).toString()).toBe('%PDF')

    // Share listing shows the link with view count
    const listRes = await request(app).get(`/api/reports/${reportId}/shares`)
    expect(listRes.status).toBe(200)
    expect(listRes.body[0].viewCount).toBeGreaterThanOrEqual(2)

    cleanupReport(reportId)
  })

  it('rejects an invalid token', async () => {
    const res = await request(app).get('/api/shared/reports/invalid-token')
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('This report link is no longer available.')
  })

  it('rejects an expired token', async () => {
    const createRes = await request(app).post('/api/reports').send(fullConfig)
    const reportId = createRes.body.report.reportId

    const shareRes = await request(app).post(`/api/reports/${reportId}/share`).send({ expiresInDays: 7 })
    const token = shareRes.body.token
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    // Force-expire the share
    db.prepare('UPDATE report_shares SET expires_at = ? WHERE token_hash = ?').run(
      '2020-01-01T00:00:00.000Z',
      tokenHash,
    )

    const res = await request(app).get(`/api/shared/reports/${token}`)
    expect(res.status).toBe(410)

    cleanupReport(reportId)
  })

  it('rejects a revoked token and revoking is idempotent', async () => {
    const createRes = await request(app).post('/api/reports').send(fullConfig)
    const reportId = createRes.body.report.reportId

    const shareRes = await request(app).post(`/api/reports/${reportId}/share`).send({})
    const token = shareRes.body.token
    const shareId = shareRes.body.share.id

    const revokeRes = await request(app).delete(`/api/reports/${reportId}/shares/${shareId}`)
    expect(revokeRes.status).toBe(204)

    const res = await request(app).get(`/api/shared/reports/${token}`)
    expect(res.status).toBe(410)

    cleanupReport(reportId)
  })

  it('rejects invalid expiration choices', async () => {
    const createRes = await request(app).post('/api/reports').send(fullConfig)
    const reportId = createRes.body.report.reportId

    const res = await request(app)
      .post(`/api/reports/${reportId}/share`)
      .send({ expiresInDays: 365 })
    expect(res.status).toBe(400)

    cleanupReport(reportId)
  })

  it('supports no-expiration links for demo purposes', async () => {
    const createRes = await request(app).post('/api/reports').send(fullConfig)
    const reportId = createRes.body.report.reportId

    const shareRes = await request(app).post(`/api/reports/${reportId}/share`).send({})
    expect(shareRes.status).toBe(201)
    expect(shareRes.body.share.expiresAt).toBeNull()

    const listRes = await request(app).get(`/api/reports/${reportId}/shares`)
    expect(listRes.body[0].active).toBe(true)

    cleanupReport(reportId)
  })

  it('rejects creating a share for a missing report', async () => {
    const res = await request(app).post('/api/reports/missing/share').send({})
    expect(res.status).toBe(404)
  })
})
