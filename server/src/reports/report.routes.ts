/**
 * Report Center routes.
 *   /api/reports              — private report management (preview, generate, list, pdf, shares)
 *   /api/shared/reports/:token — public read-only shared report endpoints (rate limited)
 */
import { Router, Request, Response } from 'express'
import type Database from 'better-sqlite3'
import { AnalyticsService } from '../analytics/analytics.service'
import { AnalyticsRepository } from '../analytics/analytics.repository'
import { validate } from '../middleware/validate'
import { EngagementRepository } from '../engagement/engagement.repository'
import { EngagementService } from '../engagement/engagement.service'
import { DEFAULT_USER_ID } from '../engagement/engagement.types'
import { ReportRepository } from './report.repository'
import { ReportService } from './report.service'
import {
  validReportTitle,
  validReportPeriod,
  validCustomRange,
  validGoalIds,
  validSections,
  validShareExpiration,
} from './report.validation'
import { generateReportPdf, reportPdfFilename } from './report.pdf'
import { recordCheckin, recordActivityEvent } from '../engagement/checkin'
import type { ReportConfig } from './report.types'

/** Minimal in-memory sliding-window rate limiter for public endpoints. */
function rateLimit(limit = 60, windowMs = 60_000) {
  const hits = new Map<string, number[]>()
  // Prune stale IP entries so the map cannot grow unboundedly.
  const sweep = setInterval(() => {
    const cutoff = Date.now() - windowMs
    for (const [ip, times] of hits) {
      if (times.length === 0 || times[times.length - 1] < cutoff) hits.delete(ip)
    }
  }, windowMs)
  sweep.unref?.()
  return (req: Request, res: Response, next: () => void) => {
    const ip = req.ip ?? 'unknown'
    const now = Date.now()
    const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs)
    if (recent.length >= limit) {
      res.status(429).json({ error: 'Too many requests, please try again shortly.' })
      return
    }
    recent.push(now)
    hits.set(ip, recent)
    next()
  }
}

