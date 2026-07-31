/**
 * Engagement Service — daily check-ins, streak math, weekly review,
 * next best actions, achievements and the focus goal.
 *
 * Streak state is authoritative here (never computed only in React).
 * Date handling uses LOCAL calendar days ('YYYY-MM-DD') so the current
 * `today` is injectable for deterministic tests.
 */
import { EngagementRepository } from './engagement.repository'
import {
  ACHIEVEMENTS,
  type Achievement,
  type CalendarDay,
  type CalendarData,
  type CheckinResult,
  type CheckinType,
  type EngagementSummary,
  type NextBestAction,
  type WeeklyReview,
  type WeekMetrics,
} from './engagement.types'

// ── Pure date helpers (local time) ────────────────────────────────────

export function toDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDays(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + days)
  return toDateKey(date)
}

/** Monday-based day-of-week: Mon=0 … Sun=6. */
export function mondayIndex(date: Date): number {
  return (date.getDay() + 6) % 7
}

export function startOfWeekKey(today: Date): string {
  return addDays(toDateKey(today), -mondayIndex(today))
}

export function dateKeyToIsoStart(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d, 0, 0, 0, 0).toISOString()
}

// ── Streak math (pure, testable) ──────────────────────────────────────

export interface StreakStats {
  currentStreak: number
  longestStreak: number
  activeToday: boolean
  activeDaysThisWeek: number
  activeDaysThisMonth: number
  totalActiveDays: number
  weeklyConsistency: number
  lastActiveAt: string | null
}

/**
 * Calculates streaks from a set of active date keys.
 * currentStreak counts consecutive days ending today (or yesterday when
 * today has not been active yet). longestStreak is the longest historical run.
 */
export function calculateStreaks(activeDates: Set<string>, today: Date): StreakStats {
  const todayKey = toDateKey(today)

  // Current streak — walk backwards from today (or yesterday).
  let currentStreak = 0
  let cursor = activeDates.has(todayKey) ? todayKey : addDays(todayKey, -1)
  while (activeDates.has(cursor)) {
    currentStreak += 1
    cursor = addDays(cursor, -1)
  }

  // Longest streak — linear scan of sorted dates.
  let longestStreak = 0
  let run = 0
  let prev: string | null = null
  const sorted = [...activeDates].sort()
  for (const key of sorted) {
    run = prev !== null && addDays(prev, 1) === key ? run + 1 : 1
    if (run > longestStreak) longestStreak = run
    prev = key
  }

  // This week (Mon–Sun).
  const weekStart = startOfWeekKey(today)
  let activeDaysThisWeek = 0
  for (let i = 0; i < 7; i++) {
    if (activeDates.has(addDays(weekStart, i))) activeDaysThisWeek += 1
  }

  // This month.
  const monthPrefix = todayKey.slice(0, 7)
  let activeDaysThisMonth = 0
  for (const k of activeDates) {
    if (k.startsWith(monthPrefix)) activeDaysThisMonth += 1
  }

  return {
    currentStreak,
    longestStreak,
    activeToday: activeDates.has(todayKey),
    activeDaysThisWeek,
    activeDaysThisMonth,
    totalActiveDays: activeDates.size,
    weeklyConsistency: Math.round((activeDaysThisWeek / 7) * 100),
    lastActiveAt: sorted.length > 0 ? sorted[sorted.length - 1] : null,
  }
}

