/**
 * Server-side PDF generation (pdfkit).
 * Produces a structured, print-ready A4 financial report from an immutable
 * ReportSnapshot — no browser, no screenshots. Charts are drawn with
 * vector primitives so they stay crisp and printable.
 */
import PDFDocument from 'pdfkit'
import type {
  ReportDeadline,
  ReportEngagement,
  ReportSnapshot,
  ReportSummary,
  ReportGoalDetail,
  ReportSavingsPoint,
} from './report.types'
import type {
  GoalPerformanceEntry,
  PortfolioDistribution,
  GoalHealthResult,
  ActivityEntry,
} from '../analytics/analytics.types'

// ── Layout constants (A4 portrait, points) ────────────────────────────
const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN_LEFT = 48
const MARGIN_RIGHT = 48
const MARGIN_TOP = 56
const MARGIN_BOTTOM = 64
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT

// ── Print palette (light surface only) ────────────────────────────────
const C = {
  navy: '#0f172a',
  slate: '#334155',
  gray: '#64748b',
  lightGray: '#cbd5e1',
  hairline: '#e2e8f0',
  surface: '#f8fafc',
  white: '#ffffff',
  primary: '#2563eb',
  success: '#16a34a',
  warning: '#d97706',
  error: '#dc2626',
  info: '#0284c7',
  amber: '#f59e0b',
  red: '#ef4444',
}

const DISTRIBUTION_COLORS = [C.primary, C.success, C.warning, C.error, C.info, '#93c5fd', '#4ade80', '#fbbf24']

const STATUS_LABELS: Record<string, string> = {
  completed: 'Completed',
  on_track: 'On Track',
  attention: 'Attention',
  overdue: 'Overdue',
}

const ACTIVITY_LABELS: Record<string, string> = {
  GOAL_CREATED: 'Goal created',
  GOAL_UPDATED: 'Balance updated',
  GOAL_COMPLETED: 'Goal completed',
  GOAL_DELETED: 'Goal deleted',
  MILESTONE_REACHED: 'Milestone reached',
}

// ── Formatting helpers ────────────────────────────────────────────────

export function formatMoney(amount: number): string {
  return '$' + Math.round(amount).toLocaleString('en-US')
}

