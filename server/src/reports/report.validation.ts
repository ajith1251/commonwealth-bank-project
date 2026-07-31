/**
 * Report validation rules — compatible with the existing `validate`
 * middleware from server/src/middleware/validate.ts.
 */
import { REPORT_PERIODS, REPORT_SECTION_KEYS, SHARE_EXPIRATION_DAYS } from './report.types'

interface ValidationError {
  field: string
  message: string
}

type Rule = (body: Record<string, unknown>) => ValidationError | null

/** Optional title: string, trimmed, 1–80 characters. */
export const validReportTitle: Rule = (body) => {
  if (body.title === undefined || body.title === null || body.title === '') return null
  if (typeof body.title !== 'string') {
    return { field: 'title', message: 'Title must be a string' }
  }
  const trimmed = body.title.trim()
  if (trimmed.length === 0) {
    return { field: 'title', message: 'Title cannot be empty' }
  }
  if (trimmed.length > 80) {
    return { field: 'title', message: 'Title must be 80 characters or fewer' }
  }
  return null
}

/** Required period: one of the supported presets. */
export const validReportPeriod: Rule = (body) => {
  const period = body.period
  if (typeof period !== 'string' || !REPORT_PERIODS.includes(period as never)) {
    return { field: 'period', message: 'Period must be one of: ' + REPORT_PERIODS.join(', ') }
  }
  return null
}

/** Custom ranges must be valid dates with start <= end. */
export const validCustomRange: Rule = (body) => {
  if (body.period !== 'custom') return null
  const start = body.startDate
  const end = body.endDate
  if (typeof start !== 'string' || typeof end !== 'string') {
    return { field: 'startDate', message: 'Custom period requires startDate and endDate' }
  }
  const startTime = new Date(start).getTime()
  const endTime = new Date(end).getTime()
  if (isNaN(startTime) || isNaN(endTime)) {
    return { field: 'startDate', message: 'Custom period dates must be valid date strings' }
  }
  if (startTime > endTime) {
    return { field: 'startDate', message: 'startDate must be on or before endDate' }
  }
  return null
}

/** Goal scope: 'all' or a non-empty array of string IDs. */
export const validGoalIds: Rule = (body) => {
  const goalIds = body.goalIds
  if (goalIds === 'all') return null
  if (
    !Array.isArray(goalIds) ||
    goalIds.length === 0 ||
    goalIds.some((g) => typeof g !== 'string' || g.trim() === '')
  ) {
    return { field: 'goalIds', message: 'goalIds must be "all" or a non-empty array of goal IDs' }
  }
  return null
}

/** Sections: non-empty array of valid section keys. */
export const validSections: Rule = (body) => {
  const sections = body.sections
  if (
    !Array.isArray(sections) ||
    sections.length === 0 ||
    sections.some((s) => !REPORT_SECTION_KEYS.includes(s as never))
  ) {
    return {
      field: 'sections',
      message: 'sections must be a non-empty array of valid section keys',
    }
  }
  return null
}

/** Share expiration: null/undefined (no expiry) or one of {1, 7, 30} days. */
export const validShareExpiration: Rule = (body) => {
  const expiresInDays = body.expiresInDays
  if (
    expiresInDays === undefined ||
    expiresInDays === null ||
    (typeof expiresInDays === 'number' &&
      SHARE_EXPIRATION_DAYS.includes(expiresInDays as never))
  ) {
    return null
  }
  return {
    field: 'expiresInDays',
    message: 'expiresInDays must be null, 1, 7 or 30',
  }
}
