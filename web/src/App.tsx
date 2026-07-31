import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import styled, { keyframes } from 'styled-components'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faSearch,
  faBullseye,
  faWallet,
  faChartLine,
  faFlagCheckered,
  faPlus,
  faRedo,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { useAppDispatch, useAppSelector } from './store/hooks'
import {
  fetchGoals,
  removeGoal,
  selectGoalIds,
  selectGoalsLoading,
  selectGoalsError,
  selectGoalsMap,
} from './store/goalSlice'
import { selectMode } from './store/themeSlice'
import type { ThemeMode } from './store/themeSlice'
import GoalCard from './components/GoalCard'
import GoalManager from './components/GoalManager'
import GoalDetail from './components/GoalDetail'
import DashboardChart from './components/DashboardChart'
import AppShell from './components/layout/AppShell'
import type { PageKey } from './components/layout/AppShell'
import AnalyticsPage from './pages/AnalyticsPage'
import ActivityPage from './pages/ActivityPage'
import ReportsPage from './pages/ReportsPage'
import CommandPalette from './components/CommandPalette'
import FocusGoalCard from './components/engagement/FocusGoalCard'
import NextBestActions from './components/engagement/NextBestActions'
import { recordCheckin } from './api/engagement'
import { StatSkeleton, GoalCardSkeleton } from './components/Skeleton'
import { colors, spacing, typography, shadows, radii, breakpoints, transitions, zIndex } from './theme'
import { formatCurrency, formatPercent } from './format'
import type { Goal } from './types'

// ── Animations ────────────────────────────────────────────────────────

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
`

const slideInRight = keyframes`
  from { transform: translateX(100%); opacity: 0; }
  to   { transform: translateX(0); opacity: 1; }
`

// ── Styled Components ─────────────────────────────────────────────────

const DashboardSection = styled.div`
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
  padding: ${spacing[1.5]} ${spacing[1.5]} 0;

  @media (min-width: ${breakpoints.md}) {
    padding: ${spacing[2]} ${spacing[2]} 0;
  }
`

const FocusActionsRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${spacing[1]};
  margin-top: ${spacing[1]};
  margin-bottom: ${spacing[1]};

  @media (min-width: 900px) {
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
  }
`

const NextActionsPanel = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
`

const NextActionsLabel = styled.div<{ $mode: ThemeMode }>`
  font-size: ${typography.sizes.xs};
  font-weight: ${typography.weights.semibold};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${(p) => (p.$mode === 'dark' ? '#64748b' : colors.gray[400])};
  margin-bottom: 4px;
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${spacing[0.75]};

  @media (min-width: ${breakpoints.md}) {
    gap: ${spacing[1]};
  }
`

const StatCard = styled.div<{ $mode: ThemeMode }>`
  background: ${(p) => (p.$mode === 'dark' ? '#1e293b' : colors.white)};
  border: 1px solid ${(p) => (p.$mode === 'dark' ? '#334155' : colors.gray[200])};
  border-radius: ${radii.lg};
  padding: ${spacing[0.75]} ${spacing[1]};
  transition: box-shadow ${transitions.fast}, border-color ${transitions.fast};

  &:hover {
    box-shadow: ${(p) => (p.$mode === 'dark' ? shadows.dark.md : shadows.md)};
    border-color: ${(p) => (p.$mode === 'dark' ? '#475569' : colors.primary[200])};
  }
`

const StatHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing[0.5]};
  margin-bottom: ${spacing[0.25]};
`

const StatIcon = styled.span<{ $color: string }>`
  color: ${(p) => p.$color};
  font-size: ${typography.sizes.sm};
  display: flex;
`

const StatLabelText = styled.span<{ $mode: ThemeMode }>`
  font-size: ${typography.sizes.xs};
  font-weight: ${typography.weights.medium};
  color: ${(p) => (p.$mode === 'dark' ? '#64748b' : colors.gray[400])};
`

const StatValue = styled.div<{ $mode: ThemeMode }>`
  font-size: ${typography.sizes.xl};
  font-weight: ${typography.weights.bold};
  color: ${(p) => (p.$mode === 'dark' ? '#f1f5f9' : colors.gray[800])};
  line-height: 1.2;

  @media (min-width: ${breakpoints.md}) {
    font-size: ${typography.sizes['2xl']};
  }
`

