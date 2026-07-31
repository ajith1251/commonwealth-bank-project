/**
 * Standalone engagement seed script — DETERMINISTIC demo data.
 * Run with: npx tsx src/seed-engagement.ts
 *
 * Seeds ~120 days of daily check-ins for the demo user with a realistic
 * pattern: a current streak, a longer longest-streak, a missed day or two,
 * varied weekly consistency and heatmap intensity. Also unlocks a sensible
 * set of achievements and sets a focus goal.
 *
 * This is clearly demo data — it does NOT represent real user behaviour.
 */
import Database from 'better-sqlite3'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { DEFAULT_USER_ID, CHECKIN_TYPES, ACHIEVEMENTS } from './engagement/engagement.types'
import { toDateKey, addDays } from './engagement/engagement.service'

const DB_PATH = path.resolve(__dirname, '../data/commbank.db')
const db = new Database(DB_PATH)

const existing = (
  db.prepare('SELECT COUNT(*) as c FROM user_checkins WHERE user_id = ?').get(DEFAULT_USER_ID) as { c: number }
).c

if (existing > 0) {
  console.log(`Engagement data already seeded (${existing} check-ins). Skipping.`)
  process.exit(0)
}

/**
 * Deterministic activity pattern over the last 128 days.
 *  - Last 30 days: fully active → a current streak of 30.
 *  - One missed day (30 days ago) breaks the current run.
 *  - Days 31–70: a contiguous 40-day historical run → longest streak 40.
 *  - Older history: deterministic sparse activity for heatmap variation.
 */
function activeOnDay(offset: number): boolean {
  const dayIndex = 128 - offset // 0 = today … 127 = oldest
  if (dayIndex < 30) return true
  if (dayIndex === 30) return false
  if (dayIndex <= 70) return true
  return dayIndex % 3 !== 1
}

const insertCheckin = db.prepare(
  `INSERT INTO user_checkins (id, user_id, activity_date, first_activity_at, last_activity_at, activity_count, types, created_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
)
const insertAchievement = db.prepare(
  `INSERT INTO achievements (id, user_id, code, name, description, unlocked_at)
   VALUES (?, ?, ?, ?, ?, ?)`,
)
const insertActivity = db.prepare(
  'INSERT INTO activities (id, goal_id, type, metadata, created_at) VALUES (?, NULL, ?, ?, ?)',
)

const seedAll = db.transaction(() => {
  const today = new Date()
  const todayKey = toDateKey(today)

  for (let offset = 127; offset >= 0; offset--) {
    const key = addDays(todayKey, -offset)
    if (!activeOnDay(offset)) continue

    const hour = (offset % 8) + 9 // 09:00 – 16:00 deterministic
    const date = new Date(key + 'T' + String(hour).padStart(2, '0') + ':00:00')
    const iso = date.toISOString()

    // Deterministic activity count (1–4) and types (always VIEW_DASHBOARD + 0–2 more).
    const typeCount = 1 + (offset % 3)
    const types = CHECKIN_TYPES.slice(0, typeCount)

    insertCheckin.run(
      uuidv4(),
      DEFAULT_USER_ID,
      key,
      iso,
      new Date(new Date(iso).getTime() + 30 * 60 * 1000).toISOString(),
      typeCount,
      JSON.stringify(types),
      iso,
    )
  }

  // Unlock achievements deterministically (the streak ones are satisfied by the pattern).
  const unlockedCodes = new Set([
    'first_goal',
    'first_update',
    'streak_7',
    'streak_30',
    'halfway_there',
    'analytics_explorer',
  ])
  const baseDate = new Date(today.getTime() - 100 * 24 * 60 * 60 * 1000).toISOString()
  for (const def of ACHIEVEMENTS) {
    if (!unlockedCodes.has(def.code)) continue
    insertAchievement.run(uuidv4(), DEFAULT_USER_ID, def.code, def.name, def.description, baseDate)
    insertActivity.run(
      uuidv4(),
      'ACHIEVEMENT_UNLOCKED',
      JSON.stringify({ code: def.code, name: def.name }),
      baseDate,
    )
  }

  // A few recent activity events so the Activity timeline looks alive.
  const goalRows = db.prepare('SELECT id, name FROM goals').all() as Array<{ id: string; name: string }>
  if (goalRows.length > 0) {
    for (let i = 0; i < 3; i++) {
      const goal = goalRows[i % goalRows.length]
      const when = new Date(today.getTime() - (i * 2 + 1) * 24 * 60 * 60 * 1000).toISOString()
      insertActivity.run(uuidv4(), goal.id, 'GOAL_UPDATED', JSON.stringify({ name: goal.name }), when)
    }

    // Set a focus goal — the most progressed incomplete goal, deterministically.
    const focusGoal = db
      .prepare('SELECT id FROM goals WHERE balance < targetAmount ORDER BY (balance * 1.0 / targetAmount) DESC LIMIT 1')
      .get() as { id: string } | undefined
    if (focusGoal) {
      db.prepare(
        'INSERT INTO focus_goal (user_id, goal_id, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET goal_id = excluded.goal_id, updated_at = excluded.updated_at',
      ).run(DEFAULT_USER_ID, focusGoal.id, new Date().toISOString())
      console.log('Focus goal set for the demo user.')
    } else {
      console.log('No focus goal candidate found (all goals complete or none exist).')
    }
  }
})

seedAll()
console.log('Engagement seed complete — deterministic demo check-ins, achievements and activity added.')
db.close()
