import { describe, it, expect } from 'vitest'
import { parseFilename, ALL_SECTIONS, REPORT_SECTION_LABELS } from '../reports'

describe('parseFilename', () => {
  it('extracts a quoted filename from Content-Disposition', () => {
    expect(parseFilename('attachment; filename="financial-goals-report-2026-07.pdf"')).toBe(
      'financial-goals-report-2026-07.pdf',
    )
  })

  it('extracts an unquoted filename', () => {
    expect(parseFilename('attachment; filename=report.pdf')).toBe('report.pdf')
  })

  it('falls back to a default name when the header is missing', () => {
    expect(parseFilename(undefined)).toBe('financial-goals-report.pdf')
    expect(parseFilename('')).toBe('financial-goals-report.pdf')
  })
})

describe('report sections', () => {
  it('exposes every toggleable section with a label', () => {
    expect(ALL_SECTIONS.length).toBeGreaterThan(0)
    for (const key of ALL_SECTIONS) {
      expect(REPORT_SECTION_LABELS[key]).toBeTruthy()
    }
  })
})