const WEEK_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export class EngagementService {
  constructor(
    private repo: EngagementRepository,
    private userId: string,
    private today: Date = new Date(),
  ) {}

  // ── Check-in ─────────────────────────────────────────────────────────

  recordCheckin(type: CheckinType): CheckinResult {
    const todayKey = toDateKey(this.today)
    const nowIso = new Date().toISOString()

    const existing = this.repo.findCheckin(this.userId, todayKey)
    if (existing) {
      const types = existing.types.includes(type) ? existing.types : [...existing.types, type]
      this.repo.touchCheckin(this.userId, todayKey, nowIso, types)
    } else {
      this.repo.insertCheckin(this.userId, todayKey, nowIso, [type])
    }

    const newlyUnlocked = this.evaluateAchievements()
    return { summary: this.getSummary(), newlyUnlocked }
  }

  // ── Summary / calendar ───────────────────────────────────────────────

  getSummary(): EngagementSummary {
    const activeDates = new Set(this.repo.listActiveDates(this.userId))
    const stats = calculateStreaks(activeDates, this.today)

    const weekStart = startOfWeekKey(this.today)
    const weekDays = WEEK_LABELS.map((label, i) => ({
      label,
      active: activeDates.has(addDays(weekStart, i)),
    }))

    return {
      userId: this.userId,
      ...stats,
      weekDays,
    }
  }

  /** Calendar with real per-day counts (uses stored activity_count). */
  getCalendarWithCounts(rangeDays: number): CalendarData {
    const range = Math.min(Math.max(rangeDays, 1), 365)
    const todayKey = toDateKey(this.today)
    const startKey = addDays(todayKey, -(range - 1))
    const rows = this.repo.listCheckinsInRange(this.userId, startKey, todayKey)

    const countByDate = new Map<string, number>()
    for (const row of rows) countByDate.set(row.activityDate, row.activityCount)

    const days: CalendarDay[] = []
    for (let i = range - 1; i >= 0; i--) {
      const key = addDays(todayKey, -i)
      days.push({ date: key, count: countByDate.get(key) ?? 0 })
    }
    return { range, days }
  }

  // ── Weekly review ────────────────────────────────────────────────────

  getWeeklyReview(): WeeklyReview {
    const weekStart = startOfWeekKey(this.today)
    const prevWeekStart = addDays(weekStart, -7)
    const weekEnd = addDays(weekStart, 7) // exclusive

    const current = this.computeWeekMetrics(weekStart, weekEnd)
    const previous = this.computeWeekMetrics(prevWeekStart, weekStart)
    const prevHadData =
      previous.activeDays > 0 ||
      previous.goalsReviewed > 0 ||
      previous.goalsUpdated > 0 ||
      previous.progressAdded > 0 ||
      previous.milestonesReached > 0 ||
      previous.reportsGenerated > 0

    // todayKey always falls inside the current week, so comparison simply
    // requires that the previous week actually had activity.
    return {
      current,
      previous: prevHadData ? previous : null,
      hasComparison: prevHadData,
    }
  }

  private computeWeekMetrics(startKey: string, endKey: string): WeekMetrics {
    const startIso = dateKeyToIsoStart(startKey)
    const endIso = dateKeyToIsoStart(endKey)
    const checkins = this.repo.listCheckinsInRange(this.userId, startKey, addDays(endKey, -1))
    const activities = this.repo.listActivitiesBetween(startIso, endIso)

    const goalEvents = activities.filter((a) => a.goalId !== null && a.type !== 'CHECKED_IN')
    const updates = goalEvents.filter((a) => a.type === 'GOAL_UPDATED')
    const milestones = goalEvents.filter((a) => a.type === 'MILESTONE_REACHED')

    let progressAdded = 0
    for (const u of updates) {
      const added = typeof u.metadata?.amountAdded === 'number' ? u.metadata.amountAdded : 0
      progressAdded += added
    }

    return {
      activeDays: checkins.length,
      goalsReviewed: new Set(goalEvents.map((a) => a.goalId)).size,
      goalsUpdated: new Set(updates.map((a) => a.goalId)).size,
      progressAdded: Math.round(progressAdded * 100) / 100,
      milestonesReached: milestones.length,
      reportsGenerated: this.repo.countReportsBetween(startIso, endIso),
    }
  }

  // ── Next best actions (deterministic, rule-based) ────────────────────

  getNextBestActions(): NextBestAction[] {
    const goals = this.repo.listGoals()
    const now = Date.now()
    const DAY = 1000 * 60 * 60 * 24

    // Goals with any activity in the last 14 days (views excluded).
    const recent = new Set(
      this.repo
        .listActivitiesBetween(new Date(now - 14 * DAY).toISOString(), new Date(now).toISOString())
        .filter((a) => a.goalId !== null && a.type !== 'CHECKED_IN')
        .map((a) => a.goalId),
    )

    const candidates: Array<NextBestAction & { weight: number; daysUntil: number }> = []

    for (const goal of goals) {
      const progress = goal.targetAmount > 0 ? Math.min(goal.balance / goal.targetAmount, 1) : 0
      const pct = Math.round(progress * 100)
      const daysUntil = Math.ceil((new Date(goal.targetDate).getTime() - now) / DAY)

      if (pct >= 100) {
        candidates.push({ id: `completed-${goal.id}`, type: 'completed', goalId: goal.id, message: `${goal.name} reached its target.`, weight: 2, daysUntil })
      } else if (daysUntil >= 0 && daysUntil <= 14) {
        candidates.push({ id: `deadline-${goal.id}`, type: 'deadline', goalId: goal.id, message: `${goal.name} is due in ${daysUntil === 0 ? 'less than a day' : `${daysUntil} days`}.`, weight: 5, daysUntil })
      } else if (progress < 0.5 && daysUntil <= 30) {
        const urgency =
          daysUntil < 0
            ? `${Math.abs(daysUntil)} days overdue`
            : daysUntil === 0
              ? 'due today'
              : `${daysUntil} days remaining`
        candidates.push({ id: `attention-${goal.id}`, type: 'attention', goalId: goal.id, message: `${goal.name} may need attention — it is ${pct}% complete and ${urgency}.`, weight: 4, daysUntil })
      } else if (progress >= 0.75) {
        candidates.push({ id: `near-${goal.id}`, type: 'near_completion', goalId: goal.id, message: `${goal.name} is ${pct}% complete.`, weight: 3, daysUntil })
      } else if (!recent.has(goal.id)) {
        candidates.push({ id: `stale-${goal.id}`, type: 'not_reviewed', goalId: goal.id, message: `${goal.name} hasn't been reviewed recently.`, weight: 1, daysUntil })
      }
    }

    candidates.sort((a, b) => b.weight - a.weight || a.daysUntil - b.daysUntil || a.goalId.localeCompare(b.goalId))
    return candidates.slice(0, 3).map(({ weight: _w, daysUntil: _d, ...action }) => action)
  }

  // ── Achievements ─────────────────────────────────────────────────────

  getAchievements(): Achievement[] {
    const unlockedAtByCode = new Map(this.repo.listUnlocked(this.userId))
    return ACHIEVEMENTS.map((def) => ({
      ...def,
      unlocked: unlockedAtByCode.has(def.code),
      unlockedAt: unlockedAtByCode.get(def.code) ?? null,
    }))
  }

  /** Unlocks any newly satisfied achievements; returns the new ones. */
  evaluateAchievements(): Achievement[] {
    const unlocked = new Set(this.repo.listUnlockedCodes(this.userId))
    const nowIso = new Date().toISOString()
    const newlyUnlocked: Achievement[] = []

    const activeDates = new Set(this.repo.listActiveDates(this.userId))
    const stats = calculateStreaks(activeDates, this.today)
    const goals = this.repo.listGoals()
    const recentIso = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    const activity90d = this.repo.listActivitiesBetween(recentIso, new Date().toISOString())
    const checkins90d = this.repo.listCheckinsInRange(this.userId, addDays(toDateKey(this.today), -90), toDateKey(this.today))

    const hasType = (t: string) => checkins90d.some((c) => c.types.includes(t as CheckinType))

    const conditions: Array<[string, boolean]> = [
      ['first_goal', goals.length > 0],
      ['first_update', activity90d.some((a) => a.type === 'GOAL_UPDATED')],
      ['streak_7', stats.longestStreak >= 7],
      ['streak_30', stats.longestStreak >= 30],
      [
        'halfway_there',
        activity90d.some((a) => a.type === 'MILESTONE_REACHED') ||
          goals.some((g) => g.targetAmount > 0 && g.balance / g.targetAmount >= 0.5),
      ],
      [
        'goal_completed',
        activity90d.some((a) => a.type === 'GOAL_COMPLETED') ||
          goals.some((g) => g.targetAmount > 0 && g.balance >= g.targetAmount),
      ],
      ['analytics_explorer', hasType('VIEW_ANALYTICS')],
      ['first_report', hasType('GENERATE_REPORT') || this.repo.countReportsBetween('1970-01-01T00:00:00.000Z', new Date().toISOString()) > 0],
    ]

    for (const [code, satisfied] of conditions) {
      if (satisfied && !unlocked.has(code)) {
        const def = ACHIEVEMENTS.find((a) => a.code === code)
        if (def) {
          this.repo.unlockAchievement(this.userId, code, def.name, def.description, nowIso)
          newlyUnlocked.push({ ...def, unlocked: true, unlockedAt: nowIso })
        }
      }
    }

    return newlyUnlocked
  }

  // ── Focus goal ───────────────────────────────────────────────────────

  /** Selects a focus goal. Rejects missing/completed goals. */
  setFocusGoal(goalId: string): { ok: boolean; goal: import('../types').Goal | null } {
    const goal = this.repo.getGoal(goalId)
    if (!goal) return { ok: false, goal: null }
    if (goal.targetAmount > 0 && goal.balance >= goal.targetAmount) {
      return { ok: false, goal: null }
    }
    this.repo.setFocusGoal(this.userId, goalId, new Date().toISOString())
    return { ok: true, goal }
  }

  /** Returns the focus goal, clearing invalid selections (deleted/completed). */
  getFocusGoal(): import('../types').Goal | null {
    const goalId = this.repo.getFocusGoalId(this.userId)
    if (!goalId) return null
    const goal = this.repo.getGoal(goalId)
    if (!goal || (goal.targetAmount > 0 && goal.balance >= goal.targetAmount)) {
      this.repo.clearFocusGoal(this.userId)
      return null
    }
    return goal
  }
}
