/**
 * Report Repository — persistence for report snapshots and share links.
 * Reports are stored as immutable JSON snapshots; only SHA-256 hashes of
 * share tokens are ever written to disk.
 */
import Database from 'better-sqlite3'
import { v4 as uuidv4 } from 'uuid'
import type { ReportConfig, ReportMeta, ReportShare, ReportSnapshot } from './report.types'

interface ReportRow {
  id: string
  title: string
  configuration: string
  snapshot: string
  generated_at: string
  updated_at: string
}

interface ShareRow {
  id: string
  report_id: string
  token_hash: string
  created_at: string
  expires_at: string | null
  revoked_at: string | null
  view_count: number
}

function rowToMeta(
  row: ReportRow & { activeShares: number; earliestExpiry: string | null },
): ReportMeta {
  return {
    id: row.id,
    title: row.title,
    configuration: JSON.parse(row.configuration) as ReportConfig,
    generatedAt: row.generated_at,
    updatedAt: row.updated_at,
    activeShares: row.activeShares,
    earliestExpiry: row.earliestExpiry,
  }
}

function rowToShare(row: ShareRow): ReportShare {
  const now = Date.now()
  const active =
    row.revoked_at === null &&
    (row.expires_at === null || new Date(row.expires_at).getTime() > now)
  return {
    id: row.id,
    reportId: row.report_id,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
    viewCount: row.view_count,
    active,
  }
}

export class ReportRepository {
  constructor(private db: Database.Database) {}

  // ── Reports ──────────────────────────────────────────────────────────

  insertReport(
    id: string,
    title: string,
    configuration: ReportConfig,
    snapshot: ReportSnapshot,
    generatedAt: string,
  ): void {
    this.db
      .prepare(
        `INSERT INTO reports (id, title, configuration, snapshot, generated_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        title,
        JSON.stringify(configuration),
        JSON.stringify(snapshot),
        generatedAt,
        generatedAt,
      )
  }

  findReport(id: string): ReportSnapshot | null {
    const row = this.db
      .prepare('SELECT snapshot FROM reports WHERE id = ?')
      .get(id) as { snapshot: string } | undefined
    return row ? (JSON.parse(row.snapshot) as ReportSnapshot) : null
  }

  hasReport(id: string): boolean {
    const row = this.db.prepare('SELECT id FROM reports WHERE id = ?').get(id)
    return row !== undefined
  }

  /** Raw goal rows for report assembly (targetDate included). */
  getGoalDetailRows(goalIds: 'all' | string[]): Array<{
    goalId: string
    name: string
    icon: string | null
    balance: number
    targetAmount: number
    targetDate: string
  }> {
    const rows = this.db
      .prepare(
        `SELECT
          id as goalId,
          name,
          icon,
          balance,
          targetAmount,
          targetDate
         FROM goals`,
      )
      .all() as Array<{
      goalId: string
      name: string
      icon: string | null
      balance: number
      targetAmount: number
      targetDate: string
    }>
    if (goalIds === 'all') return rows
    const set = new Set(goalIds)
    return rows.filter((r) => set.has(r.goalId))
  }

  listReports(): ReportMeta[] {
    const now = new Date().toISOString()
    const rows = this.db
      .prepare(
        `SELECT
           r.*,
           (SELECT COUNT(*) FROM report_shares s
             WHERE s.report_id = r.id
               AND s.revoked_at IS NULL
               AND (s.expires_at IS NULL OR s.expires_at > ?)) AS activeShares,
           (SELECT MIN(s.expires_at) FROM report_shares s
             WHERE s.report_id = r.id
               AND s.revoked_at IS NULL
               AND (s.expires_at IS NULL OR s.expires_at > ?)) AS earliestExpiry
         FROM reports r
         ORDER BY r.generated_at DESC`,
      )
      .all(now, now) as Array<ReportRow & { activeShares: number; earliestExpiry: string | null }>
    return rows.map(rowToMeta)
  }

  // ── Shares ───────────────────────────────────────────────────────────

  insertShare(
    id: string,
    reportId: string,
    tokenHash: string,
    createdAt: string,
    expiresAt: string | null,
  ): void {
    this.db
      .prepare(
        `INSERT INTO report_shares (id, report_id, token_hash, created_at, expires_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(id, reportId, tokenHash, createdAt, expiresAt)
  }

  findShareByTokenHash(tokenHash: string): ReportShare | null {
    const row = this.db
      .prepare('SELECT * FROM report_shares WHERE token_hash = ?')
      .get(tokenHash) as ShareRow | undefined
    return row ? rowToShare(row) : null
  }

  findShareById(shareId: string): ReportShare | null {
    const row = this.db
      .prepare('SELECT * FROM report_shares WHERE id = ?')
      .get(shareId) as ShareRow | undefined
    return row ? rowToShare(row) : null
  }

  listSharesByReport(reportId: string): ReportShare[] {
    const rows = this.db
      .prepare('SELECT * FROM report_shares WHERE report_id = ? ORDER BY created_at DESC')
      .all(reportId) as ShareRow[]
    return rows.map(rowToShare)
  }

  revokeShare(shareId: string, revokedAt: string): void {
    this.db
      .prepare('UPDATE report_shares SET revoked_at = ? WHERE id = ?')
      .run(revokedAt, shareId)
  }

  incrementViewCount(shareId: string): void {
    this.db
      .prepare('UPDATE report_shares SET view_count = view_count + 1 WHERE id = ?')
      .run(shareId)
  }

  /** Generates a fresh UUID — kept here so routes stay focused. */
  newId(): string {
    return uuidv4()
  }
}