const StatSub = styled.span<{ $mode: ThemeMode }>`
  font-size: ${typography.sizes.xs};
  font-weight: ${typography.weights.normal};
  color: ${(p) => (p.$mode === 'dark' ? '#64748b' : colors.gray[400])};
`

// ── Toolbar ───────────────────────────────────────────────────────────

const Toolbar = styled.div`
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
  padding: ${spacing[1]} ${spacing[1.5]};
  display: flex;
  align-items: center;
  gap: ${spacing[0.75]};
  animation: ${fadeIn} 0.35s ease;
  flex-wrap: wrap;

  @media (min-width: ${breakpoints.md}) {
    padding: ${spacing[1.25]} ${spacing[2]};
    flex-wrap: nowrap;
  }
`

const SearchWrapper = styled.div`
  position: relative;
  flex: 1;
  min-width: 160px;
`

const SearchInput = styled.input<{ $mode: ThemeMode }>`
  width: 100%;
  padding: ${spacing[0.5]} ${spacing[0.75]} ${spacing[0.5]} 2rem;
  border: 1px solid ${(p) => (p.$mode === 'dark' ? '#334155' : colors.gray[200])};
  border-radius: ${radii.md};
  font-size: ${typography.sizes.sm};
  background: ${(p) => (p.$mode === 'dark' ? '#1e293b' : colors.white)};
  color: ${(p) => (p.$mode === 'dark' ? '#f1f5f9' : colors.gray[800])};
  transition: border-color ${transitions.fast}, box-shadow ${transitions.fast};

  &::placeholder {
    color: ${(p) => (p.$mode === 'dark' ? '#64748b' : colors.gray[400])};
  }

  &:focus {
    outline: none;
    border-color: ${colors.primary[500]};
    box-shadow: 0 0 0 3px ${colors.primary[50]};
  }
`

const SearchIcon = styled.div<{ $mode: ThemeMode }>`
  position: absolute;
  left: ${spacing[0.5]};
  top: 50%;
  transform: translateY(-50%);
  color: ${(p) => (p.$mode === 'dark' ? '#64748b' : colors.gray[400])};
  font-size: ${typography.sizes.sm};
  pointer-events: none;
`

const ClearSearchButton = styled.button<{ $mode: ThemeMode }>`
  position: absolute;
  right: ${spacing[0.5]};
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: ${(p) => (p.$mode === 'dark' ? '#64748b' : colors.gray[400])};
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${typography.sizes.xs};

  &:hover {
    color: ${(p) => (p.$mode === 'dark' ? '#f1f5f9' : colors.gray[600])};
  }
`

const ResultCount = styled.span<{ $mode: ThemeMode }>`
  font-size: ${typography.sizes.xs};
  color: ${(p) => (p.$mode === 'dark' ? '#64748b' : colors.gray[400])};
  white-space: nowrap;
`

const SortSelect = styled.select<{ $mode: ThemeMode }>`
  padding: ${spacing[0.5]} ${spacing[0.75]} ${spacing[0.5]} ${spacing[0.75]};
  border: 1px solid ${(p) => (p.$mode === 'dark' ? '#334155' : colors.gray[200])};
  border-radius: ${radii.md};
  font-size: ${typography.sizes.xs};
  background: ${(p) => (p.$mode === 'dark' ? '#1e293b' : colors.white)};
  color: ${(p) => (p.$mode === 'dark' ? '#f1f5f9' : colors.gray[700])};
  cursor: pointer;
  transition: border-color ${transitions.fast};
  min-width: 120px;
  appearance: auto;

  &:focus {
    outline: none;
    border-color: ${colors.primary[500]};
  }
`

const CreateGoalButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${spacing[0.5]};
  padding: ${spacing[0.5]} ${spacing[1]};
  background: ${colors.primary[600]};
  color: ${colors.white};
  border: none;
  border-radius: ${radii.md};
  font-size: ${typography.sizes.sm};
  font-weight: ${typography.weights.semibold};
  cursor: pointer;
  white-space: nowrap;
  transition: background ${transitions.fast}, transform ${transitions.fast};
  min-height: 38px;

  &:hover {
    background: ${colors.primary[700]};
  }

  &:active {
    transform: scale(0.97);
  }

  &:focus-visible {
    outline: 2px solid ${colors.primary[500]};
    outline-offset: 2px;
  }

  @media (max-width: ${breakpoints.sm}) {
    span {
      display: none;
    }
  }
