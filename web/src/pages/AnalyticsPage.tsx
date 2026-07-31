import { useEffect, useState, useMemo, useCallback } from 'react'
import styled, { keyframes } from 'styled-components'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faWallet,
  faBullseye,
  faChartLine,
  faFlagCheckered,
  faFilter,
  faRedo,
} from '@fortawesome/free-solid-svg-icons'
import { useAppSelector } from '../store/hooks'
import { selectMode } from '../store/themeSlice'
import type { ThemeMode } from '../store/themeSlice'
import {
  fetchAnalyticsSummary,
  fetchProgressHistory,
  fetchGoalAnalytics,
  type AnalyticsSummary,
  type ProgressEntry,
  type GoalAnalyticsResult,
} from '../api/analytics'
import SavingsTrendChart from '../components/charts/SavingsTrendChart'
import GoalPerformanceChart from '../components/charts/GoalPerformanceChart'
import PortfolioDistributionChart from '../components/charts/PortfolioDistributionChart'
import GoalHealthChart from '../components/charts/GoalHealthChart'
import EngagementSection from '../components/engagement/EngagementSection'
import { recordCheckin } from '../api/engagement'
import { colors, spacing, typography, radii, transitions } from '../theme'

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`

const Page = styled.div`
  padding: ${spacing[1.5]} ${spacing[1.5]} ${spacing[3]};
  max-width: 1100px;
  margin: 0 auto;
  animation: ${fadeIn} 0.3s ease;

  @media (min-width: 768px) {
    padding: ${spacing[2]} ${spacing[2]} ${spacing[4]};
  }
`

// ── KPI Row ───────────────────────────────────────────────────────────

const KPIGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${spacing[0.75]};
  margin-bottom: ${spacing[1.5]};

  @media (min-width: 640px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(5, 1fr);
  }
`

const KPICard = styled.div<{ $mode: ThemeMode }>`
  background: ${(p) => (p.$mode === 'dark' ? '#1e293b' : colors.white)};
  border: 1px solid ${(p) => (p.$mode === 'dark' ? '#334155' : colors.gray[200])};
  border-radius: ${radii.lg};
  padding: ${spacing[0.75]} ${spacing[1]};
`

const KPIHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing[0.5]};
  margin-bottom: ${spacing[0.25]};
`

const KPIIcon = styled.span<{ $color: string }>`
  color: ${(p) => p.$color};
  font-size: ${typography.sizes.xs};
  display: flex;
`

const KPILabel = styled.span<{ $mode: ThemeMode }>`
  font-size: 0.65rem;
  font-weight: ${typography.weights.medium};
  color: ${(p) => (p.$mode === 'dark' ? '#64748b' : colors.gray[400])};
  text-transform: uppercase;
  letter-spacing: 0.04em;
`

const KPIValue = styled.div<{ $mode: ThemeMode }>`
  font-size: ${typography.sizes.lg};
  font-weight: ${typography.weights.bold};
  color: ${(p) => (p.$mode === 'dark' ? '#f1f5f9' : colors.gray[800])};

  @media (min-width: 768px) {
    font-size: ${typography.sizes.xl};
  }
`

const KPISub = styled.span<{ $mode: ThemeMode }>`
  font-size: 0.65rem;
  font-weight: ${typography.weights.normal};
  color: ${(p) => (p.$mode === 'dark' ? '#64748b' : colors.gray[400])};
`

// ── Filters ───────────────────────────────────────────────────────────

const FilterBar = styled.div<{ $mode: ThemeMode }>`
  display: flex;
  align-items: center;
  gap: ${spacing[0.75]};
  margin-bottom: ${spacing[1.5]};
  flex-wrap: wrap;
`

const FilterLabel = styled.span<{ $mode: ThemeMode }>`
  font-size: ${typography.sizes.xs};
  font-weight: ${typography.weights.medium};
  color: ${(p) => (p.$mode === 'dark' ? '#64748b' : colors.gray[400])};
