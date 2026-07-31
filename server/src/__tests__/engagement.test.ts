/**
 * Engagement & Consistency tests.
 * Covers: first check-in, duplicate same-day check-in, consecutive streaks,
 * broken streaks, longest streak, weekly consistency, date boundaries,
 * focus goal selection, recommendation rules and achievement unlocks.
 */
import { describe, it, expect } from 'vitest'
import Database from 'better-sqlite3'
import {
  toDateKey,
  addDays,
  mondayIndex,
  startOfWeekKey,
  calculateStreaks,
  EngagementService,
} from '../engagement/engagement.service'
import { EngagementRepository } from '../engagement/engagement.repository'

const USER = 'test-user-1'

/** In-memory database with just the engagement + supporting tables. */
function createDb(): Database.Database {
  const db = new Database(':memory:')
  db.exec(`
    CREATE TABLE user_checkins (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      activity_date TEXT NOT NULL,
      first_activity_at TEXT NOT NULL,
      last_activity_at TEXT NOT NULL,
      activity_count INTEGER NOT NULL DEFAULT 1,
      types TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      UNIQUE (user_id, activity_date)
    );
    CREATE TABLE focus_goal (
      user_id TEXT PRIMARY KEY,
      goal_id TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE achievements (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      unlocked_at TEXT NOT NULL,
      UNIQUE (user_id, code)
    );
    CREATE TABLE activities (
      id TEXT PRIMARY KEY,
      goal_id TEXT,
      type TEXT NOT NULL,
      metadata TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE reports (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      configuration TEXT NOT NULL,
      snapshot TEXT NOT NULL,
      generated_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE goals (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      targetAmount REAL NOT NULL,
      targetDate TEXT NOT NULL,
      balance REAL NOT NULL DEFAULT 0,
      created TEXT NOT NULL,
      accountId TEXT,
      transactionIds TEXT,
      tagIds TEXT,
      icon TEXT,
      userId TEXT NOT NULL
    );
  `)
  return db
}

function makeService(db: Database.Database, today = new Date(2026, 6, 30)) {
  return new EngagementService(new EngagementRepository(db), USER, today)
}

// ── Pure date helpers ─────────────────────────────────────────────────

describe('date helpers', () => {
  it('formats local date keys', () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(toDateKey(new Date(2026, 11, 31))).toBe('2026-12-31')
  })

  it('adds days across month/year boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01')
    expect(addDays('2025-12-31', 1)).toBe('2026-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('computes Monday-based weekday indexes', () => {
    expect(mondayIndex(new Date(2026, 6, 27))).toBe(0) // Mon
    expect(mondayIndex(new Date(2026, 6, 28))).toBe(1) // Tue
    expect(mondayIndex(new Date(2026, 7, 2))).toBe(6) // Sun
  })

  it('computes the start of the current week', () => {
    // Wed 2026-07-29 → week starts Mon 2026-07-27
    expect(startOfWeekKey(new Date(2026, 6, 29))).toBe('2026-07-27')
    // Mon itself
    expect(startOfWeekKey(new Date(2026, 6, 27))).toBe('2026-07-27')
    // Sunday → the Monday before
    expect(startOfWeekKey(new Date(2026, 7, 2))).toBe('2026-07-27')
  })
})

// ── Streak math ───────────────────────────────────────────────────────