`

// ── Goals Grid ────────────────────────────────────────────────────────

const Main = styled.main`
  flex: 1;
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
  padding: 0 ${spacing[1.5]} ${spacing[2]};
  animation: ${fadeIn} 0.3s ease;

  @media (min-width: ${breakpoints.md}) {
    padding: 0 ${spacing[2]} ${spacing[3]};
  }
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${spacing[1]};

  @media (min-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: ${breakpoints.lg}) {
    grid-template-columns: repeat(3, 1fr);
    gap: ${spacing[1.25]};
  }
`

// ── States ────────────────────────────────────────────────────────────

const StateMessage = styled.div<{ $mode: ThemeMode }>`
  text-align: center;
  padding: ${spacing[4]} ${spacing[1.5]};
  animation: ${fadeIn} 0.3s ease;
  color: ${(p) => (p.$mode === 'dark' ? '#64748b' : colors.gray[500])};
`

const ErrorBox = styled.div<{ $mode: ThemeMode }>`
  text-align: center;
  padding: ${spacing[2]} ${spacing[1.5]};
  color: ${(p) => (p.$mode === 'dark' ? '#fca5a5' : colors.error[500])};
  background: ${(p) => (p.$mode === 'dark' ? '#1e1b1b' : colors.error[50])};
  border: 1px solid ${(p) => (p.$mode === 'dark' ? '#7f1d1d' : colors.error[100])};
  border-radius: ${radii.lg};
  margin: ${spacing[1]} 0;
  font-size: ${typography.sizes.sm};
`

const RetryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${spacing[0.5]};
  margin-top: ${spacing[1]};
  padding: ${spacing[0.5]} ${spacing[1]};
  background: ${colors.error[500]};
  color: ${colors.white};
  border: none;
  border-radius: ${radii.md};
  font-size: ${typography.sizes.sm};
  font-weight: ${typography.weights.medium};
  cursor: pointer;
  transition: opacity ${transitions.fast};

  &:hover {
    opacity: 0.9;
  }
`

const EmptyEmoji = styled.div`
  font-size: 4rem;
  margin-bottom: ${spacing[1]};
  line-height: 1;
`

const EmptyTitle = styled.p`
  font-size: ${typography.sizes.lg};
  font-weight: ${typography.weights.semibold};
  color: ${colors.gray[600]};
  margin: 0 0 ${spacing[0.5]};
`

const EmptyText = styled.p`
  font-size: ${typography.sizes.sm};
  color: ${colors.gray[400]};
  margin: 0;
  max-width: 360px;
  margin: 0 auto;
  line-height: 1.6;
`

const NoResultsEmoji = styled.div`
  font-size: 3rem;
  margin-bottom: ${spacing[0.75]};
  line-height: 1;
`

const NoResultsText = styled.p`
  font-size: ${typography.sizes.base};
  font-weight: ${typography.weights.medium};
  color: ${colors.gray[400]};
  margin: 0 0 ${spacing[0.25]};
`

const ClearFilterBtn = styled.button<{ $mode: ThemeMode }>`
  margin-top: ${spacing[0.75]};
  padding: ${spacing[0.5]} ${spacing[1]};
  background: ${(p) => (p.$mode === 'dark' ? '#1e293b' : colors.white)};
  color: ${(p) => (p.$mode === 'dark' ? '#94a3b8' : colors.gray[600])};
  border: 1px solid ${(p) => (p.$mode === 'dark' ? '#334155' : colors.gray[200])};
  border-radius: ${radii.md};
  font-size: ${typography.sizes.sm};
  cursor: pointer;
  transition: all ${transitions.fast};

  &:hover {
    border-color: ${colors.primary[300]};
    color: ${colors.primary[600]};
  }
`

// ── Main Create/Empty Button ──────────────────────────────────────────

const PrimaryActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${spacing[0.5]};
  margin-top: ${spacing[1]};
  padding: ${spacing[0.75]} ${spacing[1.5]};
  background: ${colors.primary[600]};
  color: ${colors.white};
  border: none;
  border-radius: ${radii.md};
  font-size: ${typography.sizes.sm};
  font-weight: ${typography.weights.semibold};
  cursor: pointer;
  transition: background ${transitions.fast}, transform ${transitions.fast};

  &:hover {
    background: ${colors.primary[700]};
  }

  &:active {
    transform: scale(0.97);
  }
