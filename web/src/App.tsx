import { useEffect, useState, useCallback, useMemo } from 'react'
import styled, { keyframes } from 'styled-components'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMoon, faSun, faSearch, faBullseye, faWallet, faChartLine, faFlagCheckered, faPlus, faRedo } from '@fortawesome/free-solid-svg-icons'
import { useAppDispatch, useAppSelector } from './store/hooks'
import {
  fetchGoals,
  selectGoalIds,
  selectGoalsLoading,
  selectGoalsError,
  selectGoalsMap,
} from './store/goalSlice'
import { toggleMode, selectMode } from './store/themeSlice'
import type { ThemeMode } from './store/themeSlice'
import GoalCard from './components/GoalCard'
import GoalManager from './components/GoalManager'
import { colors, spacing, typography, shadows, radii, breakpoints, transitions, zIndex } from './theme'
import type { Goal } from './types'

// ── Animations ────────────────────────────────────────────────────────

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
`

const slideInRight = keyframes`
  from { transform: translateX(100%); opacity: 0; }
  to   { transform: translateX(0); opacity: 1; }
`

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
`

// ── Styled Components ─────────────────────────────────────────────────

const AppContainer = styled.div<{ mode: ThemeMode }>`
  min-height: 100vh;
  background: ${(p) => (p.mode === 'dark' ? '#0f172a' : colors.gray[50])};
  color: ${(p) => (p.mode === 'dark' ? '#e2e8f0' : colors.gray[800])};
  display: flex;
  flex-direction: column;
  transition: background ${transitions.normal};
`

// ── Header / Nav ──────────────────────────────────────────────────────

const Header = styled.header`
  background: linear-gradient(135deg, ${colors.primary[600]} 0%, ${colors.primary[800]} 100%);
  color: ${colors.white};
  padding: ${spacing[2]} ${spacing[1.5]};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 20% 50%, rgba(255,255,255,0.06) 0%, transparent 60%);
    pointer-events: none;
  }
`

const HeaderInner = styled.div`
  max-width: 1024px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
`

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing[0.75]};
`

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing[0.75]};
`

const TitleGroup = styled.div`
  h1 {
    margin: 0;
    font-size: ${typography.sizes['2xl']};
    font-weight: ${typography.weights.bold};
    letter-spacing: -0.02em;

    @media (min-width: ${breakpoints.md}) {
      font-size: ${typography.sizes['3xl']};
    }
  }

  p {
    margin: ${spacing[0.25]} 0 0;
    font-size: ${typography.sizes.sm};
    opacity: 0.8;

    @media (min-width: ${breakpoints.md}) {
      font-size: ${typography.sizes.base};
    }
  }
`

const IconButton = styled.button`
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: ${colors.white};
  width: 38px;
  height: 38px;
  border-radius: ${radii.md};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background ${transitions.fast};

  &:hover {
    background: rgba(255, 255, 255, 0.22);
  }

  &:focus-visible {
    outline: 2px solid ${colors.white};
    outline-offset: 2px;
  }
`

// ── Dashboard Stats ───────────────────────────────────────────────────

const Dashboard = styled.div`
  max-width: 1024px;
  width: 100%;
  margin: 0 auto;
  padding: ${spacing[1.5]} ${spacing[1.5]} 0;

  @media (min-width: ${breakpoints.md}) {
    padding: ${spacing[2]} ${spacing[2]} 0;
  }
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${spacing[0.75]};
  animation: ${fadeIn} 0.3s ease;

  @media (min-width: ${breakpoints.md}) {
    grid-template-columns: repeat(4, 1fr);
    gap: ${spacing[1]};
  }
`

const StatCard = styled.div<{ mode: ThemeMode }>`
  background: ${(p) => (p.mode === 'dark' ? '#1e293b' : colors.white)};
  border: 1px solid ${(p) => (p.mode === 'dark' ? '#334155' : colors.gray[200])};
  border-radius: ${radii.lg};
  padding: ${spacing[0.75]} ${spacing[1]};
  transition: box-shadow ${transitions.fast}, border-color ${transitions.fast};

  &:hover {
    box-shadow: ${shadows.md};
    border-color: ${colors.primary[200]};
  }
`

const StatHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing[0.5]};
  margin-bottom: ${spacing[0.25]};
`

const StatIcon = styled.span<{ color: string }>`
  color: ${(p) => p.color};
  font-size: ${typography.sizes.sm};
  display: flex;
`

const StatLabel = styled.span<{ mode: ThemeMode }>`
  font-size: ${typography.sizes.xs};
  font-weight: ${typography.weights.medium};
  color: ${(p) => (p.mode === 'dark' ? '#94a3b8' : colors.gray[500])};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`

const StatValue = styled.div<{ mode: ThemeMode }>`
  font-size: ${typography.sizes.xl};
  font-weight: ${typography.weights.bold};
  color: ${(p) => (p.mode === 'dark' ? '#f1f5f9' : colors.gray[800])};
  line-height: 1.2;

  @media (min-width: ${breakpoints.md}) {
    font-size: ${typography.sizes['2xl']};
  }