describe('calculateStreaks', () => {
  const today = new Date(2026, 6, 30) // Thu 2026-07-30

  it('returns zeros for no activity', () => {
    const stats = calculateStreaks(new Set(), today)
    expect(stats.currentStreak).toBe(0)
    expect(stats.longestStreak).toBe(0)
    expect(stats.activeToday).toBe(false)
    expect(stats.totalActiveDays).toBe(0)
    expect(stats.weeklyConsistency).toBe(0)
  })

  it('counts a single-day current streak when active today', () => {
    const stats = calculateStreaks(new Set(['2026-07-30']), today)
    expect(stats.currentStreak).toBe(1)
    expect(stats.activeToday).toBe(true)
  })

  it('counts consecutive days ending today', () => {
    const dates = new Set(['2026-07-28', '2026-07-29', '2026-07-30'])
    const stats = calculateStreaks(dates, today)
    expect(stats.currentStreak).toBe(3)
    expect(stats.longestStreak).toBe(3)
    expect(stats.activeDaysThisWeek).toBe(3) // Mon 27 … Thu 30, active on 28,29,30
  })

  it('keeps the streak alive when the last active day was yesterday', () => {
    const dates = new Set(['2026-07-27', '2026-07-28', '2026-07-29'])
    const stats = calculateStreaks(dates, today)
    expect(stats.currentStreak).toBe(3)
    expect(stats.activeToday).toBe(false)
  })

  it('breaks the streak with a gap', () => {
    const dates = new Set(['2026-07-26', '2026-07-27', '2026-07-29', '2026-07-30'])
    const stats = calculateStreaks(dates, today)
    expect(stats.currentStreak).toBe(2) // 29–30
    expect(stats.longestStreak).toBe(2)
  })

  it('tracks the longest streak longer than the current one', () => {
    const dates = new Set([
      '2026-07-10',
      '2026-07-11',
      '2026-07-12',
      '2026-07-13',
      '2026-07-14',
      '2026-07-29',
      '2026-07-30',
    ])
    const stats = calculateStreaks(dates, today)
    expect(stats.currentStreak).toBe(2)
    expect(stats.longestStreak).toBe(5)
  })

  it('computes weekly consistency as a percentage of the week', () => {
    const allWeek = new Set([
      '2026-07-27',
      '2026-07-28',
      '2026-07-29',
      '2026-07-30',
      '2026-07-31',
      '2026-08-01',
      '2026-08-02',
    ])
    expect(calculateStreaks(allWeek, today).weeklyConsistency).toBe(100)
    // 3 of 7 days this week
    const partial = new Set(['2026-07-28', '2026-07-29', '2026-07-30'])
    expect(calculateStreaks(partial, today).weeklyConsistency).toBe(Math.round((3 / 7) * 100))
  })
})

// ── Check-in service (repository-backed) ──────────────────────────────

describe('EngagementService.recordCheckin', () => {
  it('records a first check-in and qualifies the day', () => {
    const db = createDb()
    const service = makeService(db)
    const result = service.recordCheckin('VIEW_DASHBOARD')
    expect(result.summary.activeToday).toBe(true)
    expect(result.summary.currentStreak).toBe(1)
    expect(result.summary.totalActiveDays).toBe(1)
  })

  it('does not double-count the same-day check-in', () => {
    const db = createDb()
    const service = makeService(db)
    service.recordCheckin('VIEW_DASHBOARD')
    const second = service.recordCheckin('VIEW_ANALYTICS')
    expect(second.summary.currentStreak).toBe(1)
    expect(second.summary.totalActiveDays).toBe(1)

    // activity_count increments, but the date set does not
    const repo = new EngagementRepository(db)
    const row = repo.findCheckin(USER, '2026-07-30')
    expect(row).not.toBeNull()
    expect(row?.activityCount).toBe(2)
  })

  it('builds a consecutive streak across days', () => {
    const db = createDb()
    const service = makeService(db, new Date(2026, 6, 28))
    service.recordCheckin('VIEW_DASHBOARD')
    const day2 = makeService(db, new Date(2026, 6, 29))
    day2.recordCheckin('VIEW_GOAL')
    const day3 = makeService(db, new Date(2026, 6, 30))
    const result = day3.recordCheckin('VIEW_ANALYTICS')
    expect(result.summary.currentStreak).toBe(3)
  })

  it('breaks the streak after a missed day', () => {
    const db = createDb()
    const s1 = makeService(db, new Date(2026, 6, 28))
    s1.recordCheckin('VIEW_DASHBOARD')
    // skip 2026-07-29
    const s3 = makeService(db, new Date(2026, 6, 30))
    const result = s3.recordCheckin('VIEW_DASHBOARD')
    expect(result.summary.currentStreak).toBe(1)
    expect(result.summary.longestStreak).toBe(1)
  })

  it('unlocks streak achievements deterministically', () => {
    const db = createDb()
    const today = new Date(2026, 6, 30)
    // First 6 consecutive days (no unlock yet).
    for (let i = 6; i >= 1; i--) {
      const day = new Date(2026, 6, 30 - i)
      makeService(db, day).recordCheckin('VIEW_DASHBOARD')
    }
    // The 7th consecutive day unlocks streak_7 exactly once.
    const result = makeService(db, today).recordCheckin('VIEW_DASHBOARD')
    expect(result.summary.currentStreak).toBe(7)
    const codes = result.newlyUnlocked.map((a) => a.code)
    expect(codes).toContain('streak_7')
    expect(codes).not.toContain('streak_30')

    const achievements = makeService(db, today).getAchievements()
    const streak7 = achievements.find((a) => a.code === 'streak_7')
    expect(streak7?.unlocked).toBe(true)
    expect(streak7?.unlockedAt).not.toBeNull()
  })
})