function formatShortMoney(amount: number): string {
  const abs = Math.abs(amount)
  if (abs >= 1_000_000) return '$' + (amount / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (abs >= 1_000) return '$' + Math.round(amount / 1_000) + 'K'
  return formatMoney(amount)
}

function formatPercent(value: number): string {
  return `${Math.round(value)}%`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
}

function progressColor(p: number): string {
  if (p >= 75) return C.success
  if (p >= 50) return C.primary
  if (p >= 25) return C.amber
  return C.red
}

function statusColor(status: string): string {
  switch (status) {
    case 'completed':
      return C.success
    case 'on_track':
      return C.info
    case 'attention':
      return C.warning
    case 'overdue':
      return C.error
    default:
      return C.gray
  }
}

function statusBg(status: string): string {
  switch (status) {
    case 'completed':
      return '#dcfce7'
    case 'on_track':
      return '#e0f2fe'
    case 'attention':
      return '#fef3c7'
    case 'overdue':
      return '#fee2e2'
    default:
      return C.surface
  }
}

function ensureSpace(doc: PDFKit.PDFDocument, needed: number): void {
  if (doc.y + needed > PAGE_HEIGHT - MARGIN_BOTTOM) doc.addPage()
}

// ── Section headings ──────────────────────────────────────────────────

function sectionHeading(doc: PDFKit.PDFDocument, title: string): void {
  ensureSpace(doc, 60)
  doc.y += 12
  // Accent bar
  doc.save().rect(MARGIN_LEFT, doc.y - 1, 4, 14).fill(C.primary).restore()
  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor(C.navy)
    .text(title.toUpperCase(), MARGIN_LEFT + 12, doc.y, { lineBreak: false })
  doc.y += 10
  doc
    .moveTo(MARGIN_LEFT, doc.y)
    .lineTo(PAGE_WIDTH - MARGIN_RIGHT, doc.y)
    .lineWidth(0.6)
    .strokeColor(C.hairline)
    .stroke()
  doc.y += 14
}

function subText(doc: PDFKit.PDFDocument, text: string): void {
  doc.font('Helvetica').fontSize(9).fillColor(C.gray).text(text, MARGIN_LEFT, doc.y, {
    width: CONTENT_WIDTH,
    lineBreak: true,
  })
  doc.y += 4
}

// ── Header / cover ────────────────────────────────────────────────────

function drawHeader(doc: PDFKit.PDFDocument, snapshot: ReportSnapshot): void {
  // Top brand band
  doc.save().rect(0, 0, PAGE_WIDTH, 6).fill(C.primary).restore()
  doc.y = MARGIN_TOP - 6
  doc.font('Helvetica-Bold').fontSize(8).fillColor(C.gray).text('COMMBANK GOAL TRACKER', MARGIN_LEFT, doc.y, {
    lineBreak: false,
    characterSpacing: 1.2,
  })
  doc.y += 8

  doc.font('Helvetica-Bold').fontSize(24).fillColor(C.navy).text(snapshot.title, MARGIN_LEFT, doc.y, {
    width: CONTENT_WIDTH,
    lineBreak: true,
  })
  doc.y += 6
  doc.font('Helvetica').fontSize(12).fillColor(C.gray).text('FINANCIAL GOALS ANALYTICS REPORT', MARGIN_LEFT, doc.y, {
    lineBreak: false,
    characterSpacing: 0.6,
  })
  doc.y += 18

  // Meta strip
  const meta: Array<[string, string]> = [
    ['Reporting period', snapshot.period.label],
    ['Generated', formatDate(snapshot.generatedAt)],
    ['Goals included', snapshot.filters.goalCount + (snapshot.filters.goalIds === 'all' ? ' (all)' : ' (selected)')],
  ]
  const stripY = doc.y
  doc.save().rect(MARGIN_LEFT, stripY, CONTENT_WIDTH, 44).fill(C.surface).restore()
  let x = MARGIN_LEFT + 14
  for (const [label, value] of meta) {
    doc.font('Helvetica').fontSize(7.5).fillColor(C.gray).text(label.toUpperCase(), x, stripY + 8, { lineBreak: false })
    doc.font('Helvetica-Bold').fontSize(10).fillColor(C.navy).text(value, x, stripY + 19, { lineBreak: false })
    x += CONTENT_WIDTH / 3
  }
  doc.y = stripY + 56
}

// ── Executive summary KPI boxes ───────────────────────────────────────

function drawSummary(doc: PDFKit.PDFDocument, summary: ReportSummary): void {
  const items: Array<[string, string]> = [
    ['Total Saved', formatMoney(summary.totalSaved)],
    ['Target Value', formatMoney(summary.totalTarget)],
    ['Overall Progress', formatPercent(summary.averageProgress)],
    ['Active Goals', String(summary.activeGoals)],
    ['Completed Goals', String(summary.completedGoals)],
  ]
  const boxW = (CONTENT_WIDTH - 3 * 12) / 4
  const boxH = 52
  const rowCount = 2
  items.forEach(([label, value], i) => {
    const col = i % 4
    const row = Math.floor(i / 4)
    if (row >= rowCount) return
    const bx = MARGIN_LEFT + col * (boxW + 12)
    const by = doc.y + row * (boxH + 12)
    ensureSpace(doc, (row + 1) * (boxH + 12) + 4)
    doc.save().rect(bx, by, boxW, boxH).fill(C.white).lineWidth(1).strokeColor(C.hairline).stroke().restore()
    doc.font('Helvetica').fontSize(7.5).fillColor(C.gray).text(label.toUpperCase(), bx + 10, by + 9, {
      width: boxW - 20,
      lineBreak: false,
    })
    doc.font('Helvetica-Bold').fontSize(15).fillColor(C.navy).text(value, bx + 10, by + 24, {
      width: boxW - 20,
      lineBreak: false,
    })
  })
  doc.y += rowCount * (boxH + 12) + 2
}

// ── Savings growth (area chart) ───────────────────────────────────────

function drawAreaChart(doc: PDFKit.PDFDocument, data: ReportSavingsPoint[]): void {
  if (data.length === 0) {
    subText(doc, 'No savings history available for the selected period.')
    return
  }
  const chartLeft = MARGIN_LEFT + 56
  const chartRight = PAGE_WIDTH - MARGIN_RIGHT
  const chartWidth = chartRight - chartLeft
  const chartTop = doc.y + 8
  const chartHeight = 150
  const chartBottom = chartTop + chartHeight

  const maxValue = Math.max(...data.map((d) => d.amount)) * 1.15 || 1
  const niceMax = Math.ceil(maxValue / 1000) * 1000 || 1000

  const xFor = (i: number) => chartLeft + (i / Math.max(data.length - 1, 1)) * chartWidth
  const yFor = (v: number) => chartBottom - (v / niceMax) * chartHeight

  // Gridlines + y labels
  for (let g = 0; g <= 4; g++) {
    const frac = g / 4
    const gy = chartBottom - frac * chartHeight
    doc
      .moveTo(chartLeft, gy)
      .lineTo(chartRight, gy)
      .lineWidth(0.5)
      .strokeColor(g === 0 ? C.lightGray : C.hairline)
      .stroke()
    doc.font('Helvetica').fontSize(7).fillColor(C.gray).text(formatShortMoney((frac * niceMax)), MARGIN_LEFT, gy - 3, {
      lineBreak: false,
    })
  }

  // Area + line
  const points = data.map((d, i) => ({ x: xFor(i), y: yFor(d.amount) }))
  doc.save()
  doc.moveTo(points[0].x, chartBottom)
  for (const p of points) doc.lineTo(p.x, p.y)
  doc.lineTo(points[points.length - 1].x, chartBottom)
  doc.closePath().fillOpacity(0.25).fill(C.primary)
  doc.restore()
  doc.save()
  doc.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) doc.lineTo(points[i].x, points[i].y)
  doc.lineWidth(1.8).strokeColor(C.primary).stroke()
  doc.restore()

  // X labels (≤ 6, evenly spaced)
  const labelStep = Math.max(1, Math.floor(data.length / 6))
  for (let i = 0; i < data.length; i += labelStep) {
    const d = new Date(data[i].date)
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    doc.font('Helvetica').fontSize(7).fillColor(C.gray).text(label, xFor(i) - 14, chartBottom + 6, {
      lineBreak: false,
      width: 30,
    })
  }
  doc.y = chartBottom + 24
  subText(doc, `Total saved across ${data.length} recorded data points in the reporting period.`)
}