`

// ── Toast ─────────────────────────────────────────────────────────────

const ToastContainer = styled.div`
  position: fixed;
  bottom: ${spacing[1.5]};
  right: ${spacing[1.5]};
  z-index: ${zIndex.toast};
  display: flex;
  flex-direction: column;
  gap: ${spacing[0.5]};
  pointer-events: none;
`

const Toast = styled.div<{ $type: 'success' | 'error'; $mode: ThemeMode }>`
  display: flex;
  align-items: center;
  gap: ${spacing[0.5]};
  padding: ${spacing[0.75]} ${spacing[1]};
  background: ${(p) => (p.$mode === 'dark' ? '#1e293b' : colors.white)};
  border: 1px solid ${(p) =>
    p.$type === 'success'
      ? (p.$mode === 'dark' ? '#15803d' : colors.success[200])
      : (p.$mode === 'dark' ? '#991b1b' : colors.error[200])};
  border-left: 4px solid ${(p) => (p.$type === 'success' ? colors.success[500] : colors.error[500])};
  border-radius: ${radii.md};
  box-shadow: ${(p) => (p.$mode === 'dark' ? shadows.dark.lg : shadows.lg)};
  animation: ${slideInRight} 0.25s ease;
  font-size: ${typography.sizes.sm};
  color: ${(p) => (p.$mode === 'dark' ? '#f1f5f9' : colors.gray[700])};
  min-width: 200px;
  max-width: 360px;
  pointer-events: auto;
`

const ToastDot = styled.span<{ $type: 'success' | 'error' }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${(p) => (p.$type === 'success' ? colors.success[500] : colors.error[500])};
  flex-shrink: 0;
`

// ── Skeleton Grid ─────────────────────────────────────────────────────

const SkeletonGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;

  @media (min-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: ${breakpoints.lg}) {
    grid-template-columns: repeat(3, 1fr);
  }
  gap: ${spacing[1]};
`

const SkeletonStatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${spacing[0.75]};

  @media (min-width: ${breakpoints.md}) {
    gap: ${spacing[1]};
  }
`

// ── Footer ────────────────────────────────────────────────────────────

const Footer = styled.footer<{ $mode: ThemeMode }>`
  text-align: center;
  padding: ${spacing[1.5]} ${spacing[1.5]};
  font-size: ${typography.sizes.xs};
  color: ${(p) => (p.$mode === 'dark' ? '#64748b' : colors.gray[400])};
  border-top: 1px solid ${(p) => (p.$mode === 'dark' ? '#334155' : colors.gray[100])};
`

// ── App Component ─────────────────────────────────────────────────────

