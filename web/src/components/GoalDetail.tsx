import { useCallback, useEffect, useRef, useState } from 'react'
import styled, { keyframes } from 'styled-components'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCalendarDays,
  faCircleCheck,
  faClock,
  faFlag,
  faPencil,
  faTrashCan,
  faXmark,
  faCircleExclamation,
  faFire,
  faChevronRight,
  faShareFromSquare,
  faBullseye,
} from '@fortawesome/free-solid-svg-icons'
import { useAppSelector } from '../store/hooks'
import { selectGoalsMap } from '../store/goalSlice'
import { selectMode } from '../store/themeSlice'
import {
  colors,
  spacing,
  typography,
  radii,
  transitions,
  zIndex,
  getMilestone,
  getProgressColor,
  getProgressGradient,
} from '../theme'
import type { ThemeMode } from '../store/themeSlice'
import { fetchFocusGoal, setFocusGoal } from '../api/engagement'
import { formatCurrency, formatDateLong } from '../format'

const overlayIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`

const drawerIn = keyframes`
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: ${zIndex.modal};
  display: flex;
  justify-content: flex-end;
  animation: ${overlayIn} 0.15s ease;
`

const Drawer = styled.div<{ $mode: ThemeMode }>`
  width: 100%;
  max-width: 480px;
  height: 100vh;
  background: ${(p) => (p.$mode === 'dark' ? colors.dark.surface : colors.white)};
  border-left: 1px solid ${(p) => (p.$mode === 'dark' ? colors.dark.border : colors.gray[200])};
  display: flex;
  flex-direction: column;
  animation: ${drawerIn} 0.2s ease;
  overflow-y: auto;

  @media (max-width: 480px) {
    max-width: 100%;
  }
`

const DrawerHeader = styled.div<{ $mode: ThemeMode }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${spacing[1.5]} ${spacing[1.5]} 0;

  h2 {
    font-size: ${typography.sizes.lg};
    font-weight: ${typography.weights.semibold};
    color: ${(p) => (p.$mode === 'dark' ? colors.dark.text : colors.gray[800])};
    margin: 0;
  }
`

const CloseBtn = styled.button<{ $mode: ThemeMode }>`
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: ${(p) => (p.$mode === 'dark' ? colors.dark.textMuted : colors.gray[400])};
  cursor: pointer;
  border-radius: ${radii.md};
  transition: background ${transitions.fast};

  &:hover {
    background: ${(p) => (p.$mode === 'dark' ? colors.dark.surfaceAlt : colors.gray[100])};
    color: ${(p) => (p.$mode === 'dark' ? colors.dark.text : colors.gray[600])};
  }
`

const Hero = styled.div<{ $mode: ThemeMode }>`
  padding: ${spacing[1.5]} ${spacing[1.5]} 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`

const HeroIcon = styled.div`
  font-size: 4rem;
  line-height: 1;
  margin-bottom: ${spacing[0.75]};
`

const HeroName = styled.h1<{ $mode: ThemeMode }>`
  font-size: ${typography.sizes['2xl']};
  font-weight: ${typography.weights.bold};
  color: ${(p) => (p.$mode === 'dark' ? colors.dark.text : colors.gray[800])};
  margin: 0 0 ${spacing[0.25]};
`

const HeroMilestone = styled.span<{ $color: string; $bg: string }>`
  font-size: ${typography.sizes.xs};
  font-weight: ${typography.weights.semibold};
  color: ${(p) => p.$color};
  background: ${(p) => p.$bg};
  padding: 3px 10px;
  border-radius: ${radii.full};
  text-transform: uppercase;
  letter-spacing: 0.04em;
`

const ProgressSection = styled.div`
  padding: ${spacing[1.5]} ${spacing[1.5]} 0;
`

const AmountRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: ${spacing[0.5]};
`

const CurrentAmount = styled.span<{ $mode: ThemeMode }>`
  font-size: ${typography.sizes['2xl']};
  font-weight: ${typography.weights.bold};
  color: ${(p) => (p.$mode === 'dark' ? colors.dark.text : colors.gray[800])};
`

const TargetAmount = styled.span<{ $mode: ThemeMode }>`
  font-size: ${typography.sizes.sm};
  color: ${(p) => (p.$mode === 'dark' ? colors.dark.textMuted : colors.gray[400])};
`

const ProgressBarOuter = styled.div<{ $mode: ThemeMode }>`
  width: 100%;
  height: 10px;
  background: ${(p) => (p.$mode === 'dark' ? colors.dark.surfaceAlt : colors.gray[100])};
  border-radius: ${radii.full};
  overflow: hidden;
  margin-bottom: ${spacing[0.5]};