// ── Goal performance (horizontal bars) ────────────────────────────────

function drawBarChart(doc: PDFKit.PDFDocument, data: GoalPerformanceEntry[]): void {
  const barTop = doc.y + 10
  const labelW = 118
  const barX = MARGIN_LEFT + labelW + 4
  const maxBarW = CONTENT_WIDTH - labelW - 54
  const rowH = 22
  const rows = data.slice(0, 10)

  rows.forEach((goal, i) => {
    ensureSpace(doc, (i + 1) * rowH + 8)
    const y = barTop + i * rowH
    const name = goal.name.length > 26 ? goal.name.slice(0, 25) + '…' : goal.name
    doc.font('Helvetica').fontSize(8.5).fillColor(C.slate).text(name, MARGIN_LEFT, y + 3, {
      width: labelW,
      lineBreak: false,
    })
    const barW = Math.max((goal.progressPercent / 100) * maxBarW, 2)
    doc.save().rect(barX, y + 2, barW, 12).fill(progressColor(goal.progressPercent)).restore()
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(C.navy).text(formatPercent(goal.progressPercent), barX + barW + 6, y + 3, {
      lineBreak: false,
    })
  })
  doc.y = barTop + rows.length * rowH + 10
}

// ── Portfolio distribution (donut) ────────────────────────────────────

