/**
 * Migration script — adds new tables to an existing database.
 * Run with: npx tsx src/migrate.ts
 */
import Database from 'better-sqlite3'
import path from 'path'

const DB_PATH = path.resolve(__dirname, '../data/commbank.db')
const db = new Database(DB_PATH)

db.exec(`
  CREATE TABLE IF NOT EXISTS goal_progress_history (
    id TEXT PRIMARY KEY,
    goal_id TEXT NOT NULL,
    amount REAL NOT NULL,
    recorded_at TEXT NOT NULL,
    FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    goal_id TEXT,
    type TEXT NOT NULL,
    metadata TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    configuration TEXT NOT NULL,
    snapshot TEXT NOT NULL,
    generated_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS report_shares (
    id TEXT PRIMARY KEY,
    report_id TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    expires_at TEXT,
    revoked_at TEXT,
    view_count INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS user_checkins (
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

  CREATE TABLE IF NOT EXISTS focus_goal (
    user_id TEXT PRIMARY KEY,
    goal_id TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS achievements (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    unlocked_at TEXT NOT NULL,
    UNIQUE (user_id, code)
  );

  CREATE INDEX IF NOT EXISTS idx_progress_history_goalId ON goal_progress_history(goal_id);
  CREATE INDEX IF NOT EXISTS idx_activities_createdAt ON activities(created_at);
  CREATE INDEX IF NOT EXISTS idx_report_shares_token_hash ON report_shares(token_hash);
  CREATE INDEX IF NOT EXISTS idx_report_shares_report_id ON report_shares(report_id);
  CREATE INDEX IF NOT EXISTS idx_checkins_user_date ON user_checkins(user_id, activity_date);
`)

console.log('Migration complete — new tables added.')
db.close()
