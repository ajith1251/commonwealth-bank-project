import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import express from 'express'
import cors from 'cors'
import { initialiseDatabase } from '../database'
import { mountRoutes } from '../routes'
import { errorHandler, notFoundHandler } from '../middleware/errorHandler'
import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'

const TEST_DB_PATH = path.resolve(__dirname, '../../data/test-commbank.db')

let app: express.Express
let db: Database.Database

beforeAll(() => {
  // Remove any existing test DB
  try { fs.unlinkSync(TEST_DB_PATH) } catch { /* ok */ }

  // Create a fresh app with the test database
  db = initialiseDatabase()

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

describe('GET /api/health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('status', 'ok')
    expect(res.body).toHaveProperty('timestamp')
  })
})

describe('GET /api/Goal', () => {
  it('returns an array of goals', async () => {
    const res = await request(app).get('/api/Goal')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })
})

describe('GET /api/Goal/ForUser/:userId', () => {
  it('returns goals for the seed user', async () => {
    const res = await request(app).get('/api/Goal/ForUser/62a29c15f4605c4c9fa7f306')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThanOrEqual(4)
  })

  it('returns an empty array for an unknown user', async () => {
    const res = await request(app).get('/api/Goal/ForUser/000000000000000000000000')
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })
})

describe('GET /api/Goal/:id', () => {
  it('returns a goal by ID', async () => {
    // Get all goals first
    const all = await request(app).get('/api/Goal')
    if (all.body.length > 0) {
      const goalId = all.body[0].id
      const res = await request(app).get(`/api/Goal/${goalId}`)
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('id', goalId)
      expect(res.body).toHaveProperty('name')
      expect(res.body).toHaveProperty('targetAmount')
      expect(res.body).toHaveProperty('icon')
    }
  })

  it('returns 404 for a non-existent goal', async () => {
    const res = await request(app).get('/api/Goal/nonexistent-id')
    expect(res.status).toBe(404)
    expect(res.body).toHaveProperty('error')
  })
})

describe('POST /api/Goal', () => {
  it('creates a new goal with valid data', async () => {
    const newGoal = {
      name: 'Test Goal',
      targetAmount: 5000,
      targetDate: '2026-12-31T00:00:00Z',
      userId: '62a29c15f4605c4c9fa7f306',
    }

    const res = await request(app)
      .post('/api/Goal')
      .send(newGoal)
      .set('Content-Type', 'application/json')

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body).toHaveProperty('name', 'Test Goal')
    expect(res.body).toHaveProperty('targetAmount', 5000)
  })

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/Goal')
      .send({ targetAmount: 5000, userId: '62a29c15f4605c4c9fa7f306' })
      .set('Content-Type', 'application/json')

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error', 'Validation failed')
  })

  it('returns 400 when userId is missing', async () => {
    const res = await request(app)
      .post('/api/Goal')
      .send({ name: 'No User Goal', targetAmount: 1000 })
      .set('Content-Type', 'application/json')

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error', 'Validation failed')
  })
})

describe('PUT /api/Goal/:id', () => {
  it('updates an existing goal', async () => {
    // Get a goal to update
    const all = await request(app).get('/api/Goal')
    if (all.body.length > 0) {
      const goalId = all.body[0].id

      const res = await request(app)
        .put(`/api/Goal/${goalId}`)
        .send({ name: 'Updated Name', icon: '🚀' })
        .set('Content-Type', 'application/json')

      expect(res.status).toBe(204)

      // Verify the update
      const getRes = await request(app).get(`/api/Goal/${goalId}`)
      expect(getRes.body.name).toBe('Updated Name')
      expect(getRes.body.icon).toBe('🚀')
    }
  })

  it('returns 404 when updating a non-existent goal', async () => {
    const res = await request(app)
      .put('/api/Goal/nonexistent-id')
      .send({ name: 'Ghost' })
      .set('Content-Type', 'application/json')

    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/Goal/:id', () => {
  it('deletes a goal that exists', async () => {
    // Create a temporary goal
    const createRes = await request(app)
      .post('/api/Goal')
      .send({
        name: 'Temp Goal',
        targetAmount: 100,
        targetDate: '2026-12-31T00:00:00Z',
        userId: '62a29c15f4605c4c9fa7f306',
      })
      .set('Content-Type', 'application/json')

    const goalId = createRes.body.id

    const res = await request(app).delete(`/api/Goal/${goalId}`)
    expect(res.status).toBe(204)

    // Verify deletion
    const getRes = await request(app).get(`/api/Goal/${goalId}`)
    expect(getRes.status).toBe(404)
  })

  it('returns 404 when deleting a non-existent goal', async () => {
    const res = await request(app).delete('/api/Goal/nonexistent-id')
    expect(res.status).toBe(404)
  })
})