function drawDonut(doc: PDFKit.PDFDocument, data: PortfolioDistribution[]): void {
  if (data.length === 0) {
    subText(doc, 'No goals to display distribution.')
    return
  }
  const cx = MARGIN_LEFT + 86
  const cy = doc.y + 78
  const outerR = 58
  const innerR = 36
  const total = data.reduce((s, d) => s + d.percentage, 0) || 1

  let angle = -Math.PI / 2
  data.forEach((d, i) => {
    const sweep = (d.percentage / total) * Math.PI * 2
    const color = DISTRIBUTION_COLORS[i % DISTRIBUTION_COLORS.length]
    const steps = 48
    doc.save()
    for (let s = 0; s <= steps; s++) {
      const a = angle + (sweep * s) / steps
      const x = cx + outerR * Math.cos(a)
      const y = cy + outerR * Math.sin(a)
      if (s === 0) doc.moveTo(x, y)
      else doc.lineTo(x, y)
    }
    for (let s = steps; s >= 0; s--) {
      const a = angle + (sweep * s) / steps
      const x = cx + innerR * Math.cos(a)
      const y = cy + innerR * Math.sin(a)
      doc.lineTo(x, y)
    }
    doc.closePath().fill(color)
    doc.restore()
    angle += sweep
  })

  // Center label
  doc.font('Helvetica-Bold').fontSize(13).fillColor(C.navy).text(formatPercent(100), cx - 12, cy - 8, { lineBreak: false })

  // Legend (right of donut)
  let ly = cy - (data.length * 12) / 2
  const legendX = MARGIN_LEFT + 168
  data.forEach((d, i) => {
    const color = DISTRIBUTION_COLORS[i % DISTRIBUTION_COLORS.length]
    doc.save().rect(legendX, ly + 2, 8, 8).fill(color).restore()
    const name = d.name.length > 20 ? d.name.slice(0, 19) + '…' : d.name
    doc.font('Helvetica').fontSize(8.5).fillColor(C.slate).text(name, legendX + 14, ly, {
      width: CONTENT_WIDTH - legendX - 60,
      lineBreak: false,
    })
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(C.navy).text(formatPercent(d.percentage), legendX + CONTENT_WIDTH - legendX - 34, ly, {
      lineBreak: false,
      width: 40,
    })
    ly += 14
  })
  doc.y = cy + outerR + 24
}

// ── Goal health ───────────────────────────────────────────────────────

function drawHealth(doc: PDFKit.PDFDocument, health: GoalHealthResult): void {
  const items: Array<[string, number, string, string]> = [
    ['Completed', health.completed.length, C.success, '#dcfce7'],
    ['On Track', health.onTrack.length, C.info, '#e0f2fe'],
    ['Attention', health.attention.length, C.warning, '#fef3c7'],
    ['Overdue', health.overdue.length, C.error, '#fee2e2'],
  ]
  const boxW = (CONTENT_WIDTH - 3 * 10) / 4
  const boxH = 54
  ensureSpace(doc, boxH + 8)
  items.forEach(([label, count, color, bg], i) => {
    const bx = MARGIN_LEFT + i * (boxW + 10)
    doc.save().rect(bx, doc.y, boxW, boxH).fill(bg).restore()
    doc.font('Helvetica-Bold').fontSize(18).fillColor(color).text(String(count), bx + 12, doc.y + 8, { lineBreak: false })
    doc.font('Helvetica').fontSize(7.5).fillColor(C.slate).text(label.toUpperCase(), bx + 12, doc.y + 32, { lineBreak: false })
  })
  doc.y += boxH + 10
}

// ── Tables ────────────────────────────────────────────────────────────

interface TableCol {
  title: string
  width: number
  align: 'left' | 'right' | 'center'
  color?: (row: string[]) => string | null
}

