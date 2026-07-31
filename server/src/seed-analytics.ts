/**
 * Standalone analytics seed script.
 * Run with: npx tsx src/seed-analytics.ts
 * Seeds historical progress snapshots and activity entries for demo goals.
 */
import Database from 'better-sqlite3'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const DB_PATH = path.resolve(__dirname, '../data/commbank.db')

const db = new Database(DB_PATH)

// Check if we already have progress history
const existingCount = (
  db.prepare('SELECT COUNT(*) as count FROM goal_progress_history').get() as { count: number }
).count

if (existingCount > 0) {
  console.log(`Progress history already seeded (${existingCount} entries). Skipping.`)
  process.exit(0)
}

// Get all goals
const goals = db.prepare('SELECT id, name, balance, targetAmount, created, icon FROM goals').all() as Array<{
  id: string
  name: string
  balance: number
  targetAmount: number
  created: string
  icon: string | null
}>

if (goals.length === 0) {
  console.log('No goals found. Run the main seed first.')
  process.exit(1)
}

const now = new Date()
const insertHistory = db.prepare(
  'INSERT INTO goal_progress_history (id, goal_id, amount, recorded_at) VALUES (?, ?, ?, ?)',
)
const insertActivity = db.prepare(
  'INSERT INTO activities (id, goal_id, type, metadata, created_at) VALUES (?, ?, ?, ?, ?)',
)

const seedAll = db.transaction(() => {
  for (const goal of goals) {
    const createdDate = new Date(goal.created)
    const daysSinceCreated = Math.max(
      1,
      Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)),
    )

    // Generate ~1 snapshot per week over the goal's lifetime
    const snapshotCount = Math.min(Math.max(Math.floor(daysSinceCreated / 7), 3), 20)
    const stepAmount = goal.balance / snapshotCount

    for (let i = 0; i <= snapshotCount; i++) {
      const date = new Date(createdDate.getTime() + (i / snapshotCount) * daysSinceCreated * 86400000)
      const amount = Math.round(stepAmount * i * 100) / 100
      insertHistory.run(uuidv4(), goal.id, amount, date.toISOString())
    }

    // Record creation activity
    insertActivity.run(
      uuidv4(),
      goal.id,
      'GOAL_CREATED',
      JSON.stringify({ name: goal.name, targetAmount: goal.targetAmount, icon: goal.icon }),
      createdDate.toISOString(),
    )

    // Record milestone activities
    const milestones = [25, 50, 75]
    for (const pct of milestones) {
      const threshold = (pct / 100) * goal.targetAmount
      if (goal.balance >= threshold) {
        const milestoneDate = new Date(
          createdDate.getTime() +
            (threshold / goal.balance) * daysSinceCreated * 86400000,
        )
        insertActivity.run(
          uuidv4(),
          goal.id,
          'MILESTONE_REACHED',
          JSON.stringify({ name: goal.name, milestone: `${pct}%` }),
          milestoneDate.toISOString(),
        )
      }
    }

    // Record completion activity
    if (goal.balance >= goal.targetAmount) {
      const completionDate = new Date(
        createdDate.getTime() + daysSinceCreated * 0.9 * 86400000,
      )
      insertActivity.run(
        uuidv4(),
        goal.id,
        'GOAL_COMPLETED',
        JSON.stringify({
          name: goal.name,
          balance: goal.balance,
          targetAmount: goal.targetAmount,
        }),
        completionDate.toISOString(),
      )
    }
  }

  // Add some recent update activities
  const recentGoals = goals.filter((g) => g.balance > 0)
  for (const goal of recentGoals) {
    const recentDate = new Date(now.getTime() - Math.floor(Math.random() * 14) * 86400000)
    insertActivity.run(
      uuidv4(),
      goal.id,
      'GOAL_UPDATED',
      JSON.stringify({
        name: goal.name,
        oldBalance: Math.max(0, goal.balance - Math.round(Math.random() * goal.balance * 0.2)),
        newBalance: goal.balance,
        amountAdded: Math.round(Math.random() * goal.balance * 0.2),
      }),
      recentDate.toISOString(),
    )
  }
})

seedAll()
console.log(`Seeded analytics: ${goals.length} goals with history and activities.`)
db.close()
