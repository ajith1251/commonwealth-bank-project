/**
 * Standalone seed script.
 * Run with: npx tsx src/seed.ts
 * Deletes the existing database file and re-seeds from scratch.
 */
import fs from 'fs'
import path from 'path'
import { initialiseDatabase } from './database'

const DB_PATH = path.resolve(__dirname, '../data/commbank.db')

// Delete existing database to force re-seed
if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH)
  console.log('Removed existing database.')
}

initialiseDatabase()
console.log('Seed complete.')
