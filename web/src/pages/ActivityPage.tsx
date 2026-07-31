import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import styled, { keyframes } from 'styled-components'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faRotateRight,
  faPlus,
  faPencil,
  faTrashCan,
  faFlagCheckered,
  faStar,
  faRedo,
  faFilter,
  faRefresh,
  faCircleCheck,
} from '@fortawesome/free-solid-svg-icons'
import { useAppSelector } from '../store/hooks'
import { selectMode } from '../store/themeSlice'
import { selectGoalsMap } from '../store/goalSlice'
import type { ThemeMode } from '../store/themeSlice'
import { fetchActivities, type ActivityEntry } from '../api/analytics'
import AchievementsSection from '../components/engagement/AchievementsSection'
import { colors, spacing, typography, radii, transitions } from '../theme'

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
`

const Page = styled.div`
  padding: ${spacing[1.5]} ${spacing[1.5]} ${spacing[3]};
  max-width: 800px;
  margin: 0 auto;
  animation: ${fadeIn} 0.3s ease;

  @media (min-width: 768px) {
    padding: ${spacing[2]} ${spacing[2]} ${spacing[4]};
  }
`

// ── Activity Filters ───────────────────────────────────────────────────

const FilterBar = styled.div<{ $mode: ThemeMode }>`
  display: flex;
  align-items: center;
  gap: ${spacing[0.75]};
  margin-bottom: ${spacing[1.25]};
  flex-wrap: wrap;
  padding: ${spacing[0.75]} ${spacing[1]};
  background: ${(p) => (p.$mode === 'dark' ? '#1e293b' : colors.white)};
  border: 1px solid ${(p) => (p.$mode === 'dark' ? '#334155' : colors.gray[200])};
  border-radius: ${radii.lg};
`

const FilterLabel = styled.span<{ $mode: ThemeMode }>`
  font-size: 0.65rem;
  font-weight: ${typography.weights.medium};
  color: ${(p) => (p.$mode === 'dark' ? '#64748b' : colors.gray[400])};
  text-transform: uppercase;
  letter-spacing: 0.04em;
`

const FilterSelect = styled.select<{ $mode: ThemeMode }>`
  padding: 4px 6px;
  border: 1px solid ${(p) => (p.$mode === 'dark' ? '#334155' : colors.gray[200])};
  border-radius: ${radii.md};
  font-size: 0.7rem;
  background: ${(p) => (p.$mode === 'dark' ? '#0f172a' : colors.gray[50])};
  color: ${(p) => (p.$mode === 'dark' ? '#e2e8f0' : colors.gray[700])};
  cursor: pointer;
  transition: border-color ${transitions.fast};

  &:focus {
    outline: none;
    border-color: ${colors.primary[500]};
  }
`

const RefreshButton = styled.button<{ $mode: ThemeMode; $spinning?: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  padding: 4px 10px;
  background: ${(p) => (p.$mode === 'dark' ? '#0f172a' : colors.gray[50])};
  border: 1px solid ${(p) => (p.$mode === 'dark' ? '#334155' : colors.gray[200])};
  border-radius: ${radii.md};
  color: ${(p) => (p.$mode === 'dark' ? '#94a3b8' : colors.gray[500])};
  font-size: 0.7rem;
  cursor: pointer;
  transition: all ${transitions.fast};

  &:hover {
    border-color: ${colors.primary[300]};
    color: ${colors.primary[600]};
    background: ${colors.primary[50]};
  }

  svg {
    animation: ${(p) => (p.$spinning ? 'spin 1s linear infinite' : 'none')};
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`

const AutoRefreshDot = styled.span<{ $active: boolean }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${(p) => (p.$active ? colors.success[500] : colors.gray[300])};
  transition: background 0.3s ease;
  flex-shrink: 0;
`

// ── Activity List ──────────────────────────────────────────────────────

const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
`