function drawTable(
  doc: PDFKit.PDFDocument,
  cols: TableCol[],
  rows: string[][],
  rowColors?: Array<((cells: string[]) => string | null) | undefined>,
): void {
  const rowH = 20
  const headerH = 22

  const drawHeader = () => {
    doc.save().rect(MARGIN_LEFT, doc.y, CONTENT_WIDTH, headerH).fill(C.navy).restore()
    let x = MARGIN_LEFT
    cols.forEach((c) => {
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C.white)
      if (c.align === 'center') {
        doc.text(c.title.toUpperCase(), x, doc.y + 7, { width: c.width, lineBreak: false, align: 'center' })
      } else {
        const textX = c.align === 'left' ? x + 8 : x + c.width - 8
        doc.text(c.title.toUpperCase(), textX, doc.y + 7, {
          width: c.width - 16,
          lineBreak: false,
          align: c.align,
        })
      }
      x += c.width
    })
    doc.y += headerH
  }

  ensureSpace(doc, headerH + rowH + 4)
  drawHeader()

  rows.forEach((row, i) => {
    if (doc.y + rowH > PAGE_HEIGHT - MARGIN_BOTTOM) {
      doc.addPage()
      drawHeader()
    }
    const bg = i % 2 === 0 ? C.white : C.surface
    doc.save().rect(MARGIN_LEFT, doc.y, CONTENT_WIDTH, rowH).fill(bg).restore()
    let x = MARGIN_LEFT
    cols.forEach((c, ci) => {
      const value = row[ci] ?? ''
      const customColor = rowColors?.[ci]?.(row) ?? null
      if (customColor) {
        // Status pill
        const pw = c.width - 12
        const py = doc.y + 3
        doc.save().rect(x + 6, py, pw, 14).fill(statusBg(customColor)).restore()
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor(statusColor(customColor))
        doc.text(value, x + 6, py + 3.5, { width: pw, lineBreak: false, align: 'center' })
      } else {
        doc.font(c.align === 'right' ? 'Helvetica' : 'Helvetica')
        doc.fontSize(8).fillColor(C.slate)
        const textX = c.align === 'left' ? x + 8 : c.align === 'right' ? x + c.width - 8 : x + c.width / 2
        doc.text(value, textX, doc.y + 6, {
          width: c.align === 'center' ? 0 : c.width - 16,
          lineBreak: false,
          align: c.align === 'center' ? 'center' : c.align,
        })
      }
      x += c.width
    })
    doc.y += rowH
  })
  doc.y += 8
}

// ── Consistency & engagement ──────────────────────────────────────────

function drawEngagement(doc: PDFKit.PDFDocument, data: ReportEngagement): void {
  // KPI strip
  const items: Array<[string, string]> = [
    ['Current Streak', `${data.currentStreak} day${data.currentStreak === 1 ? '' : 's'}`],
    ['Longest Streak', `${data.longestStreak} day${data.longestStreak === 1 ? '' : 's'}`],
    ['Active Days', String(data.activeDays)],
    ['This Week', `${data.activeDaysThisWeek} / 7`],
    ['Weekly Consistency', formatPercent(data.weeklyConsistency)],
  ]
  const boxW = (CONTENT_WIDTH - 4 * 12) / 5
  const boxH = 46
  ensureSpace(doc, boxH + 8)
  items.forEach(([label, value], i) => {
    const bx = MARGIN_LEFT + i * (boxW + 12)
    doc.save().rect(bx, doc.y, boxW, boxH).fill(C.white).lineWidth(1).strokeColor(C.hairline).stroke().restore()
    doc.font('Helvetica').fontSize(6.5).fillColor(C.gray).text(label.toUpperCase(), bx + 8, doc.y + 8, {
      width: boxW - 16,
      lineBreak: false,
    })
    doc.font('Helvetica-Bold').fontSize(12).fillColor(C.navy).text(value, bx + 8, doc.y + 22, {
      width: boxW - 16,
      lineBreak: false,
    })
  })
  doc.y += boxH + 12

  // Activity heatmap (last 30 days as a 10-col × 3-row grid)
  if (data.heatmap.length > 0) {
    subText(doc, 'Activity heatmap — daily check-ins over the last 30 days.')
    const cell = 13
    const gap = 3
    const cols = 10
    const startX = MARGIN_LEFT
    ensureSpace(doc, 4 * (cell + gap) + 20)
    data.heatmap.forEach((day, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const x = startX + col * (cell + gap)
      const y = doc.y + row * (cell + gap)
      const level = day.count > 0 ? Math.min(Math.max(day.count, 1), 5) : 0
      const fill =
        level === 0 ? C.surface : level <= 1 ? '#dbeafe' : level <= 2 ? '#93c5fd' : level <= 4 ? '#3b82f6' : C.primary
      doc.save().rect(x, y, cell, cell).fill(fill).restore()
    })
    doc.y += 3 * (cell + gap) + 6
    subText(doc, 'Darker cells indicate more activity on that day.')
  }

  // Weekly review metrics
  const metrics: Array<[string, string]> = [
    ['Goals reviewed', String(data.goalsReviewed)],
    ['Goals updated', String(data.goalsUpdated)],
    ['Progress added', formatMoney(data.progressAdded)],
    ['Milestones reached', String(data.milestonesReached)],
    ['Reports generated', String(data.reportsGenerated)],
  ]
  const cols: TableCol[] = [
    { title: 'Metric', width: 180, align: 'left' },
    { title: 'This week', width: 120, align: 'right' },
  ]
  drawTable(
    doc,
    cols,
    metrics.map(([label, value]) => [label, value]),
  )
}