`

const StatSub = styled.span<{ mode: ThemeMode }>`
  font-size: ${typography.sizes.xs};
  font-weight: ${typography.weights.normal};
  color: ${(p) => (p.mode === 'dark' ? '#64748b' : colors.gray[400])};
`

// ── Search / Toolbar ──────────────────────────────────────────────────

const Toolbar = styled.div`
  max-width: 1024px;
  width: 100%;
  margin: 0 auto;
  padding: ${spacing[1]} ${spacing[1.5]};
  display: flex;
  align-items: center;
  gap: ${spacing[0.75]};
  animation: ${fadeIn} 0.3s ease;

  @media (min-width: ${breakpoints.md}) {
    padding: ${spacing[1]} ${spacing[2]};
  }
`

const SearchInput = styled.input<{ mode: ThemeMode }>`
  flex: 1;
  padding: ${spacing[0.5]} ${spacing[0.75]} ${spacing[0.5]} ${spacing[2]};
  border: 1px solid ${(p) => (p.mode === 'dark' ? '#334155' : colors.gray[200])};
  border-radius: ${radii.md};
  font-size: ${typography.sizes.sm};
  background: ${(p) => (p.mode === 'dark' ? '#1e293b' : colors.white)};
  color: ${(p) => (p.mode === 'dark' ? '#e2e8f0' : colors.gray[800])};
  transition: border-color ${transitions.fast}, box-shadow ${transitions.fast};
  min-width: 0;

  &::placeholder {
    color: ${(p) => (p.mode === 'dark' ? '#64748b' : colors.gray[400])};
  }

  &:focus {
    outline: none;
    border-color: ${colors.primary[500]};
    box-shadow: 0 0 0 3px ${colors.primary[100]};
  }
`

const SearchIconWrapper = styled.div`
  position: relative;
  flex: 1;
  min-width: 0;

  svg {
    position: absolute;
    left: ${spacing[0.5]};
    top: 50%;
    transform: translateY(-50%);
    color: ${colors.gray[400]};
    font-size: ${typography.sizes.sm};
    pointer-events: none;
  }
`

const ResultCount = styled.span<{ mode: ThemeMode }>`
  font-size: ${typography.sizes.xs};
  color: ${(p) => (p.mode === 'dark' ? '#64748b' : colors.gray[400])};
  white-space: nowrap;