const ActivityRow = styled.div<{ $mode: ThemeMode }>`
  display: flex;
  align-items: flex-start;
  gap: ${spacing[1]};
  padding: ${spacing[1]} ${spacing[1.25]};
  background: ${(p) => (p.$mode === 'dark' ? '#1e293b' : colors.white)};
  border: 1px solid ${(p) => (p.$mode === 'dark' ? '#334155' : colors.gray[200])};
  border-radius: ${radii.md};
  transition: border-color ${transitions.fast}, box-shadow ${transitions.fast};
  margin-bottom: 6px;
  animation: ${slideUp} 0.2s ease;

  &:hover {
    border-color: ${(p) => (p.$mode === 'dark' ? '#475569' : colors.primary[200])};
    box-shadow: ${(p) => (p.$mode === 'dark' ? '0 1px 4px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.05)')};
  }
`

const IconWrapper = styled.div<{ $bg: string; $color: string }>`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(p) => p.$bg};
  color: ${(p) => p.$color};
  font-size: ${typography.sizes.sm};
  flex-shrink: 0;
`

const Content = styled.div`
  flex: 1;
  min-width: 0;
`

const ActivityTitle = styled.div<{ $mode: ThemeMode }>`
  font-size: ${typography.sizes.sm};
  font-weight: ${typography.weights.medium};
  color: ${(p) => (p.$mode === 'dark' ? '#e2e8f0' : colors.gray[700])};
`

const ActivityMeta = styled.div<{ $mode: ThemeMode }>`
  font-size: 0.7rem;
  color: ${(p) => (p.$mode === 'dark' ? '#64748b' : colors.gray[400])};
  margin-top: 2px;
`

const TimeStamp = styled.span<{ $mode: ThemeMode }>`
  font-size: 0.65rem;
  color: ${(p) => (p.$mode === 'dark' ? '#475569' : colors.gray[300])};
  white-space: nowrap;
  flex-shrink: 0;
  margin-top: 2px;
`

const StateContainer = styled.div<{ $mode: ThemeMode }>`
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

const CountBanner = styled.div<{ $mode: ThemeMode }>`
  font-size: 0.7rem;
  color: ${(p) => (p.$mode === 'dark' ? '#64748b' : colors.gray[400])};
  margin-bottom: ${spacing[0.75]};
  padding: 0 ${spacing[0.25]};