// ── Activity summary ──────────────────────────────────────────────────

function drawActivity(doc: PDFKit.PDFDocument, activities: ActivityEntry[]): void {
  if (activities.length === 0) {
    subText(doc, 'No activity recorded in the selected period.')
    return
  }
  activities.forEach((a) => {
    ensureSpace(doc, 24)
    const date = new Date(a.createdAt)
    const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    const goalName = a.metadata && typeof a.metadata.name === 'string' ? a.metadata.name : null
    const label = ACTIVITY_LABELS[a.type] ?? a.type.replace(/_/g, ' ').toLowerCase()

    doc.font('Helvetica').fontSize(8).fillColor(C.gray).text(dateLabel, MARGIN_LEFT, doc.y, {
      width: 74,
      lineBreak: false,
    })
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(C.navy)
    doc.text(label, MARGIN_LEFT + 80, doc.y, {
      width: CONTENT_WIDTH - 80,
      lineBreak: false,
    })
    if (goalName) {
      doc.font('Helvetica').fontSize(8).fillColor(C.gray)
      doc.text(goalName, MARGIN_LEFT + 80, doc.y + 11, {
        width: CONTENT_WIDTH - 80,
        lineBreak: false,
      })
      doc.y += 22
    } else {
      doc.y += 14
    }
  })
  doc.y += 4
}

// ── Main entry point ──────────────────────────────────────────────────