`

const FilterSelect = styled.select<{ $mode: ThemeMode }>`
  padding: ${spacing[0.5]} ${spacing[0.75]};
  border: 1px solid ${(p) => (p.$mode === 'dark' ? '#334155' : colors.gray[200])};
  border-radius: ${radii.md};
  font-size: ${typography.sizes.xs};
  background: ${(p) => (p.$mode === 'dark' ? '#1e293b' : colors.white)};
  color: ${(p) => (p.$mode === 'dark' ? '#e2e8f0' : colors.gray[700])};
  cursor: pointer;
  transition: border-color ${transitions.fast};

  &:focus {
    outline: none;
    border-color: ${colors.primary[500]};
  }
`

// ── Chart Grid ────────────────────────────────────────────────────────

const ChartGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${spacing[1.25]};

  @media (min-width: 1024px) {
    grid-template-columns: 1fr 1fr;
  }
`

const FullWidth = styled.div`
  grid-column: 1 / -1;
`

const DeadlineSection = styled.div<{ $mode: ThemeMode }>`
  background: ${(p) => (p.$mode === 'dark' ? '#1e293b' : colors.white)};
  border: 1px solid ${(p) => (p.$mode === 'dark' ? '#334155' : colors.gray[200])};
  border-radius: 12px;
  padding: 20px;
`

const DeadlineTitle = styled.h3<{ $mode: ThemeMode }>`
  margin: 0 0 16px;
  font-size: ${typography.sizes.base};
  font-weight: ${typography.weights.semibold};
  color: ${(p) => (p.$mode === 'dark' ? colors.dark.text : colors.gray[800])};
`

const DeadlineList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const DeadlineRow = styled.div<{ $mode: ThemeMode }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: ${(p) => (p.$mode === 'dark' ? '#0f172a' : colors.gray[50])};
  border-radius: ${radii.md};
`

const DeadlineLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
`

const DeadlineIcon = styled.span`
  font-size: 1.2rem;
`

const DeadlineName = styled.span<{ $mode: ThemeMode }>`
  font-size: ${typography.sizes.sm};
  font-weight: ${typography.weights.medium};
  color: ${(p) => (p.$mode === 'dark' ? '#e2e8f0' : colors.gray[700])};
`

const DeadlineBadge = styled.span<{ $bg: string; $color: string }>`
  font-size: 0.65rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: ${radii.full};
  background: ${(p) => p.$bg};
  color: ${(p) => p.$color};
  text-transform: uppercase;
  letter-spacing: 0.03em;
  white-space: nowrap;
`

const EmptyState = styled.div<{ $mode: ThemeMode }>`
  text-align: center;
  padding: 48px 24px;
  color: ${(p) => (p.$mode === 'dark' ? '#64748b' : colors.gray[400])};
  font-size: ${typography.sizes.sm};
`

const ErrorBox = styled.div<{ $mode: ThemeMode }>`
  text-align: center;
  padding: 16px;
  color: ${(p) => (p.$mode === 'dark' ? '#fca5a5' : colors.error[500])};
  background: ${(p) => (p.$mode === 'dark' ? '#1e1b1b' : colors.error[50])};
  border: 1px solid ${(p) => (p.$mode === 'dark' ? '#7f1d1d' : colors.error[100])};
  border-radius: ${radii.lg};
  margin-bottom: 16px;
  font-size: ${typography.sizes.sm};
`

const RetryBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 6px 12px;
  background: ${colors.error[500]};
  color: white;
  border: none;
  border-radius: ${radii.md};
  font-size: ${typography.sizes.sm};
  cursor: pointer;
