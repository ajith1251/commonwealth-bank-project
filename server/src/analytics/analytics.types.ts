export interface AnalyticsSummary {
  totalSaved: number
  totalTarget: number
  averageProgress: number
  activeGoals: number
  completedGoals: number
  totalGoals: number
}

export interface ProgressEntry {
  date: string
  amount: number
  goalId?: string
}

export interface GoalPerformanceEntry {
  goalId: string
  name: string
  icon: string | null
  targetAmount: number
  balance: number
  progressPercent: number
}

export interface GoalHealthEntry {
  goalId: string
  name: string
  icon: string | null
  progressPercent: number
  daysUntilDeadline: number
  status: 'completed' | 'on_track' | 'attention' | 'overdue'
}

export interface DeadlineEntry {
  goalId: string
  name: string
  icon: string | null
  targetDate: string
  daysUntilDeadline: number
  progressPercent: number
}

export interface PortfolioDistribution {
  goalId: string
  name: string
  icon: string | null
  targetAmount: number
  percentage: number
}

export interface ActivityEntry {
  id: string
  goalId: string | null
  type: string
  metadata: Record<string, unknown> | null
  createdAt: string
}

export interface GoalHealthResult {
  completed: GoalHealthEntry[]
  onTrack: GoalHealthEntry[]
  attention: GoalHealthEntry[]
  overdue: GoalHealthEntry[]
}