export function createReportRouter(db: Database.Database): Router {
  const router = Router()
  const service = new ReportService(
    new ReportRepository(db),
    new AnalyticsService(new AnalyticsRepository(db)),
    new EngagementService(new EngagementRepository(db), DEFAULT_USER_ID),
  )

  // POST /api/reports/preview — assemble a snapshot without persisting it.
  router.post(
    '/preview',
    validate(validReportTitle, validReportPeriod, validCustomRange, validGoalIds, validSections),
    (req: Request, res: Response) => {
      try {
        const snapshot = service.assembleSnapshot(req.body as ReportConfig, null)
        res.json({ report: snapshot })
      } catch (err) {
        console.error('[Reports] preview error:', err)
        res.status(500).json({ error: 'Failed to build report preview' })
      }
    },
  )

  // POST /api/reports — generate + persist an immutable report snapshot.
  router.post(
    '/',
    validate(validReportTitle, validReportPeriod, validCustomRange, validGoalIds, validSections),
    (req: Request, res: Response) => {
      try {
        const snapshot = service.generate(req.body as ReportConfig)
        recordCheckin(db, 'GENERATE_REPORT')
        recordActivityEvent(db, 'REPORT_GENERATED', {
          title: snapshot.title,
          reportId: snapshot.reportId,
        })
        res.status(201).json({ report: snapshot })
      } catch (err) {
        console.error('[Reports] generate error:', err)
        res.status(500).json({ error: 'Failed to generate report' })
      }
    },
  )

  // GET /api/reports — report history (metadata + share status).
  router.get('/', (_req: Request, res: Response) => {
    try {
      res.json(service.listReports())
    } catch (err) {
      console.error('[Reports] list error:', err)
      res.status(500).json({ error: 'Failed to list reports' })
    }
  })

  // GET /api/reports/:id — retrieve a stored snapshot.
  router.get('/:id', (req: Request, res: Response) => {
    try {
      const snapshot = service.getReport(String(req.params.id))
      if (!snapshot) {
        res.status(404).json({ error: 'Report not found' })
        return
      }
      res.json({ report: snapshot })
    } catch (err) {
      console.error('[Reports] get error:', err)
      res.status(500).json({ error: 'Failed to get report' })
    }
  })

  // GET /api/reports/:id/pdf — stream the PDF built from the stored snapshot.
  router.get('/:id/pdf', (req: Request, res: Response) => {
    try {
      const snapshot = service.getReport(String(req.params.id))
      if (!snapshot) {
        res.status(404).json({ error: 'Report not found' })
        return
      }
      streamPdf(res, snapshot)
    } catch (err) {
      console.error('[Reports] pdf error:', err)
      if (!res.headersSent) res.status(500).json({ error: 'Failed to generate PDF' })
    }
  })

  // POST /api/reports/:id/share — create a secure share link.
  router.post('/:id/share', validate(validShareExpiration), (req: Request, res: Response) => {
    try {
      const expiresInDays =
        req.body.expiresInDays === undefined || req.body.expiresInDays === null
          ? null
          : Number(req.body.expiresInDays)
      const result = service.createShare(String(req.params.id), expiresInDays)
      if (!result) {
        res.status(404).json({ error: 'Report not found' })
        return
      }
      const link = `${req.protocol}://${req.get('host')}/shared/report/${result.token}`
      const share = service.listShares(String(req.params.id))?.find((s) => s.id === result.shareId)
      res.status(201).json({ token: result.token, link, share })
    } catch (err) {
      console.error('[Reports] share error:', err)
      res.status(500).json({ error: 'Failed to create share link' })
    }
  })

  // GET /api/reports/:id/shares — list share links for a report.
  router.get('/:id/shares', (req: Request, res: Response) => {
    try {
      const shares = service.listShares(String(req.params.id))
      if (!shares) {
        res.status(404).json({ error: 'Report not found' })
        return
      }
      res.json(shares)
    } catch (err) {
      console.error('[Reports] shares error:', err)
      res.status(500).json({ error: 'Failed to list share links' })
    }
  })

  // DELETE /api/reports/:id/shares/:shareId — revoke a share link.
  router.delete('/:id/shares/:shareId', (req: Request, res: Response) => {
    try {
      const revoked = service.revokeShare(String(req.params.id), String(req.params.shareId))
      if (!revoked) {
        res.status(404).json({ error: 'Share link not found' })
        return
      }
      res.status(204).send()
    } catch (err) {
      console.error('[Reports] revoke error:', err)
      res.status(500).json({ error: 'Failed to revoke share link' })
    }
  })

  return router
}

/** Public shared-report endpoints — token is the credential. */
export function createSharedReportRouter(db: Database.Database): Router {
  const router = Router()
  const service = new ReportService(
    new ReportRepository(db),
    new AnalyticsService(new AnalyticsRepository(db)),
  )

  router.use(rateLimit(60, 60_000))

  const fail = (res: Response, status: number) => {
    res.status(status).json({ error: 'This report link is no longer available.' })
  }

  // GET /api/shared/reports/:token — read-only snapshot + share metadata.
  router.get('/:token', (req: Request, res: Response) => {
    const result = service.resolveShareToken(String(req.params.token))
    if (result.status !== 'ok') {
      fail(res, result.status === 'not_found' ? 404 : 410)
      return
    }
    service.recordShareView(result.share.id)
    res.json({
      report: result.snapshot,
      share: {
        expiresAt: result.share.expiresAt,
        viewCount: result.share.viewCount + 1,
        canDownload: true,
      },
    })
  })

  // GET /api/shared/reports/:token/pdf — download the same snapshot's PDF.
  router.get('/:token/pdf', (req: Request, res: Response) => {
    const result = service.resolveShareToken(String(req.params.token))
    if (result.status !== 'ok') {
      fail(res, result.status === 'not_found' ? 404 : 410)
      return
    }
    service.recordShareView(result.share.id)
    streamPdf(res, result.snapshot)
  })

  return router
}

function streamPdf(res: Response, snapshot: import('./report.types').ReportSnapshot): void {
  const doc = generateReportPdf(snapshot)
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${reportPdfFilename(snapshot)}"`,
  )
  res.setHeader('Cache-Control', 'no-store')
  doc.on('error', (err) => {
    console.error('[Reports] PDF stream error:', err)
    if (!res.headersSent) res.status(500).end()
  })
  doc.pipe(res)
  doc.end()
}
