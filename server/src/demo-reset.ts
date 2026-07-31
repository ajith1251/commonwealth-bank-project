/**
 * Development-only demo reset — reproduces the exact recording state.
 * Run with: npm run demo:reset
 *
 * 1. Deletes the SQLite database (plus WAL/SHM sidecars)
 * 2. Re-seeds base demo data (users, goals, accounts, transactions, tags)
 * 3. Seeds historical analytics (progress snapshots + activity)
 * 4. Seeds engagement (check-ins, streaks, achievements, focus goal)
 *
 * Intentionally NOT exposed in the production UI.
 */
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const DB_PATH = path.resolve(__dirname, '../data/commbank.db')

// 1. Remove database files so the seed starts from a clean slate.
for (const suffix of ['', '-wal', '-shm']) {
  try {
    fs.unlinkSync(DB_PATH + suffix)
    console.log(`Removed ${path.basename(DB_PATH)}${suffix || ''}`)
  } catch {
    /* file did not exist — fine */
  }
}

// 2–4. Run the deterministic seed scripts in order.
const scripts = ['seed.ts', 'seed-analytics.ts', 'seed-engagement.ts']
for (const script of scripts) {
  console.log(`\n→ Running ${script}`)
  execSync(`npx tsx src/${script}`, { cwd: __dirname, stdio: 'inherit' })
}

console.log('\nDemo reset complete — the app now shows the exact recording state.')
