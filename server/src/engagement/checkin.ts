/**
 * Shared check-in helpers used by other route modules (goals, reports).
 * These are best-effort: engagement tracking must never break goal CRUD
 * or report generation, so every failure is caught and logged.
 */
import Database from 'better-sqlite3'
import { v4 as uuidv4 } from 'uuid'
import { EngagementRepository } from './engagement.repository'
import { EngagementService } from './engagement.service'
import { DEFAULT_USER_ID, type CheckinType } from './engagement.types'

/** Records a daily check-in for the demo user (deduped per local day). */
export function recordCheckin(db: Database.Database, type: CheckinType): void {
  try {
    new EngagementService(new EngagementRepository(db), DEFAULT_USER_ID).recordCheckin(type)
  } catch (err) {
    console.error('[Engagement] check-in record failed:', err)
  }
}

/** Inserts a raw timeline activity event (e.g. REPORT_GENERATED). */
export function recordActivityEvent(
  db: Database.Database,
  type: string,
  metadata: Record<string, unknown> | null = null,
): void {
  try {
    db.prepare(
      'INSERT INTO activities (id, goal_id, type, metadata, created_at) VALUES (?, NULL, ?, ?, ?)',
    ).run(uuidv4(), type, metadata ? JSON.stringify(metadata) : null, new Date().toISOString())
  } catch (err) {
    console.error('[Engagement] activity record failed:', err)
  }
}