`

const ProgressBarInner = styled.div<{ $progress: number; $gradient: string }>`
  height: 100%;
  width: ${(p) => Math.min(p.$progress, 100)}%;
  background: ${(p) => p.$gradient};
  border-radius: ${radii.full};
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
`

const ProgressLabels = styled.div`
  display: flex;
  justify-content: space-between;
`

const PercentLabel = styled.span<{ $color: string }>`
  font-size: ${typography.sizes.sm};
  font-weight: ${typography.weights.semibold};
  color: ${(p) => p.$color};
`

const RemainingLabel = styled.span<{ $mode: ThemeMode }>`
  font-size: ${typography.sizes.sm};
  color: ${(p) => (p.$mode === 'dark' ? colors.dark.textSecondary : colors.gray[500])};
`

const DetailsGrid = styled.div<{ $mode: ThemeMode }>`
  padding: ${spacing[1.5]} ${spacing[1.5]};
  display: flex;
  flex-direction: column;
  gap: ${spacing[0.75]};
`

const DetailRow = styled.div<{ $mode: ThemeMode }>`
  display: flex;
  align-items: center;
  gap: ${spacing[0.75]};
  padding: ${spacing[0.75]} ${spacing[1]};
  background: ${(p) => (p.$mode === 'dark' ? colors.dark.surfaceAlt + '60' : colors.gray[50])};
  border-radius: ${radii.md};
`

const DetailIcon = styled.div<{ $color?: string }>`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${(p) => p.$color ?? colors.gray[400]};
  font-size: ${typography.sizes.sm};
`

const DetailContent = styled.div`
  flex: 1;
  min-width: 0;
`

const DetailLabel = styled.div<{ $mode: ThemeMode }>`
  font-size: ${typography.sizes.xs};
  color: ${(p) => (p.$mode === 'dark' ? colors.dark.textMuted : colors.gray[400])};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: ${typography.weights.medium};
`

const DetailValue = styled.div<{ $mode: ThemeMode }>`
  font-size: ${typography.sizes.sm};
  font-weight: ${typography.weights.medium};
  color: ${(p) => (p.$mode === 'dark' ? colors.dark.text : colors.gray[700])};
`

const UrgencyBadge = styled.span<{ $bg: string; $color: string; $border: string }>`
  font-size: 0.65rem;
  font-weight: ${typography.weights.bold};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 2px 8px;
  border-radius: ${radii.full};
  background: ${(p) => p.$bg};
  color: ${(p) => p.$color};
  border: 1px solid ${(p) => p.$border};
`

const ActionButtons = styled.div<{ $mode: ThemeMode }>`
  padding: 0 ${spacing[1.5]} ${spacing[1.5]};
  display: flex;
  gap: ${spacing[0.75]};
`

const EditButton = styled.button<{ $mode: ThemeMode }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${spacing[0.5]};
  padding: ${spacing[0.75]} ${spacing[1]};
  background: ${colors.primary[600]};
  color: ${colors.white};
  border: none;
  border-radius: ${radii.md};
  font-size: ${typography.sizes.sm};
  font-weight: ${typography.weights.semibold};
  cursor: pointer;
  transition: background ${transitions.fast};

  &:hover {
    background: ${colors.primary[700]};
  }
`

const DeleteBtn = styled.button<{ $mode: ThemeMode }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${spacing[0.5]};
  padding: ${spacing[0.75]} ${spacing[1]};
  background: ${(p) => (p.$mode === 'dark' ? 'transparent' : colors.white)};
  color: ${(p) => (p.$mode === 'dark' ? colors.dark.textSecondary : colors.gray[500])};
  border: 1px solid ${(p) => (p.$mode === 'dark' ? colors.dark.border : colors.gray[200])};
  border-radius: ${radii.md};
  font-size: ${typography.sizes.sm};
  cursor: pointer;
  transition: all ${transitions.fast};

  &:hover {
    color: ${colors.error[500]};
    border-color: ${colors.error[200]};
    background: ${colors.error[50]};
  }
`

const Divider = styled.div<{ $mode: ThemeMode }>`
  height: 1px;
  background: ${(p) => (p.$mode === 'dark' ? colors.dark.border : colors.gray[200])};
  margin: 0 ${spacing[1.5]};