export default function App() {
  const dispatch = useAppDispatch()
  const goalIds = useAppSelector(selectGoalIds)
  const goalsMap = useAppSelector(selectGoalsMap)
  const loading = useAppSelector(selectGoalsLoading)
  const error = useAppSelector(selectGoalsError)
  const themeMode = useAppSelector(selectMode)

  // ── Page routing ───────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState<PageKey>('overview')

  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'target' | 'progress' | 'date'>('date')
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [detailGoalId, setDetailGoalId] = useState<string | null>(null)
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' }[]>([])
  const [initialLoading, setInitialLoading] = useState(true)

  // ── Initial fetch + URL param handling ──────────────────
  useEffect(() => {
    dispatch(fetchGoals()).then(() => {
      const params = new URLSearchParams(window.location.search)
      const sharedGoalId = params.get('goal')
      if (sharedGoalId) {
        setDetailGoalId(sharedGoalId)
        window.history.replaceState({}, '', window.location.pathname)
      }
      setTimeout(() => setInitialLoading(false), 300)
    })
    // Qualify today's engagement check-in (once per local day, server-deduped).
    recordCheckin('VIEW_DASHBOARD').catch(() => undefined)
  }, [dispatch])

  // ── Filtered + sorted goals ─────────────────────────────────────────
  const filteredGoalIds = useMemo(() => {
    let ids: string[]
    if (!searchQuery.trim()) {
      ids = [...goalIds]
    } else {
      const q = searchQuery.toLowerCase()
      ids = goalIds.filter((id) => {
        const goal = goalsMap[id]
        if (!goal) return false
        return goal.name.toLowerCase().includes(q)
      })
    }

    ids.sort((a, b) => {
      const ga = goalsMap[a]
      const gb = goalsMap[b]
      if (!ga || !gb) return 0

      switch (sortBy) {
        case 'name':
          return ga.name.localeCompare(gb.name)
        case 'target':
          return gb.targetAmount - ga.targetAmount
        case 'progress': {
          const pa = ga.targetAmount > 0 ? ga.balance / ga.targetAmount : 0
          const pb = gb.targetAmount > 0 ? gb.balance / gb.targetAmount : 0
          return pb - pa
        }
        case 'date':
        default:
          return new Date(gb.created).getTime() - new Date(ga.created).getTime()
      }
    })

    return ids
  }, [goalIds, goalsMap, searchQuery, sortBy])

  // ── Dashboard stats ─────────────────────────────────────────────────
  const stats = useMemo(() => {
    const goals = goalIds.map((id) => goalsMap[id]).filter(Boolean) as Goal[]
    const totalSaved = goals.reduce((sum, g) => sum + g.balance, 0)
    const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0)
    const avgProgress =
      goals.length > 0
        ? goals.reduce((sum, g) => {
            const p = g.targetAmount > 0 ? (g.balance / g.targetAmount) * 100 : 0
            return sum + Math.min(p, 100)
          }, 0) / goals.length
        : 0
    const completedGoals = goals.filter((g) => g.targetAmount > 0 && g.balance >= g.targetAmount).length

    return { count: goals.length, totalSaved, totalTarget, avgProgress, completedGoals }
  }, [goalIds, goalsMap])

  // ── Toast system ────────────────────────────────────────────────────
  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  const handleRetry = useCallback(() => {
    dispatch(fetchGoals())
  }, [dispatch])

  // Remember the element that opened the drawer so focus can be restored on close.
  const detailTriggerRef = useRef<HTMLElement | null>(null)

  // ── Card click → detail or edit ────────────────────────────────────
  const handleCardClick = useCallback((id: string) => {
    detailTriggerRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    setCurrentPage('goals')
    setDetailGoalId(id)
  }, [])

  const handleDetailEdit = useCallback((id: string) => {
    setDetailGoalId(null)
    setTimeout(() => setEditingGoalId(id), 200)
  }, [])

  const handleDetailDelete = useCallback(
    (id: string) => {
      setDetailGoalId(null)
      dispatch(removeGoal(id)).then((action) => {
        if (removeGoal.fulfilled.match(action)) {
          showToast('Goal deleted', 'success')
        } else {
          showToast('Failed to delete goal', 'error')
        }
      })
    },
    [dispatch, showToast],
  )

  // ── Keyboard shortcuts ─────────────────────────────────
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  // Record a VIEW_GOAL check-in when the detail drawer opens.
  useEffect(() => {
    if (detailGoalId) recordCheckin('VIEW_GOAL').catch(() => undefined)
  }, [detailGoalId])

  const handleFocusViewGoal = useCallback((id: string) => {
    detailTriggerRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    setCurrentPage('goals')
    setDetailGoalId(id)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        if (!showCreateModal && !editingGoalId && !detailGoalId) {
          setCommandPaletteOpen(true)
        }
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [showCreateModal, editingGoalId, detailGoalId])

  // Goal data for command palette
  const commandGoals = useMemo(
    () => goalIds.map((id) => goalsMap[id]).filter(Boolean).map((g) => ({
      id: g.id,
      name: g.name,
      icon: g.icon,
    })),
    [goalIds, goalsMap],
  )

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <>
      <AppShell
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        rightActions={
          <>
            {(currentPage === 'overview' || currentPage === 'goals') && (
              <CreateGoalButton onClick={() => setShowCreateModal(true)} aria-label="Create new goal">
                <FontAwesomeIcon icon={faPlus} />
                <span>New Goal</span>
              </CreateGoalButton>
            )}
          </>
        }
      >
        {/* ── Overview Page ────────────────────────────── */}
        {currentPage === 'overview' && (
          <div style={{ minHeight: 'calc(100vh - 57px)', display: 'flex', flexDirection: 'column' }}>
            {/* Loading skeleton */}
            {initialLoading && !error && (
              <DashboardSection>
                <SkeletonStatsRow>
                  <StatSkeleton mode={themeMode} />
                  <StatSkeleton mode={themeMode} />
                  <StatSkeleton mode={themeMode} />
                  <StatSkeleton mode={themeMode} />
                </SkeletonStatsRow>
                <div style={{ marginTop: spacing[1] }}>
                  <SkeletonGrid>
                    {Array.from({ length: 3 }).map((_, i) => (
                      <GoalCardSkeleton key={i} mode={themeMode} />
                    ))}
                  </SkeletonGrid>
                </div>
              </DashboardSection>
            )}

            {/* Dashboard */}
            {!initialLoading && !error && goalIds.length > 0 && (
              <>
                <DashboardSection>
                  {/* Financial KPIs — first, per information hierarchy */}
                  <StatsGrid>
                    <StatCard $mode={themeMode}>
                      <StatHeader>
                        <StatIcon $color={colors.primary[500]}>
                          <FontAwesomeIcon icon={faBullseye} />
                        </StatIcon>
                        <StatLabelText $mode={themeMode}>Total Goals</StatLabelText>
                      </StatHeader>
                      <StatValue $mode={themeMode}>
                        {stats.count}
                        <StatSub $mode={themeMode}> goals</StatSub>
                      </StatValue>
                    </StatCard>

                    <StatCard $mode={themeMode}>
                      <StatHeader>
                        <StatIcon $color={colors.success[500]}>
                          <FontAwesomeIcon icon={faWallet} />
                        </StatIcon>
                        <StatLabelText $mode={themeMode}>Total Saved</StatLabelText>
                      </StatHeader>
                      <StatValue $mode={themeMode}>
                        {formatCurrency(stats.totalSaved)}
                      </StatValue>
                    </StatCard>

                    <StatCard $mode={themeMode}>
                      <StatHeader>
                        <StatIcon $color={colors.warning[500]}>
                          <FontAwesomeIcon icon={faChartLine} />
                        </StatIcon>
                        <StatLabelText $mode={themeMode}>Total Target</StatLabelText>
                      </StatHeader>
                      <StatValue $mode={themeMode}>
                        {formatCurrency(stats.totalTarget)}
                      </StatValue>
                    </StatCard>

                    <StatCard $mode={themeMode}>
                      <StatHeader>
                        <StatIcon $color={colors.primary[400]}>
                          <FontAwesomeIcon icon={faFlagCheckered} />
                        </StatIcon>
                        <StatLabelText $mode={themeMode}>Avg Progress</StatLabelText>
                      </StatHeader>
                      <StatValue $mode={themeMode}>
                        {formatPercent(stats.avgProgress)}
                        <StatSub $mode={themeMode}> · {stats.completedGoals} done</StatSub>
                      </StatValue>
                    </StatCard>
                  </StatsGrid>

                  {/* Focus Goal + Next Best Actions */}
                  <FocusActionsRow>
                    <div style={{ minWidth: 0 }}>
                      <FocusGoalCard onViewGoal={handleFocusViewGoal} onToast={showToast} />
                    </div>
                    <NextActionsPanel>
                      <NextActionsLabel $mode={themeMode}>Next Best Actions</NextActionsLabel>
                      <NextBestActions onViewGoal={handleFocusViewGoal} />
                    </NextActionsPanel>
                  </FocusActionsRow>

                  {/* Financial Progress / Visualization */}
                  <DashboardChart
                    totalSaved={stats.totalSaved}
                    totalTarget={stats.totalTarget}
                    goalCount={stats.count}
                    completedCount={stats.completedGoals}
                    goals={goalIds.map((id) => goalsMap[id]).filter(Boolean) as Goal[]}
                    mode={themeMode}
                  />
                </DashboardSection>

                {/* Search & Toolbar */}
                <Toolbar>
                  <SearchWrapper>
                    <SearchIcon $mode={themeMode}>
                      <FontAwesomeIcon icon={faSearch} />
                    </SearchIcon>
                    <SearchInput
                      $mode={themeMode}
                      type="text"
                      placeholder="Search goals…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      aria-label="Search goals"
                    />
                    {searchQuery && (
                      <ClearSearchButton $mode={themeMode} onClick={() => setSearchQuery('')} aria-label="Clear search">
                        <FontAwesomeIcon icon={faXmark} />
                      </ClearSearchButton>
                    )}
                  </SearchWrapper>
                  <SortSelect
                    $mode={themeMode}
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    aria-label="Sort goals"
                  >
                    <option value="date">Newest</option>
                    <option value="name">Name A-Z</option>
                    <option value="target">Highest Target</option>
                    <option value="progress">Most Progress</option>
                  </SortSelect>
                  {!searchQuery && (
                    <ResultCount $mode={themeMode}>
                      {goalIds.length} {goalIds.length === 1 ? 'goal' : 'goals'}
                    </ResultCount>
                  )}
                  {searchQuery && (
                    <ResultCount $mode={themeMode}>
                      {filteredGoalIds.length} of {goalIds.length}
                    </ResultCount>
                  )}
                </Toolbar>

                {/* Goal Grid */}
                <Main>
                  {/* No search results */}
                  {filteredGoalIds.length === 0 && (
                    <StateMessage $mode={themeMode}>
                      <NoResultsEmoji>🔍</NoResultsEmoji>
                      <NoResultsText>No goals match your search</NoResultsText>
                      <ClearFilterBtn $mode={themeMode} onClick={() => setSearchQuery('')}>
                        <FontAwesomeIcon icon={faXmark} /> Clear search
                      </ClearFilterBtn>
                    </StateMessage>
                  )}

                  {filteredGoalIds.length > 0 && (
                    <Grid>
                      {filteredGoalIds.map((id) => (
                        <GoalCard key={id} id={id} onViewDetail={handleCardClick} onToast={showToast} />
                      ))}
                    </Grid>
                  )}
                </Main>
              </>
            )}

            {/* Error State */}
            {!loading && error && (
              <Main>
                <StateMessage $mode={themeMode}>
                  <ErrorBox $mode={themeMode}>
                    <div>⚠️ Failed to load goals: {error}</div>
                    <RetryButton onClick={handleRetry}>
                      <FontAwesomeIcon icon={faRedo} /> Retry
                    </RetryButton>
                  </ErrorBox>
                </StateMessage>
              </Main>
            )}

            {/* Empty State */}
            {!initialLoading && !error && goalIds.length === 0 && (
              <Main>
                <StateMessage $mode={themeMode}>
                  <EmptyEmoji>🎯</EmptyEmoji>
                  <EmptyTitle>No goals yet</EmptyTitle>
                  <EmptyText>
                    Start building toward something. Create your first financial goal and track your progress here.
                  </EmptyText>
                  <PrimaryActionButton onClick={() => setShowCreateModal(true)}>
                    <FontAwesomeIcon icon={faPlus} /> Create Your First Goal
                  </PrimaryActionButton>
                </StateMessage>
              </Main>
            )}

            <Footer $mode={themeMode}>
              CommBank Goal Tracker · Built with React, Redux, Express &amp; SQLite
            </Footer>
          </div>
        )}

        {/* ── Goals Page ──────────────────────────────── */}
        {currentPage === 'goals' && (
          <div style={{ minHeight: 'calc(100vh - 57px)', display: 'flex', flexDirection: 'column' }}>
            {initialLoading && (
              <div style={{ padding: spacing[2] }}>
                <SkeletonGrid>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <GoalCardSkeleton key={i} mode={themeMode} />
                  ))}
                </SkeletonGrid>
              </div>
            )}

            {!initialLoading && !error && goalIds.length > 0 && (
              <>
                <Toolbar>
                  <SearchWrapper>
                    <SearchIcon $mode={themeMode}>
                      <FontAwesomeIcon icon={faSearch} />
                    </SearchIcon>
                    <SearchInput
                      $mode={themeMode}
                      type="text"
                      placeholder="Search goals…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      aria-label="Search goals"
                    />
                    {searchQuery && (
                      <ClearSearchButton $mode={themeMode} onClick={() => setSearchQuery('')} aria-label="Clear search">
                        <FontAwesomeIcon icon={faXmark} />
                      </ClearSearchButton>
                    )}
                  </SearchWrapper>
                  <SortSelect
                    $mode={themeMode}
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    aria-label="Sort goals"
                  >
                    <option value="date">Newest</option>
                    <option value="name">Name A-Z</option>
                    <option value="target">Highest Target</option>
                    <option value="progress">Most Progress</option>
                  </SortSelect>
                  {!searchQuery && (
                    <ResultCount $mode={themeMode}>
                      {goalIds.length} {goalIds.length === 1 ? 'goal' : 'goals'}
                    </ResultCount>
                  )}
                  {searchQuery && (
                    <ResultCount $mode={themeMode}>
                      {filteredGoalIds.length} of {goalIds.length}
                    </ResultCount>
                  )}
                </Toolbar>

                <Main>
                  {filteredGoalIds.length === 0 && (
                    <StateMessage $mode={themeMode}>
                      <NoResultsEmoji>🔍</NoResultsEmoji>
                      <NoResultsText>No goals match your search</NoResultsText>
                      <ClearFilterBtn $mode={themeMode} onClick={() => setSearchQuery('')}>
                        <FontAwesomeIcon icon={faXmark} /> Clear search
                      </ClearFilterBtn>
                    </StateMessage>
                  )}

                  {filteredGoalIds.length > 0 && (
                    <Grid>
                      {filteredGoalIds.map((id) => (
                        <GoalCard key={id} id={id} onViewDetail={handleCardClick} onToast={showToast} />
                      ))}
                    </Grid>
                  )}
                </Main>
              </>
            )}

            {!initialLoading && !error && goalIds.length === 0 && (
              <Main>
                <StateMessage $mode={themeMode}>
                  <EmptyEmoji>🎯</EmptyEmoji>
                  <EmptyTitle>No goals yet</EmptyTitle>
                  <EmptyText>
                    Start building toward something. Create your first financial goal and track your progress here.
                  </EmptyText>
                  <PrimaryActionButton onClick={() => setShowCreateModal(true)}>
                    <FontAwesomeIcon icon={faPlus} /> Create Your First Goal
                  </PrimaryActionButton>
                </StateMessage>
              </Main>
            )}

            {!initialLoading && error && (
              <Main>
                <StateMessage $mode={themeMode}>
                  <ErrorBox $mode={themeMode}>
                    <div>⚠️ Failed to load goals: {error}</div>
                    <RetryButton onClick={handleRetry}>
                      <FontAwesomeIcon icon={faRedo} /> Retry
                    </RetryButton>
                  </ErrorBox>
                </StateMessage>
              </Main>
            )}
          </div>
        )}

        {/* ── Analytics Page ──────────────────────────── */}
        {currentPage === 'analytics' && <AnalyticsPage />}

        {/* ── Activity Page ───────────────────────────── */}
        {currentPage === 'activity' && <ActivityPage />}

        {/* ── Reports Page ────────────────────────────── */}
        {currentPage === 'reports' && <ReportsPage onToast={showToast} />}
      </AppShell>

      {/* ── Detail Drawer ──────────────────────────────── */}
      {detailGoalId && (
        <GoalDetail
          goalId={detailGoalId}
          onClose={() => {
            setDetailGoalId(null)
            // Restore focus to the card that opened the drawer.
            window.setTimeout(() => detailTriggerRef.current?.focus(), 0)
          }}
          onEdit={handleDetailEdit}
          onDelete={handleDetailDelete}
          onToast={showToast}
        />
      )}

      {/* ── Edit Modal ─────────────────────────────────── */}
      {editingGoalId && (
        <GoalManager
          goalId={editingGoalId}
          onClose={() => {
            setEditingGoalId(null)
            dispatch(fetchGoals())
          }}
          onToast={showToast}
        />
      )}

      {/* ── Create Modal ───────────────────────────────── */}
      {showCreateModal && (
        <GoalManager
          goalId={null}
          onClose={() => {
            setShowCreateModal(false)
            dispatch(fetchGoals())
          }}
          onToast={showToast}
        />
      )}

      {/* ── Command Palette ────────────────────────────── */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={setCurrentPage}
        onCreateGoal={() => setShowCreateModal(true)}
        goals={commandGoals}
      />

      {/* ── Toasts ─────────────────────────────────────── */}
      {toasts.length > 0 && (
        <ToastContainer>
          {toasts.map((t) => (
            <Toast key={t.id} $type={t.type} $mode={themeMode}>
              <ToastDot $type={t.type} /> {t.message}
            </Toast>
          ))}
        </ToastContainer>
      )}
    </>
  )
}
