import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'

// Paths relative to the server/ directory
const DATA_DIR = path.resolve(__dirname, '../../data')
const DB_PATH = path.resolve(__dirname, '../data/commbank.db')

/** Minimum MongoDB Extended JSON parser — handles $oid and $date fields */
function parseMongoValue(value: unknown): unknown {
  if (value === null || value === undefined) return null
  if (Array.isArray(value)) return value.map(parseMongoValue)
  if (typeof value !== 'object') return value

  const obj = value as Record<string, unknown>

  if ('$oid' in obj) return obj.$oid
  if ('$date' in obj) {
    const dateObj = obj.$date as Record<string, unknown>
    if (dateObj && typeof dateObj === 'object' && '$numberLong' in dateObj) {
      return new Date(Number(dateObj.$numberLong)).toISOString()
    }
    return new Date(String(dateObj)).toISOString()
  }
  // Plain object — convert to JSON string or return as-is
  return value
}

/** Parse a JSON file that may contain MongoDB Extended JSON, returning plain objects */
function loadSeedData<T>(filename: string): T[] {
  const filePath = path.join(DATA_DIR, filename)
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  return raw.map((item: Record<string, unknown>) => {
    const parsed: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(item)) {
      // MongoDB fields start with uppercase; convert to camelCase for our API
      let camelKey = key.charAt(0).toLowerCase() + key.slice(1)
      // MongoDB's _id maps to our id
      if (camelKey === '_id') camelKey = 'id'
      parsed[camelKey] = parseMongoValue(value)
    }
    return parsed as unknown as T
  })
}

export function initialiseDatabase(dbPath?: string): Database.Database {
  // Allow tests to run against an isolated database file.
  const resolvedPath = dbPath ?? DB_PATH

  // Ensure the data directory exists
  const dbDir = path.dirname(resolvedPath)
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  const db = new Database(resolvedPath)

  // Enable WAL mode for better concurrent read performance
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  // ── Schema ──────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      password TEXT NOT NULL,
      accountIds TEXT,
      goalIds TEXT,
      transactionIds TEXT
    );

    CREATE TABLE IF NOT EXISTS goals (
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
      userId TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      number INTEGER NOT NULL,
      name TEXT NOT NULL,
      balance REAL NOT NULL DEFAULT 0,
      accountType TEXT NOT NULL,
      transactionIds TEXT
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      transactionType TEXT NOT NULL CHECK (transactionType IN ('Debit', 'Credit')),
      dateTime TEXT NOT NULL,
      goalId TEXT,
      tagIds TEXT,
      userId TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );

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

    CREATE INDEX IF NOT EXISTS idx_goals_userId ON goals(userId);
    CREATE INDEX IF NOT EXISTS idx_transactions_userId ON transactions(userId);
    CREATE INDEX IF NOT EXISTS idx_transactions_goalId ON transactions(goalId);
    CREATE INDEX IF NOT EXISTS idx_progress_history_goalId ON goal_progress_history(goal_id);
    CREATE INDEX IF NOT EXISTS idx_activities_createdAt ON activities(created_at);
    CREATE INDEX IF NOT EXISTS idx_report_shares_token_hash ON report_shares(token_hash);
    CREATE INDEX IF NOT EXISTS idx_report_shares_report_id ON report_shares(report_id);
    CREATE INDEX IF NOT EXISTS idx_checkins_user_date ON user_checkins(user_id, activity_date);
  `)

  // ── Seed data ───────────────────────────────────────────────────────
  const goalCount = db.prepare('SELECT COUNT(*) as count FROM goals').get() as { count: number }

  if (goalCount.count === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (id, name, email, password, accountIds, goalIds, transactionIds)
      VALUES (@id, @name, @email, @password, @accountIds, @goalIds, @transactionIds)
    `)

    const insertGoal = db.prepare(`
      INSERT INTO goals (id, name, targetAmount, targetDate, balance, created, accountId, transactionIds, tagIds, icon, userId)
      VALUES (@id, @name, @targetAmount, @targetDate, @balance, @created, @accountId, @transactionIds, @tagIds, @icon, @userId)
    `)

    const insertAccount = db.prepare(`
      INSERT INTO accounts (id, number, name, balance, accountType, transactionIds)
      VALUES (@id, @number, @name, @balance, @accountType, @transactionIds)
    `)

    const insertTransaction = db.prepare(`
      INSERT INTO transactions (id, description, amount, transactionType, dateTime, goalId, tagIds, userId)
      VALUES (@id, @description, @amount, @transactionType, @dateTime, @goalId, @tagIds, @userId)
    `)

    const insertTag = db.prepare(`
      INSERT INTO tags (id, name)
      VALUES (@id, @name)
    `)

    const seedTransaction = db.transaction(() => {
      // Load seed data (handles MongoDB Extended JSON format)
      const users = loadSeedData<Record<string, unknown>>('Users.json')
      const goals = loadSeedData<Record<string, unknown>>('Goals.json')
      const accounts = loadSeedData<Record<string, unknown>>('Accounts.json')
      const transactions = loadSeedData<Record<string, unknown>>('Transactions.json')
      const tags = loadSeedData<Record<string, unknown>>('Tags.json')

      for (const tag of tags) {
        insertTag.run({
          id: tag.id,
          name: tag.name,
        })
      }

      for (const account of accounts) {
        insertAccount.run({
          id: account.id,
          number: account.number,
          name: account.name,
          balance: account.balance,
          accountType: account.accountType,
          transactionIds: account.transactionIds ? JSON.stringify(account.transactionIds) : null,
        })
      }

      for (const user of users) {
        insertUser.run({
          id: user.id,
          name: user.name,
          email: user.email,
          password: user.password,
          accountIds: user.accountIds ? JSON.stringify(user.accountIds) : null,
          goalIds: user.goalIds ? JSON.stringify(user.goalIds) : null,
          transactionIds: user.transactionIds ? JSON.stringify(user.transactionIds) : null,
        })
      }

      for (const goal of goals) {
        insertGoal.run({
          id: goal.id,
          name: goal.name,
          targetAmount: goal.targetAmount,
          targetDate: goal.targetDate,
          balance: goal.balance ?? 0,
          created: goal.created,
          accountId: goal.accountId ?? null,
          transactionIds: goal.transactionIds ? JSON.stringify(goal.transactionIds) : null,
          tagIds: goal.tagIds ? JSON.stringify(goal.tagIds) : null,
          icon: goal.icon ?? null,
          userId: goal.userId,
        })
      }

      for (const tx of transactions) {
        insertTransaction.run({
          id: tx.id,
          description: tx.description,
          amount: tx.amount,
          transactionType: tx.transactionType,
          dateTime: tx.dateTime,
          goalId: tx.goalId ?? null,
          tagIds: tx.tagIds ? JSON.stringify(tx.tagIds) : null,
          userId: tx.userId,
        })
      }
    })

    seedTransaction()
    console.log('Database seeded successfully.')
  }

  return db
}