`

// ── Helpers ───────────────────────────────────────────────────────────

function getDaysUntil(targetDate: string): number {
  const now = new Date()
  const target = new Date(targetDate)
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function getUrgency(targetDate: string) {
  const days = getDaysUntil(targetDate)
  if (days < 0) return { color: colors.error[600], bg: colors.error[50], border: colors.error[100], label: `${Math.abs(days)} days overdue`, icon: faCircleExclamation }
  if (days === 0) return { color: colors.warning[500], bg: colors.warning[50], border: colors.warning[100], label: 'Due today', icon: faFire }
  if (days <= 7) return { color: colors.warning[500], bg: colors.warning[50], border: colors.warning[100], label: `${days} days left`, icon: faClock }
  if (days <= 30) return { color: colors.primary[500], bg: colors.primary[50], border: colors.primary[100], label: `${days} days left`, icon: faClock }
  return { color: colors.success[500], bg: colors.success[50], border: colors.success[100], label: formatDateLong(targetDate), icon: faCalendarDays }
}

type Props = {
  goalId: string
  onClose: () => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onToast: (message: string, type: 'success' | 'error') => void
}

export default function GoalDetail({ goalId, onClose, onEdit, onDelete, onToast }: Props) {
  const goal = useAppSelector(selectGoalsMap)[goalId]
  const themeMode = useAppSelector(selectMode)
  const drawerRef = useRef<HTMLDivElement>(null)
  const [focusGoalId, setFocusGoalId] = useState<string | null>(null)
  const [focusUpdating, setFocusUpdating] = useState(false)

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [])

  // Load the current focus goal so the drawer can offer the action.
  useEffect(() => {
    let mounted = true
    fetchFocusGoal()
      .then((g) => mounted && setFocusGoalId(g ? g.id : null))
      .catch(() => undefined)
    return () => {
      mounted = false
    }
  }, [])

  const handleSetFocus = async () => {
    if (!goal || focusUpdating) return
    setFocusUpdating(true)
    try {
      const g = await setFocusGoal(goal.id)
      setFocusGoalId(g ? g.id : null)
      onToast('Set as focus goal', 'success')
    } catch {
      onToast('Failed to update focus goal', 'error')
    } finally {
      setFocusUpdating(false)
    }
  }

  // Focus trap — cycle tab through focusable elements inside the drawer
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }

      if (e.key === 'Tab') {
        const drawer = drawerRef.current
        if (!drawer) return

        const focusable = drawer.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        if (focusable.length === 0) return

        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    },
    [onClose],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    // Focus the first focusable element inside the drawer on mount
    const drawer = drawerRef.current
    if (drawer) {
      const first = drawer.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      first?.focus()
    }
  }, [])

  if (!goal) return null

  const progress = goal.targetAmount > 0 ? Math.min((goal.balance / goal.targetAmount) * 100, 100) : 0
  const remaining = Math.max(goal.targetAmount - goal.balance, 0)
  const milestone = getMilestone(progress)
  const progressColor = getProgressColor(progress)
  const progressGradient = getProgressGradient(progress)
  const isComplete = progress >= 100
  const urgency = isComplete ? { color: colors.success[600], bg: colors.success[50], border: colors.success[100], label: 'Achieved', icon: faCircleCheck } : getUrgency(goal.targetDate)

  return (
    <Overlay onClick={onClose}>
      <Drawer
        $mode={themeMode}
        ref={drawerRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`Details for ${goal.name}`}
      >
        <DrawerHeader $mode={themeMode}>
          <h2>Goal Details</h2>
          <CloseBtn $mode={themeMode} onClick={onClose} aria-label="Close">
            <FontAwesomeIcon icon={faXmark} size="lg" />
          </CloseBtn>
        </DrawerHeader>

        {/* Hero Section */}
        <Hero $mode={themeMode}>
          {goal.icon && <HeroIcon>{goal.icon}</HeroIcon>}
          <HeroName $mode={themeMode}>{goal.name}</HeroName>
          <HeroMilestone $color={milestone.color} $bg={milestone.bg}>
            {isComplete ? <FontAwesomeIcon icon={faCircleCheck} size="xs" /> : <FontAwesomeIcon icon={faChevronRight} size="xs" />}{' '}
            {milestone.label}
          </HeroMilestone>
        </Hero>

        {/* Progress */}
        <ProgressSection>
          <AmountRow>
            <CurrentAmount $mode={themeMode}>{formatCurrency(goal.balance)}</CurrentAmount>
            <TargetAmount $mode={themeMode}>of {formatCurrency(goal.targetAmount)}</TargetAmount>
          </AmountRow>
          <ProgressBarOuter $mode={themeMode}>
            <ProgressBarInner $progress={progress} $gradient={progressGradient} />
          </ProgressBarOuter>
          <ProgressLabels>
            <PercentLabel $color={progressColor}>{Math.round(progress)}%</PercentLabel>
            {remaining > 0 && (
              <RemainingLabel $mode={themeMode}>{formatCurrency(remaining)} remaining</RemainingLabel>
            )}
          </ProgressLabels>
        </ProgressSection>

        <Divider $mode={themeMode} />

        {/* Details */}
        <DetailsGrid $mode={themeMode}>
          <DetailRow $mode={themeMode}>
            <DetailIcon $color={colors.primary[500]}>
              <FontAwesomeIcon icon={faFlag} />
            </DetailIcon>
            <DetailContent>
              <DetailLabel $mode={themeMode}>Target Amount</DetailLabel>
              <DetailValue $mode={themeMode}>{formatCurrency(goal.targetAmount)}</DetailValue>
            </DetailContent>
          </DetailRow>

          <DetailRow $mode={themeMode}>
            <DetailIcon $color={urgency.color}>
              <FontAwesomeIcon icon={urgency.icon} />
            </DetailIcon>
            <DetailContent>
              <DetailLabel $mode={themeMode}>Target Date</DetailLabel>
              <DetailValue $mode={themeMode}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {formatDateLong(goal.targetDate)}
                  <UrgencyBadge $bg={urgency.bg} $color={urgency.color} $border={urgency.border}>
                    {urgency.label}
                  </UrgencyBadge>
                </span>
              </DetailValue>
            </DetailContent>
          </DetailRow>

          <DetailRow $mode={themeMode}>
            <DetailIcon $color={colors.gray[400]}>
              <FontAwesomeIcon icon={faCalendarDays} />
            </DetailIcon>
            <DetailContent>
              <DetailLabel $mode={themeMode}>Created</DetailLabel>
              <DetailValue $mode={themeMode}>{formatDateLong(goal.created)}</DetailValue>
            </DetailContent>
          </DetailRow>
        </DetailsGrid>

        {/* Actions */}
        <Divider $mode={themeMode} />

        <ActionButtons $mode={themeMode}>
          <EditButton $mode={themeMode} onClick={() => onEdit(goal.id)}>
            <FontAwesomeIcon icon={faPencil} />
            Edit Goal
          </EditButton>
          <DeleteBtn $mode={themeMode} onClick={() => onDelete(goal.id)} aria-label="Delete goal">
            <FontAwesomeIcon icon={faTrashCan} />
          </DeleteBtn>
        </ActionButtons>

        {/* Focus Goal Action */}
        <div style={{ padding: `0 ${spacing[1.5]} ${spacing[1]}`, marginTop: spacing[0.5] }}>
          <button
            onClick={handleSetFocus}
            disabled={focusUpdating || focusGoalId === goal.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              width: '100%',
              padding: '8px 12px',
              border: `1px solid ${colors.primary[200]}`,
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              background: focusGoalId === goal.id
                ? (themeMode === 'dark' ? 'rgba(59,130,246,0.12)' : colors.primary[50])
                : 'transparent',
              color: focusGoalId === goal.id ? colors.primary[600] : (themeMode === 'dark' ? '#94a3b8' : '#64748b'),
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (focusGoalId !== goal.id) {
                e.currentTarget.style.borderColor = colors.primary[400]
                e.currentTarget.style.color = colors.primary[600]
              }
            }}
            onMouseLeave={(e) => {
              if (focusGoalId !== goal.id) {
                e.currentTarget.style.borderColor = colors.primary[200]
                e.currentTarget.style.color = themeMode === 'dark' ? '#94a3b8' : '#64748b'
              }
            }}
            aria-label={focusGoalId === goal.id ? 'This is your focus goal' : 'Set as focus goal'}
          >
            <FontAwesomeIcon icon={faBullseye} />
            {focusUpdating
              ? 'Updating…'
              : focusGoalId === goal.id
                ? 'Focus Goal ✓'
                : 'Set as Focus Goal'}
          </button>
        </div>

        {/* Share Section */}
        <div style={{ padding: `0 ${spacing[1.5]} ${spacing[1.5]}` }}>
          <button
            onClick={() => {
              const url = `${window.location.origin}${window.location.pathname}?goal=${goal.id}`
              navigator.clipboard.writeText(url).then(
                () => onToast('Share link copied to clipboard', 'success'),
                () => onToast('Failed to copy link', 'error'),
              )
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              width: '100%',
              padding: '8px 12px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              background: themeMode === 'dark' ? '#1e293b' : '#f8fafc',
              color: themeMode === 'dark' ? '#94a3b8' : '#64748b',
              transition: 'background 0.15s ease, color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = themeMode === 'dark' ? '#334155' : '#f1f5f9'
              e.currentTarget.style.color = themeMode === 'dark' ? '#e2e8f0' : '#3b82f6'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = themeMode === 'dark' ? '#1e293b' : '#f8fafc'
              e.currentTarget.style.color = themeMode === 'dark' ? '#94a3b8' : '#64748b'
            }}
            aria-label="Share goal link"
          >
            <FontAwesomeIcon icon={faShareFromSquare} />
            Copy Share Link
          </button>
        </div>
      </Drawer>
    </Overlay>
  )
}