`

// ── Helpers ───────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getDeadlineUrgency(days: number) {
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, color: '#ef4444', bg: '#fef2f2' }
  if (days <= 7) return { label: `${days}d left`, color: '#f59e0b', bg: '#fffbeb' }
  if (days <= 30) return { label: `${days}d left`, color: '#3b82f6', bg: '#eff6ff' }
  if (days <= 90) return { label: `${Math.floor(days / 7)}w left`, color: '#64748b', bg: '#f8fafc' }
  return { label: `>3mo`, color: '#94a3b8', bg: '#f8fafc' }
}

// ── Component ─────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const themeMode = useAppSelector(selectMode)

  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [progressHistory, setProgressHistory] = useState<ProgressEntry[]>([])
  const [goalAnalytics, setGoalAnalytics] = useState<GoalAnalyticsResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [timeRange, setTimeRange] = useState('90')
  const [goalFilter, setGoalFilter] = useState('all')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const daysBack = parseInt(timeRange, 10) || 0
      const [summ, progress, goals] = await Promise.all([
        fetchAnalyticsSummary(),
        fetchProgressHistory(goalFilter === 'all' ? undefined : goalFilter, daysBack || undefined),
        fetchGoalAnalytics(),
      ])
      setSummary(summ)
      setProgressHistory(progress)
      setGoalAnalytics(goals)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [timeRange, goalFilter])

  // Filter performance, distribution, and health by selected goal as well
  const filteredPerformance = useMemo(() => {
    if (!goalAnalytics) return []
    if (goalFilter === 'all') return goalAnalytics.performance
    return goalAnalytics.performance.filter((g) => g.goalId === goalFilter)
  }, [goalAnalytics, goalFilter])

  const filteredDistribution = useMemo(() => {
    if (!goalAnalytics) return []
    if (goalFilter === 'all') return goalAnalytics.distribution
    return goalAnalytics.distribution.filter((g) => g.goalId === goalFilter)
  }, [goalAnalytics, goalFilter])

  const filteredHealth = useMemo(() => {
    if (!goalAnalytics) return null
    if (goalFilter === 'all') return goalAnalytics.health
    const all = goalAnalytics.health
    const combined = [
      ...all.completed,
      ...all.onTrack,
      ...all.attention,
      ...all.overdue,
    ].filter((g) => g.goalId === goalFilter)
    if (combined.length === 0) return null
    return {
      completed: combined.filter((g) => g.status === 'completed'),
      onTrack: combined.filter((g) => g.status === 'on_track'),
      attention: combined.filter((g) => g.status === 'attention'),
      overdue: combined.filter((g) => g.status === 'overdue'),
    }
  }, [goalAnalytics, goalFilter])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // Qualify today's check-in once per analytics page visit (not per filter change).
  useEffect(() => {
    recordCheckin('VIEW_ANALYTICS').catch(() => undefined)
  }, [])

  const deadlines = useMemo(() => {
    if (!goalAnalytics) return []
    return goalAnalytics.deadlines
      .filter((d) => d.daysUntilDeadline < 90)
      .slice(0, 6)
  }, [goalAnalytics])

  return (
    <Page>
      {/* Error State */}
      {error && (
        <ErrorBox $mode={themeMode}>
          <div>Failed to load analytics: {error}</div>
          <RetryBtn onClick={fetchAll}>
            <FontAwesomeIcon icon={faRedo} /> Retry
          </RetryBtn>
        </ErrorBox>
      )}

      {/* KPI Row */}
      <KPIGrid>
        <KPICard $mode={themeMode}>
          <KPIHeader>
            <KPIIcon $color={colors.primary[500]}>
              <FontAwesomeIcon icon={faBullseye} />
            </KPIIcon>
            <KPILabel $mode={themeMode}>Total Goals</KPILabel>
          </KPIHeader>
          <KPIValue $mode={themeMode}>
            {loading ? '-' : summary?.totalGoals ?? '-'}
          </KPIValue>
        </KPICard>
        <KPICard $mode={themeMode}>
          <KPIHeader>
            <KPIIcon $color={colors.success[500]}>
              <FontAwesomeIcon icon={faWallet} />
            </KPIIcon>
            <KPILabel $mode={themeMode}>Total Saved</KPILabel>
          </KPIHeader>
          <KPIValue $mode={themeMode}>
            {loading ? '-' : summary ? formatCurrency(summary.totalSaved) : '-'}
          </KPIValue>
        </KPICard>
        <KPICard $mode={themeMode}>
          <KPIHeader>
            <KPIIcon $color={colors.warning[500]}>
              <FontAwesomeIcon icon={faChartLine} />
            </KPIIcon>
            <KPILabel $mode={themeMode}>Total Target</KPILabel>
          </KPIHeader>
          <KPIValue $mode={themeMode}>
            {loading ? '-' : summary ? formatCurrency(summary.totalTarget) : '-'}
          </KPIValue>
        </KPICard>
        <KPICard $mode={themeMode}>
          <KPIHeader>
            <KPIIcon $color={colors.primary[400]}>
              <FontAwesomeIcon icon={faFlagCheckered} />
            </KPIIcon>
            <KPILabel $mode={themeMode}>Avg Progress</KPILabel>
          </KPIHeader>
          <KPIValue $mode={themeMode}>
            {loading ? '-' : summary ? `${Math.round(summary.averageProgress)}%` : '-'}
            <KPISub $mode={themeMode}> · {summary?.activeGoals ?? '-'} active</KPISub>
          </KPIValue>
        </KPICard>
        <KPICard $mode={themeMode}>
          <KPIHeader>
            <KPIIcon $color={colors.success[500]}>
              <FontAwesomeIcon icon={faFlagCheckered} />
            </KPIIcon>
            <KPILabel $mode={themeMode}>Completed</KPILabel>
          </KPIHeader>
          <KPIValue $mode={themeMode}>
            {loading ? '-' : summary?.completedGoals ?? '-'}
            <KPISub $mode={themeMode}> goals</KPISub>
          </KPIValue>
        </KPICard>
      </KPIGrid>

      {/* Filters */}
      <FilterBar $mode={themeMode}>
        <FilterLabel $mode={themeMode}>
          <FontAwesomeIcon icon={faFilter} size="xs" /> Time Range
        </FilterLabel>
        <FilterSelect $mode={themeMode} value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
          <option value="30">30 days</option>
          <option value="90">90 days</option>
          <option value="180">6 months</option>
          <option value="365">1 year</option>
          <option value="0">All time</option>
        </FilterSelect>
        <FilterLabel $mode={themeMode}>Goal</FilterLabel>
        <FilterSelect $mode={themeMode} value={goalFilter} onChange={(e) => setGoalFilter(e.target.value)}>
          <option value="all">All goals</option>
          {goalAnalytics?.performance.map((g) => (
            <option key={g.goalId} value={g.goalId}>
              {g.icon || '🎯'} {g.name}
            </option>
          ))}
        </FilterSelect>
      </FilterBar>

      {/* Chart Grid */}
      <ChartGrid>
        <FullWidth>
          <SavingsTrendChart
            data={progressHistory}
            loading={loading}
            error={error}
            mode={themeMode}
          />
        </FullWidth>

        <GoalPerformanceChart
          data={filteredPerformance}
          loading={loading}
          mode={themeMode}
        />

        <PortfolioDistributionChart
          data={filteredDistribution}
          loading={loading}
          mode={themeMode}
        />

        <FullWidth>
          <GoalHealthChart
            data={filteredHealth}
            loading={loading}
            mode={themeMode}
          />
        </FullWidth>

        {/* Deadline Overview */}
        {!loading && deadlines.length > 0 && (
          <FullWidth>
            <DeadlineSection $mode={themeMode}>
              <DeadlineTitle $mode={themeMode}>Upcoming Deadlines</DeadlineTitle>
              <DeadlineList>
                {deadlines.map((d) => {
                  const urgency = getDeadlineUrgency(d.daysUntilDeadline)
                  return (
                    <DeadlineRow key={d.goalId} $mode={themeMode}>
                      <DeadlineLeft>
                        <DeadlineIcon>{d.icon || '🎯'}</DeadlineIcon>
                        <DeadlineName $mode={themeMode}>{d.name}</DeadlineName>
                      </DeadlineLeft>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '0.75rem', color: colors.gray[400] }}>
                          {formatDate(d.targetDate)} · {Math.round(d.progressPercent)}%
                        </span>
                        <DeadlineBadge $bg={urgency.bg} $color={urgency.color}>
                          {urgency.label}
                        </DeadlineBadge>
                      </div>
                    </DeadlineRow>
                  )
                })}
              </DeadlineList>
            </DeadlineSection>
          </FullWidth>
        )}

        {/* Empty State */}
        {!loading && !error && !goalAnalytics && (
          <FullWidth>
            <EmptyState $mode={themeMode}>
              No analytics data available yet. Create some goals and add progress to see insights here.
            </EmptyState>
          </FullWidth>
        )}
      </ChartGrid>

      {/* Consistency & Engagement */}
      <div style={{ marginTop: spacing[1.25] }}>
        <EngagementSection />
      </div>
    </Page>
  )
}
