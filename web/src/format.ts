/**
 * Shared number/date formatting — single source of truth so the same value
 * renders identically across Overview, Goals, Analytics, Reports, PDF & share.
 */

const CURRENCY = 'USD'
const LOCALE = 'en-US'

/** ₹284,500 style — compact whole currency with group separators. */
export function formatCurrency(amount: number, opts?: { compact?: boolean }): string {
  if (opts?.compact) {
    // Compact notation for tight spaces, e.g. $284.5K
    return new Intl.NumberFormat(LOCALE, {
      style: 'currency',
      currency: CURRENCY,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount)
  }
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: CURRENCY,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/** 43.8% — one decimal, no forced sign. */
export function formatPercent(value: number, digits = 1): string {
  return `${value.toLocaleString(LOCALE, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`
}

/** 30 Jul 2026 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return String(date)
  return d.toLocaleDateString(LOCALE, { day: 'numeric', month: 'short', year: 'numeric' })
}

/** 30 July 2026 — long form (drawer hero, PDFs). */
export function formatDateLong(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return String(date)
  return d.toLocaleDateString(LOCALE, { day: 'numeric', month: 'long', year: 'numeric' })
}

/** 2 days ago / today / yesterday */
export function formatRelativeDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diffDays = Math.round((startOf(now) - startOf(d)) / (1000 * 60 * 60 * 24))
  if (diffDays <= 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${diffDays >= 14 ? 's' : ''} ago`
  return formatDate(d)
}

/** Days until a target date (positive = future, negative = overdue). */
export function daysUntil(targetDate: string): number {
  const now = new Date()
  const target = new Date(targetDate)
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

/** "38d left" / "Due today" / "2d overdue" — compact, used on cards. */
export function formatDeadline(targetDate: string): string {
  const days = daysUntil(targetDate)
  if (days < 0) return `${Math.abs(days)}d overdue`
  if (days === 0) return 'Due today'
  if (days <= 7) return `${days}d left`
  const weeks = Math.floor(days / 7)
  if (weeks <= 4) return `${weeks}w left`
  const months = Math.floor(days / 30)
  if (months <= 12) return `${months}mo left`
  return `>1y left`
}

/** Full sentence version for detail views: "due in 38 days". */
export function formatDeadlinePhrase(targetDate: string): string {
  const days = daysUntil(targetDate)
  if (days < 0) return `${Math.abs(days)} days overdue`
  if (days === 0) return 'due today'
  if (days === 1) return 'due in 1 day'
  return `due in ${days} days`
}