`

const SortSelect = styled.select<{ mode: ThemeMode }>`
  padding: ${spacing[0.5]} ${spacing[0.75]};
  border: 1px solid ${(p) => (p.mode === 'dark' ? '#334155' : colors.gray[200])};
  border-radius: ${radii.md};
  font-size: ${typography.sizes.xs};
  background: ${(p) => (p.mode === 'dark' ? '#1e293b' : colors.white)};
  color: ${(p) => (p.mode === 'dark' ? '#e2e8f0' : colors.gray[700])};
  cursor: pointer;
  transition: border-color ${transitions.fast};
  min-width: 110px;

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
  background: linear-gradient(135deg, ${colors.primary[600]}, ${colors.primary[700]});
  color: ${colors.white};
  border: none;
  border-radius: ${radii.md};
  font-size: ${typography.sizes.sm};
  font-weight: ${typography.weights.semibold};
  cursor: pointer;
  white-space: nowrap;
  transition: opacity ${transitions.fast}, transform ${transitions.fast};

  &:hover {
    opacity: 0.9;
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
  max-width: 1024px;
  width: 100%;
  margin: 0 auto;
  padding: 0 ${spacing[1.5]} ${spacing[2]};

  @media (min-width: ${breakpoints.md}) {
    padding: 0 ${spacing[2]} ${spacing[3]};
  }
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: ${spacing[1.5]};
  animation: ${fadeIn} 0.3s ease;

  @media (min-width: ${breakpoints.lg}) {
    gap: ${spacing[2]};
  }
`

// ── States ────────────────────────────────────────────────────────────

const StateMessage = styled.div<{ mode: ThemeMode }>`
  text-align: center;
  padding: ${spacing[4]} ${spacing[1.5]};
  animation: ${fadeIn} 0.3s ease;
  color: ${(p) => (p.mode === 'dark' ? '#94a3b8' : colors.gray[500])};
`

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 36px;
  height: 36px;
  border: 3px solid ${colors.gray[200]};
  border-top-color: ${colors.primary[500]};
  border-radius: ${radii.full};
  animation: ${pulse} 1.2s ease-in-out infinite;
  margin-bottom: ${spacing[1]};
`

const LoadingText = styled.p`
  font-size: ${typography.sizes.sm};
  animation: ${pulse} 1.2s ease-in-out infinite;
`

const ErrorBox = styled.div<{ mode: ThemeMode }>`
  text-align: center;
  padding: ${spacing[2]} ${spacing[1.5]};
  color: ${(p) => (p.mode === 'dark' ? '#fca5a5' : colors.error[500])};
  background: ${(p) => (p.mode === 'dark' ? '#1e1b1b' : colors.error[50])};
  border: 1px solid ${(p) => (p.mode === 'dark' ? '#7f1d1d' : colors.error[100])};
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
  max-width: 320px;
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

const NoResultsSub = styled.p`
  font-size: ${typography.sizes.sm};
  color: ${colors.gray[400]};
  margin: 0;
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
`

const Toast = styled.div<{ type: 'success' | 'error' }>`
  display: flex;
  align-items: center;
  gap: ${spacing[0.5]};
  padding: ${spacing[0.75]} ${spacing[1]};
  background: ${(p) => (p.type === 'success' ? colors.success[50] : colors.error[50])};
  border: 1px solid ${(p) => (p.type === 'success' ? colors.success[100] : colors.error[100])};
  border-left: 4px solid ${(p) => (p.type === 'success' ? colors.success[400] : colors.error[400])};
  border-radius: ${radii.md};
  box-shadow: ${shadows.lg};
  animation: ${slideInRight} 0.25s ease;
  font-size: ${typography.sizes.sm};
  color: ${(p) => (p.type === 'success' ? colors.success[600] : colors.error[600])};
  min-width: 200px;
  max-width: 360px;
`

// ── Footer ────────────────────────────────────────────────────────────

const Footer = styled.footer<{ mode: ThemeMode }>`
  text-align: center;
  padding: ${spacing[1.5]} ${spacing[1.5]};
  font-size: ${typography.sizes.xs};
  color: ${(p) => (p.mode === 'dark' ? '#475569' : colors.gray[400])};
  border-top: 1px solid ${(p) => (p.mode === 'dark' ? '#1e293b' : colors.gray[100])};
`

// ── Utility ───────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatPercent(value: number): string {
  return `${Math.round(value)}%`
}

// ── App Component ─────────────────────────────────────────────────────

export default function App() {
  const dispatch = useAppDispatch()
  const goalIds = useAppSelector(selectGoalIds)
  const goalsMap = useAppSelector(selectGoalsMap)
  const loading = useAppSelector(selectGoalsLoading)
  const error = useAppSelector(selectGoalsError)
  const themeMode = useAppSelector(selectMode)

  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'target' | 'progress' | 'date'>('date')
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' }[]>([])

  useEffect(() => {
    dispatch(fetchGoals())
  }, [dispatch])

  // ── Filtered + sorted goals ─────────────────────────────────────────
  const filteredGoalIds = useMemo(() => {
    // Filter by search
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

    // Sort
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

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <AppContainer mode={themeMode}>
      {/* ── Header ─────────────────────────────────────── */}
      <Header>
        <HeaderInner>
          <HeaderLeft>
            <TitleGroup>
              <h1>🎯 Goal Tracker</h1>
              <p>Track your financial goals and stay motivated</p>
            </TitleGroup>
          </HeaderLeft>
          <HeaderRight>
            <IconButton
              onClick={() => dispatch(toggleMode())}
              aria-label={themeMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={themeMode === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              <FontAwesomeIcon icon={themeMode === 'dark' ? faSun : faMoon} />
            </IconButton>
          </HeaderRight>
        </HeaderInner>
      </Header>

      {/* ── Search & Toolbar ───────────────────────────── */}
      {!loading && !error && goalIds.length > 0 && (
        <Toolbar>
          <SearchIconWrapper>
            <FontAwesomeIcon icon={faSearch} />
            <SearchInput
              mode={themeMode}
              type="text"
              placeholder="Search goals…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search goals"
            />
          </SearchIconWrapper>
          <SortSelect
            mode={themeMode}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            aria-label="Sort goals"
          >
            <option value="date">Newest</option>
            <option value="name">Name A-Z</option>
            <option value="target">Highest Target</option>
            <option value="progress">Most Progress</option>
          </SortSelect>
          <ResultCount mode={themeMode}>
            {filteredGoalIds.length} / {goalIds.length} goals
          </ResultCount>
          <CreateGoalButton
            onClick={() => setShowCreateModal(true)}
            aria-label="Create new goal"
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>New Goal</span>
          </CreateGoalButton>
        </Toolbar>
      )}

      {/* ── Dashboard Stats ────────────────────────────── */}
      {!loading && !error && goalIds.length > 0 && (
        <Dashboard>
          <StatsGrid>
            <StatCard mode={themeMode}>
              <StatHeader>
                <StatIcon color={colors.primary[500]}>
                  <FontAwesomeIcon icon={faBullseye} />
                </StatIcon>
                <StatLabel mode={themeMode}>Total Goals</StatLabel>
              </StatHeader>
              <StatValue mode={themeMode}>
                {stats.count}
                <StatSub mode={themeMode}> goals</StatSub>
              </StatValue>
            </StatCard>

            <StatCard mode={themeMode}>
              <StatHeader>
                <StatIcon color={colors.success[500]}>
                  <FontAwesomeIcon icon={faWallet} />
                </StatIcon>
                <StatLabel mode={themeMode}>Total Saved</StatLabel>
              </StatHeader>
              <StatValue mode={themeMode}>
                {formatCurrency(stats.totalSaved)}
              </StatValue>
            </StatCard>

            <StatCard mode={themeMode}>
              <StatHeader>
                <StatIcon color={colors.warning[500]}>
                  <FontAwesomeIcon icon={faChartLine} />
                </StatIcon>
                <StatLabel mode={themeMode}>Total Target</StatLabel>
              </StatHeader>
              <StatValue mode={themeMode}>
                {formatCurrency(stats.totalTarget)}
              </StatValue>
            </StatCard>

            <StatCard mode={themeMode}>
              <StatHeader>
                <StatIcon color={colors.primary[400]}>
                  <FontAwesomeIcon icon={faFlagCheckered} />
                </StatIcon>
                <StatLabel mode={themeMode}>Avg Progress</StatLabel>
              </StatHeader>
              <StatValue mode={themeMode}>
                {formatPercent(stats.avgProgress)}
                <StatSub mode={themeMode}> · {stats.completedGoals} done</StatSub>
              </StatValue>
            </StatCard>
          </StatsGrid>
        </Dashboard>
      )}

      {/* ── Main Content Area ──────────────────────────── */}
      <Main>
        {/* Loading State */}
        {loading && (
          <StateMessage mode={themeMode}>
            <LoadingSpinner />
            <LoadingText>Loading goals…</LoadingText>
          </StateMessage>
        )}

        {/* Error State */}
        {!loading && error && (
          <StateMessage mode={themeMode}>
            <ErrorBox mode={themeMode}>
              <div>⚠️ Failed to load goals: {error}</div>
              <RetryButton onClick={handleRetry}>
                <FontAwesomeIcon icon={faRedo} /> Retry
              </RetryButton>
            </ErrorBox>
          </StateMessage>
        )}

        {/* Empty State — no goals at all */}
        {!loading && !error && goalIds.length === 0 && (
          <StateMessage mode={themeMode}>
            <EmptyEmoji>🎯</EmptyEmoji>
            <EmptyTitle>No goals yet</EmptyTitle>
            <EmptyText>
              Start your financial journey by creating your first goal.
              Set a target amount, pick a due date, and track your progress!
            </EmptyText>
            <RetryButton
              onClick={() => setShowCreateModal(true)}
              style={{ background: colors.primary[500], marginTop: '1rem' }}
            >
              <FontAwesomeIcon icon={faPlus} /> Create Your First Goal
            </RetryButton>
          </StateMessage>
        )}

        {/* No search results */}
        {!loading && !error && goalIds.length > 0 && filteredGoalIds.length === 0 && (
          <StateMessage mode={themeMode}>
            <NoResultsEmoji>🔍</NoResultsEmoji>
            <NoResultsText>No matching goals</NoResultsText>
            <NoResultsSub>Try a different search term</NoResultsSub>
          </StateMessage>
        )}

        {/* Goals Grid */}
        {!loading && !error && filteredGoalIds.length > 0 && (
          <Grid>
            {filteredGoalIds.map((id) => (
              <GoalCard key={id} id={id} onEdit={setEditingGoalId} />
            ))}
          </Grid>
        )}
      </Main>

      {/* ── Footer ─────────────────────────────────────── */}
      {!loading && (
        <Footer mode={themeMode}>
          CommBank Goal Tracker · Built with React, Redux, Express & SQLite
        </Footer>
      )}

      {/* ── Edit Modal ─────────────────────────────────── */}
      {editingGoalId && (
        <GoalManager
          goalId={editingGoalId}
          onClose={() => setEditingGoalId(null)}
          onToast={showToast}
        />
      )}

      {/* ── Create Modal ───────────────────────────────── */}
      {showCreateModal && (
        <GoalManager
          goalId={null}
          onClose={() => setShowCreateModal(false)}
          onToast={showToast}
        />
      )}

      {/* ── Toasts ─────────────────────────────────────── */}
      {toasts.length > 0 && (
        <ToastContainer>
          {toasts.map((t) => (
            <Toast key={t.id} type={t.type}>
              {t.type === 'success' ? '✓' : '✕'} {t.message}
            </Toast>
          ))}
        </ToastContainer>
      )}
    </AppContainer>
  )
}