// ── Focus goal ────────────────────────────────────────────────────────

describe('focus goal', () => {
  function seedGoals(db: Database.Database): void {
    const insert = db.prepare(
      `INSERT INTO goals (id, name, targetAmount, targetDate, balance, created, userId)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    insert.run('g1', 'Home Deposit', 100000, '2028-06-01T00:00:00Z', 40000, '2026-01-01T00:00:00Z', USER)
    insert.run('g2', 'Done Goal', 5000, '2026-01-01T00:00:00Z', 5000, '2026-01-01T00:00:00Z', USER)
  }

  it('sets and retrieves a valid focus goal', () => {
    const db = createDb()
    seedGoals(db)
    const service = makeService(db)
    const set = service.setFocusGoal('g1')
    expect(set.ok).toBe(true)
    expect(service.getFocusGoal()?.id).toBe('g1')
  })

  it('rejects unknown goals', () => {
    const db = createDb()
    const service = makeService(db)
    expect(service.setFocusGoal('missing').ok).toBe(false)
  })

  it('rejects completed goals', () => {
    const db = createDb()
    seedGoals(db)
    const service = makeService(db)
    expect(service.setFocusGoal('g2').ok).toBe(false)
  })

  it('clears an invalid persisted focus goal', () => {
    const db = createDb()
    seedGoals(db)
    const repo = new EngagementRepository(db)
    repo.setFocusGoal(USER, 'g2', new Date().toISOString()) // completed goal
    const service = makeService(db)
    expect(service.getFocusGoal()).toBeNull()
    expect(repo.getFocusGoalId(USER)).toBeNull()
  })
})

// ── Next best actions ─────────────────────────────────────────────────

describe('next best actions', () => {
  function seedGoals(db: Database.Database): void {
    const insert = db.prepare(
      `INSERT INTO goals (id, name, targetAmount, targetDate, balance, created, userId)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    const now = Date.now()
    const DAY = 86400000
    const iso = (offsetDays: number) => new Date(now + offsetDays * DAY).toISOString()
    // near completion
    insert.run('g1', 'New Laptop', 3000, iso(60), 2800, iso(-30), USER)
    // deadline approaching
    insert.run('g2', 'Travel Japan', 8000, iso(10), 3000, iso(-30), USER)
    // low progress + approaching deadline → attention
    insert.run('g3', 'Wedding Savings', 20000, iso(20), 4000, iso(-30), USER)
    // completed
    insert.run('g4', 'Emergency Fund', 5000, iso(-5), 5000, iso(-30), USER)
    // stale (never reviewed)
    insert.run('g5', 'New Car', 15000, iso(300), 1000, iso(-200), USER)
  }

  it('returns deterministic, prioritized actions', () => {
    const db = createDb()
    seedGoals(db)
    const service = makeService(db)
    const actions = service.getNextBestActions()
    expect(actions.length).toBeGreaterThan(0)
    expect(actions.length).toBeLessThanOrEqual(3)

    // Types are a closed set.
    const validTypes = new Set(['deadline', 'near_completion', 'not_reviewed', 'completed', 'attention'])
    for (const a of actions) expect(validTypes.has(a.type)).toBe(true)

    // The highest-priority goal (deadline approaching) is ranked first.
    expect(actions[0].type).toBe('deadline')
    expect(actions[0].message).toContain('Travel Japan')
  })

  it('produces no suggestions with no goals', () => {
    const db = createDb()
    const service = makeService(db)
    expect(service.getNextBestActions()).toEqual([])
  })
})

// ── Calendar ──────────────────────────────────────────────────────────

describe('calendar', () => {
  it('returns the requested range with per-day counts', () => {
    const db = createDb()
    const service = makeService(db, new Date(2026, 6, 30))
    service.recordCheckin('VIEW_DASHBOARD')
    service.recordCheckin('VIEW_GOAL') // same day → count 2

    const calendar = service.getCalendarWithCounts(30)
    expect(calendar.range).toBe(30)
    expect(calendar.days).toHaveLength(30)
    expect(calendar.days[29]).toEqual({ date: '2026-07-30', count: 2 })
    expect(calendar.days[0]).toEqual({ date: '2026-07-01', count: 0 })
  })
})