export function generateReportPdf(snapshot: ReportSnapshot): PDFKit.PDFDocument {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: MARGIN_TOP, bottom: MARGIN_BOTTOM, left: MARGIN_LEFT, right: MARGIN_RIGHT },
    bufferPages: true,
    info: {
      Title: snapshot.title,
      Author: 'CommBank Goal Tracker',
      Subject: 'Financial Goals Analytics Report',
      CreationDate: new Date(snapshot.generatedAt),
    },
  })

  drawHeader(doc, snapshot)

  // A section is rendered only when it was selected in the report config
  // (persisted as filters.sections) AND its data is present in the snapshot.
  const selected = new Set(snapshot.filters.sections ?? [])
  const present: Record<string, boolean> = {
    executiveSummary: selected.has('executiveSummary'),
    savingsGrowth: selected.has('savingsGrowth') && !!snapshot.savingsTrend,
    goalPerformance: selected.has('goalPerformance') && !!snapshot.goalPerformance,
    distribution: selected.has('distribution') && !!snapshot.distribution,
    health: selected.has('health') && !!snapshot.health,
    deadlines: selected.has('deadlines') && !!snapshot.deadlines,
    goalDetails: selected.has('goalDetails') && !!snapshot.goalDetails,
    activities: selected.has('activities') && !!snapshot.activities,
    engagement: selected.has('engagement') && !!snapshot.engagement,
  }

  if (present.executiveSummary) {
    sectionHeading(doc, 'Executive Summary')
    drawSummary(doc, snapshot.summary)
  }

  if (present.savingsGrowth) {
    sectionHeading(doc, 'Savings Growth')
    subText(doc, 'Cumulative balance across goals over the reporting period.')
    drawAreaChart(doc, snapshot.savingsTrend as ReportSavingsPoint[])
  }

  if (present.goalPerformance) {
    sectionHeading(doc, 'Goal Performance')
    drawBarChart(doc, snapshot.goalPerformance as GoalPerformanceEntry[])
  }

  if (present.distribution) {
    sectionHeading(doc, 'Portfolio Distribution')
    subText(doc, 'Share of total target value by goal.')
    drawDonut(doc, snapshot.distribution as PortfolioDistribution[])
  }

  if (present.health) {
    sectionHeading(doc, 'Goal Health')
    drawHealth(doc, snapshot.health as GoalHealthResult)
  }

  if (present.deadlines) {
    sectionHeading(doc, 'Upcoming Deadlines')
    const cols: TableCol[] = [
      { title: 'Goal', width: 230, align: 'left' },
      { title: 'Deadline', width: 130, align: 'left' },
      { title: 'Progress', width: 70, align: 'right' },
      { title: 'Status', width: 69, align: 'center' },
    ]
    const rows = (snapshot.deadlines as ReportDeadline[]).map((d) => [
      d.name,
      formatDate(d.targetDate),
      formatPercent(d.progressPercent),
      STATUS_LABELS[d.status] ?? 'On Track',
    ])
    drawTable(doc, cols, rows, [undefined, undefined, undefined, (row) => (row[3] ? statusKeyFromLabel(row[3]) : null)])
  }

  if (present.goalDetails) {
    sectionHeading(doc, 'Goal Details')
    const cols: TableCol[] = [
      { title: 'Goal', width: 150, align: 'left' },
      { title: 'Saved', width: 78, align: 'right' },
      { title: 'Target', width: 78, align: 'right' },
      { title: 'Progress', width: 60, align: 'right' },
      { title: 'Deadline', width: 75, align: 'left' },
      { title: 'Status', width: 58, align: 'center' },
    ]
    const rows = (snapshot.goalDetails as ReportGoalDetail[]).map((g) => [
      g.name,
      formatMoney(g.balance),
      formatMoney(g.targetAmount),
      formatPercent(g.progressPercent),
      formatDate(g.targetDate),
      STATUS_LABELS[g.status] ?? 'On Track',
    ])
    drawTable(doc, cols, rows, [undefined, undefined, undefined, undefined, undefined, (row) => (row[5] ? statusKeyFromLabel(row[5]) : null)])
  }

  if (present.activities) {
    sectionHeading(doc, 'Activity Summary')
    drawActivity(doc, snapshot.activities as ActivityEntry[])
  }

  if (present.engagement) {
    sectionHeading(doc, 'Consistency & Engagement')
    drawEngagement(doc, snapshot.engagement as ReportEngagement)
  }

  // Footer + page numbers — drawn after layout so the count is exact.
  // (Drawing below the bottom margin would otherwise trigger pdfkit's
  // auto page-break and recurse, so margins are widened temporarily.)
  const range = doc.bufferedPageRange()
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i)
    const pageNum = i - range.start + 1
    const savedBottom = doc.page.margins.bottom
    doc.page.margins.bottom = 10
    doc
      .moveTo(MARGIN_LEFT, PAGE_HEIGHT - 48)
      .lineTo(PAGE_WIDTH - MARGIN_RIGHT, PAGE_HEIGHT - 48)
      .lineWidth(0.5)
      .strokeColor(C.hairline)
      .stroke()
    doc.font('Helvetica').fontSize(7).fillColor(C.gray)
    doc.text(`CommBank Goal Tracker · Generated ${formatDate(snapshot.generatedAt)}`, MARGIN_LEFT, PAGE_HEIGHT - 36, {
      lineBreak: false,
    })
    doc.text(`Page ${pageNum}`, PAGE_WIDTH - MARGIN_RIGHT - 40, PAGE_HEIGHT - 36, {
      lineBreak: false,
      width: 40,
      align: 'right',
    })
    doc.page.margins.bottom = savedBottom
  }
  doc.flushPages()

  return doc
}

function statusKeyFromLabel(label: string): string {
  switch (label) {
    case 'Completed': return 'completed'
    case 'On Track': return 'on_track'
    case 'Attention': return 'attention'
    case 'Overdue': return 'overdue'
    default: return 'on_track'
  }
}

/** Meaningful download filename, e.g. financial-goals-report-2026-07.pdf */
export function reportPdfFilename(snapshot: ReportSnapshot): string {
  const d = new Date(snapshot.generatedAt)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `financial-goals-report-${d.getFullYear()}-${mm}.pdf`
}