`

// ── Activity Helpers ───────────────────────────────────────────────────

const ACTIVITY_TYPES = ['all', 'GOAL_CREATED', 'GOAL_UPDATED', 'GOAL_COMPLETED', 'GOAL_DELETED', 'MILESTONE_REACHED', 'ACHIEVEMENT_UNLOCKED', 'REPORT_GENERATED', 'CHECKED_IN'] as const

/** Category buckets for the timeline filter. */
const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'goals', label: 'Goals' },
  { key: 'milestones', label: 'Milestones' },
  { key: 'reports', label: 'Reports' },
  { key: 'engagement', label: 'Engagement' },
] as const

type CategoryKey = (typeof CATEGORIES)[number]['key']

const CATEGORY_TYPES: Record<Exclude<CategoryKey, 'all'>, string[]> = {
  goals: ['GOAL_CREATED', 'GOAL_UPDATED', 'GOAL_COMPLETED', 'GOAL_DELETED'],
  milestones: ['MILESTONE_REACHED'],
  reports: ['REPORT_GENERATED'],
  engagement: ['ACHIEVEMENT_UNLOCKED', 'CHECKED_IN'],
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'GOAL_CREATED':
      return { icon: faPlus, bg: colors.primary[50], color: colors.primary[600] }
    case 'GOAL_UPDATED':
      return { icon: faPencil, bg: colors.info[50], color: colors.info[500] }
    case 'GOAL_COMPLETED':
      return { icon: faFlagCheckered, bg: colors.success[50], color: colors.success[600] }
    case 'GOAL_DELETED':
      return { icon: faTrashCan, bg: colors.error[50], color: colors.error[500] }
    case 'MILESTONE_REACHED':
      return { icon: faStar, bg: colors.warning[50], color: colors.warning[500] }
    default:
      return { icon: faRotateRight, bg: colors.gray[50], color: colors.gray[400] }
  }
}

function getActivityTitle(type: string, metadata: Record<string, unknown> | null): string {
  const name = metadata?.name as string | undefined
  switch (type) {
    case 'GOAL_CREATED':
      return name ? `${name} created` : 'Goal created'
    case 'GOAL_UPDATED':
      return name ? `${name} updated` : 'Goal updated'
    case 'GOAL_COMPLETED':
      return name ? `🎉 ${name} completed!` : 'Goal completed'
    case 'GOAL_DELETED':
      return name ? `${name} deleted` : 'Goal deleted'
    case 'MILESTONE_REACHED':
      return name
        ? `${name} reached ${metadata?.milestone || 'a milestone'}`
        : 'Milestone reached'
    default:
      return type || 'Activity'
  }
}

function getActivityDetail(type: string, metadata: Record<string, unknown> | null): string {
  if (!metadata) return ''
  switch (type) {
    case 'GOAL_UPDATED': {
      const added = metadata.amountAdded as number
      if (added && added > 0) {
        return `Progress increased by $${Math.round(added).toLocaleString()}`
      }
      return ''
    }
    case 'GOAL_COMPLETED': {
      const bal = metadata.balance as number
      return `Saved $${Math.round(bal).toLocaleString()} total`
    }
    case 'GOAL_CREATED': {
      const target = metadata.targetAmount as number
      return `Target: $${Math.round(target).toLocaleString()}`
    }
    default:
      return ''
  }
}

function getTimeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks}w ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getActivityTypeLabel(type: string): string {
  return type.replace('GOAL_', '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// ── Component ─────────────────────────────────────────────────────────

export default function ActivityPage() {
  const themeMode = useAppSelector(selectMode)
  const goalsMap = useAppSelector(selectGoalsMap)

  const [activities, setActivities] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState<CategoryKey>('all')
  const [goalFilter, setGoalFilter] = useState('all')
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadActivities = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }
    setError(null)
    try {
      const data = await fetchActivities(50)
      setActivities(data)
    } catch (err) {
      if (!silent) {
        setError(err instanceof Error ? err.message : 'Failed to load activities')
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Initial load + auto-refresh polling
  useEffect(() => {
    loadActivities()
    // Poll every 30 seconds for new activity
    pollingRef.current = setInterval(() => loadActivities(true), 30000)
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [loadActivities])

  // Filter activities by category + type + goal
  const filteredActivities = useMemo(() => {
    let filtered = activities
    if (categoryFilter !== 'all') {
      const allowed = CATEGORY_TYPES[categoryFilter]
      filtered = filtered.filter((a) => allowed.includes(a.type))
    }
    if (typeFilter !== 'all') {
      filtered = filtered.filter((a) => a.type === typeFilter)
    }
    if (goalFilter !== 'all') {
      filtered = filtered.filter((a) => a.goalId === goalFilter)
    }
    return filtered
  }, [activities, categoryFilter, typeFilter, goalFilter])

  // Build goal options map
  const goalOptions = useMemo(() => {
    const map = new Map<string, { name: string; icon: string | null }>()
    // Extract goal IDs from activities
    for (const a of activities) {
      if (a.goalId && !map.has(a.goalId)) {
        const goal = goalsMap[a.goalId]
        if (goal) {
          map.set(a.goalId, { name: goal.name, icon: goal.icon })
        } else {
          const metaName = (a.metadata as Record<string, unknown> | null)?.name as string | undefined
          map.set(a.goalId, { name: metaName || 'Unknown', icon: null })
        }
      }
    }
    return map
  }, [activities, goalsMap])

  return (
    <Page>
      {error && (
        <ErrorBox $mode={themeMode}>
          <div>Failed to load activity: {error}</div>
          <RetryBtn onClick={() => loadActivities()}>
            <FontAwesomeIcon icon={faRedo} /> Retry
          </RetryBtn>
        </ErrorBox>
      )}

      {/* Filters */}
      <FilterBar $mode={themeMode}>
        <FilterLabel $mode={themeMode}>
          <FontAwesomeIcon icon={faFilter} size="xs" /> Category
        </FilterLabel>
        <FilterSelect
          $mode={themeMode}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as CategoryKey)}
          aria-label="Filter by category"
        >
          {CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>{c.label}</option>
          ))}
        </FilterSelect>

        <FilterLabel $mode={themeMode}>
          <FontAwesomeIcon icon={faFilter} size="xs" /> Type
        </FilterLabel>
        <FilterSelect $mode={themeMode} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">All events</option>
          {ACTIVITY_TYPES.filter((t) => t !== 'all').map((t) => (
            <option key={t} value={t}>{getActivityTypeLabel(t)}</option>
          ))}
        </FilterSelect>

        <FilterLabel $mode={themeMode}>Goal</FilterLabel>
        <FilterSelect $mode={themeMode} value={goalFilter} onChange={(e) => setGoalFilter(e.target.value)}>
          <option value="all">All goals</option>
          {Array.from(goalOptions.entries()).map(([id, info]) => (
            <option key={id} value={id}>
              {info.icon || '🎯'} {info.name}
            </option>
          ))}
        </FilterSelect>

        <RefreshButton
          $mode={themeMode}
          $spinning={refreshing}
          onClick={() => loadActivities(true)}
          disabled={refreshing}
          aria-label="Refresh activities"
        >
          <FontAwesomeIcon icon={faRefresh} size="xs" />
          Refresh
        </RefreshButton>

        <AutoRefreshDot $active={!refreshing} title="Auto-refreshes every 30 seconds" />
      </FilterBar>

      {loading && !refreshing && (
        <StateContainer $mode={themeMode}>
          <FontAwesomeIcon icon={faRotateRight} spin size="2x" style={{ marginBottom: 12, opacity: 0.3 }} />
          <div>Loading activities...</div>
        </StateContainer>
      )}

      {!loading && !error && activities.length === 0 && (
        <StateContainer $mode={themeMode}>
          <div style={{ fontSize: '3rem', marginBottom: 12, opacity: 0.5 }}>
            <FontAwesomeIcon icon={faCircleCheck} />
          </div>
          <div>No activity yet.</div>
          <div style={{ fontSize: '0.8rem', marginTop: 8, opacity: 0.6 }}>
            Create or update goals to see events here.
          </div>
        </StateContainer>
      )}

      {!loading && !error && activities.length > 0 && (
        <>
          <CountBanner $mode={themeMode}>
            {typeFilter !== 'all' || goalFilter !== 'all'
              ? `${filteredActivities.length} of ${activities.length} events`
              : `${activities.length} events`}
            {typeFilter !== 'all' && ` · ${getActivityTypeLabel(typeFilter)}`}
          </CountBanner>

          <ActivityList>
            {filteredActivities.map((a, index) => {
              const viz = getActivityIcon(a.type)
              const meta = a.metadata as Record<string, unknown> | null
              const detail = getActivityDetail(a.type, meta)
              return (
                <ActivityRow
                  key={a.id}
                  $mode={themeMode}
                  style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
                >
                  <IconWrapper $bg={viz.bg} $color={viz.color}>
                    <FontAwesomeIcon icon={viz.icon} />
                  </IconWrapper>
                  <Content>
                    <ActivityTitle $mode={themeMode}>
                      {getActivityTitle(a.type, meta)}
                    </ActivityTitle>
                    {detail && <ActivityMeta $mode={themeMode}>{detail}</ActivityMeta>}
                  </Content>
                  <TimeStamp $mode={themeMode}>{getTimeAgo(a.createdAt)}</TimeStamp>
                </ActivityRow>
              )
            })}

            {filteredActivities.length === 0 && (
              <StateContainer $mode={themeMode}>
                No events match the selected filters.
              </StateContainer>
            )}
          </ActivityList>
        </>
      )}

      {/* Achievements */}
      <div style={{ marginTop: spacing[1.5] }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[0.5],
            marginBottom: spacing[0.75],
            fontSize: typography.sizes.sm,
            fontWeight: typography.weights.semibold,
            color: themeMode === 'dark' ? '#e2e8f0' : colors.gray[700],
          }}
        >
          🏆 Achievements
        </div>
        <AchievementsSection />
      </div>
    </Page>
  )
}
