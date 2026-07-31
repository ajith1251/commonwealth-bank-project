import { useState, useCallback, useRef, useEffect } from 'react'
import styled from 'styled-components'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronRight, faCircleCheck, faPlus, faCheck, faXmark } from '@fortawesome/free-solid-svg-icons'
import { useAppSelector, useAppDispatch } from '../store/hooks'
import { selectGoalsMap, updateGoalRedux } from '../store/goalSlice'
import { updateGoal as updateGoalApi } from '../api/lib'
import { selectMode } from '../store/themeSlice'
import {
  colors,
  spacing,
  typography,
  shadows,
  radii,
  transitions,
  getMilestone,
  getProgressColor,
  getProgressGradient,
} from '../theme'
import { formatCurrency } from '../format'
import type { ThemeMode } from '../store/themeSlice'
import type { Goal } from '../types'

type Props = {
  id: string
  onViewDetail: (goalId: string) => void
  onToast: (message: string, type: 'success' | 'error') => void
}

// ── Urgency Helpers ───────────────────────────────────────────────────

function getDaysUntil(targetDate: string): number {
  const now = new Date()
  const target = new Date(targetDate)
  const diff = target.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function getRelativeDateLabel(targetDate: string): string {
  const days = getDaysUntil(targetDate)
  if (days < 0) return `${Math.abs(days)}d overdue`
  if (days === 0) return 'Due today'
  if (days <= 7) return `${days}d left`
  const weeks = Math.floor(days / 7)
  if (weeks <= 4) return `${weeks}w left`
  const months = Math.floor(days / 30)
  if (months <= 12) return `${months}mo left`
  return `>1y left`
}

type Urgency = 'overdue' | 'urgent' | 'soon' | 'normal' | 'distant'

function getUrgency(targetDate: string): { level: Urgency; color: string; bg: string; border: string } {
  const days = getDaysUntil(targetDate)
  if (days < 0) return { level: 'overdue', color: colors.error[600], bg: colors.error[50], border: colors.error[100] }
  if (days <= 7) return { level: 'urgent', color: colors.warning[500], bg: colors.warning[50], border: colors.warning[100] }
  if (days <= 30) return { level: 'soon', color: colors.primary[500], bg: colors.primary[50], border: colors.primary[100] }
  if (days <= 180) return { level: 'normal', color: colors.success[500], bg: colors.success[50], border: colors.success[100] }
  return { level: 'distant', color: colors.gray[400], bg: colors.gray[50], border: colors.gray[200] }
}

// ── Styled Components ─────────────────────────────────────────────────

const Card = styled.div<{ $mode: ThemeMode }>`
  background: ${(p) => (p.$mode === 'dark' ? colors.dark.surface : colors.white)};
  border: 1px solid ${(p) => (p.$mode === 'dark' ? colors.dark.border : colors.gray[200])};
  border-radius: ${radii.xl};
  padding: ${spacing[1.25]};
  cursor: pointer;
  transition: box-shadow ${transitions.normal}, transform ${transitions.fast}, border-color ${transitions.normal};
  position: relative;
  overflow: visible;
  display: flex;
  flex-direction: column;
  gap: ${spacing[0.75]};

  &:hover {
    box-shadow: ${(p) => (p.$mode === 'dark' ? shadows.dark.lg : shadows.lg)};
    transform: translateY(-2px);
    border-color: ${(p) => (p.$mode === 'dark' ? colors.dark.borderLight : colors.primary[200])};
  }

  &:active {
    transform: translateY(0);
    box-shadow: ${(p) => (p.$mode === 'dark' ? shadows.dark.sm : shadows.sm)};
  }
`

const TopRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${spacing[0.75]};
`

const IconNameGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing[0.75]};
  min-width: 0;
  flex: 1;
`

const IconCircle = styled.div<{ $mode: ThemeMode }>`
  width: 44px;
  height: 44px;
  border-radius: ${radii.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  background: ${(p) => (p.$mode === 'dark' ? colors.dark.surfaceAlt : colors.primary[50])};
  flex-shrink: 0;
  transition: transform ${transitions.normal};

  ${Card}:hover & {
    transform: scale(1.05);
  }
`

const NameGroup = styled.div`
  min-width: 0;
  flex: 1;
`

const GoalName = styled.h3<{ $mode: ThemeMode }>`
  margin: 0;
  font-size: ${typography.sizes.base};
  font-weight: ${typography.weights.semibold};
  color: ${(p) => (p.$mode === 'dark' ? colors.dark.text : colors.gray[800])};
  line-height: ${typography.lineHeights.tight};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const ProgressPercentSmall = styled.span<{ $color: string }>`
  font-size: ${typography.sizes.sm};
  font-weight: ${typography.weights.bold};
  color: ${(p) => p.$color};
  flex-shrink: 0;
`

const ChevronIcon = styled.div<{ $mode: ThemeMode }>`
  color: ${(p) => (p.$mode === 'dark' ? colors.dark.textMuted : colors.gray[300])};
  font-size: ${typography.sizes.sm};
  margin-top: 2px;
  flex-shrink: 0;
  transition: transform ${transitions.fast}, color ${transitions.fast};

  ${Card}:hover & {
    transform: translateX(2px);
    color: ${colors.primary[500]};
  }
`

// ── Amount Row ────────────────────────────────────────────────────────

const AmountRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${spacing[0.5]};
`

const AmountLeft = styled.div`
  display: flex;
  align-items: baseline;
  gap: ${spacing[0.25]};
  min-width: 0;
`

const CurrentAmount = styled.span<{ $mode: ThemeMode }>`
  font-size: ${typography.sizes.lg};
  font-weight: ${typography.weights.bold};
  color: ${(p) => (p.$mode === 'dark' ? colors.dark.text : colors.gray[800])};
`

const TargetAmount = styled.span<{ $mode: ThemeMode }>`
  font-size: ${typography.sizes.xs};
  color: ${(p) => (p.$mode === 'dark' ? colors.dark.textMuted : colors.gray[400])};
`

const AddBalanceBtn = styled.button<{ $mode: ThemeMode }>`
  width: 28px;
  height: 28px;
  border-radius: ${radii.md};
  border: 1px dashed ${(p) => (p.$mode === 'dark' ? colors.dark.borderLight : colors.gray[300])};
  background: ${(p) => (p.$mode === 'dark' ? 'transparent' : colors.gray[50])};
  color: ${(p) => (p.$mode === 'dark' ? colors.dark.textMuted : colors.gray[400])};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.65rem;
  transition: all ${transitions.fast};
  flex-shrink: 0;

  &:hover {
    border-style: solid;
    border-color: ${colors.primary[400]};
    background: ${(p) => (p.$mode === 'dark' ? colors.primary[900] + '60' : colors.primary[50])};
    color: ${colors.primary[600]};
  }
`

// ── Inline Balance Input ──────────────────────────────────────────────

const InputRow = styled.div<{ $mode: ThemeMode }>`
  display: flex;
  align-items: center;
  gap: ${spacing[0.5]};
  padding: ${spacing[0.5]} ${spacing[0.75]};
  background: ${(p) => (p.$mode === 'dark' ? colors.dark.surfaceAlt : colors.primary[50])};
  border: 1px solid ${colors.primary[200]};
  border-radius: ${radii.md};
  position: relative;
  z-index: 5;
`

const BalanceInput = styled.input<{ $mode: ThemeMode }>`
  flex: 1;
  border: none;
  background: transparent;
  font-size: ${typography.sizes.sm};
  font-weight: ${typography.weights.semibold};
  color: ${(p) => (p.$mode === 'dark' ? colors.dark.text : colors.gray[800])};
  outline: none;
  min-width: 0;
  width: 60px;

  &::placeholder {
    color: ${(p) => (p.$mode === 'dark' ? colors.dark.textMuted : colors.gray[400])};
  }
`

const InputAction = styled.button<{ $color?: string }>`
  width: 26px;
  height: 26px;
  border-radius: ${radii.sm};
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.65rem;
  background: ${(p) => p.$color ?? colors.primary[600]};
  color: ${colors.white};
  transition: opacity ${transitions.fast};

  &:hover {
    opacity: 0.85;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`

// ── Progress Bar ──────────────────────────────────────────────────────

const ProgressBarOuter = styled.div<{ $mode: ThemeMode }>`
  width: 100%;
  height: 8px;
  background: ${(p) => (p.$mode === 'dark' ? colors.dark.surfaceAlt : colors.gray[100])};
  border-radius: ${radii.full};
  overflow: hidden;
`

const ProgressBarInner = styled.div<{ $progress: number; $gradient: string }>`
  height: 100%;
  width: ${(p) => Math.min(p.$progress, 100)}%;
  background: ${(p) => p.$gradient};
  border-radius: ${radii.full};
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
`

// ── Footer Row ────────────────────────────────────────────────────────

const FooterRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const UrgencyBadge = styled.span<{ $bg: string; $color: string; $border: string; $mode: ThemeMode }>`
  font-size: 0.625rem;
  font-weight: ${typography.weights.semibold};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 2px 8px;
  border-radius: ${radii.full};
  background: ${(p) => p.$bg};
  color: ${(p) => p.$color};
  border: 1px solid ${(p) => p.$border};
`

const MilestoneLabel = styled.span<{ $mode: ThemeMode }>`
  font-size: 0.625rem;
  color: ${(p) => (p.$mode === 'dark' ? colors.dark.textMuted : colors.gray[400])};
  font-weight: ${typography.weights.medium};
`

// ── Completion Badge ──────────────────────────────────────────────────

const CompletedIcon = styled.span`
  font-size: ${typography.sizes.sm};
  color: ${colors.success[500]};
  display: flex;
  align-items: center;
`

// ── Component ─────────────────────────────────────────────────────────

export default function GoalCard({ id, onViewDetail, onToast }: Props) {
  const dispatch = useAppDispatch()
  const goal = useAppSelector(selectGoalsMap)[id]
  const themeMode = useAppSelector(selectMode)

  const [showInput, setShowInput] = useState(false)
  const [addAmount, setAddAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (showInput) inputRef.current?.focus()
  }, [showInput])

  const handleAddClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setShowInput(true)
  }, [])

  const handleCancel = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setShowInput(false)
    setAddAmount('')
  }, [])

  const handleConfirm = useCallback(async (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation()
    if (!goal || saving) return

    const amount = parseFloat(addAmount)
    if (isNaN(amount) || amount <= 0) return

    setSaving(true)
    const newBalance = goal.balance + amount
    const updatedGoal: Goal = { ...goal, balance: newBalance }

    dispatch(updateGoalRedux(updatedGoal))
    const result = await updateGoalApi(goal.id, updatedGoal)
    setSaving(false)
    setShowInput(false)
    setAddAmount('')

    if (result.error) {
      onToast(result.error.message || 'Failed to update balance', 'error')
    } else {
      onToast(`Added ${formatCurrency(amount)} to ${goal.name}`, 'success')
    }
  }, [goal, addAmount, saving, dispatch, onToast])

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm(e as unknown as React.MouseEvent)
    }
    if (e.key === 'Escape') {
      e.stopPropagation()
      setShowInput(false)
      setAddAmount('')
    }
  }, [handleConfirm])

  if (!goal) return null

  const progress = goal.targetAmount > 0 ? Math.min((goal.balance / goal.targetAmount) * 100, 100) : 0
  const isComplete = progress >= 100
  const urgency = isComplete ? { level: 'complete' as const, color: colors.success[600], bg: colors.success[50], border: colors.success[100] } : getUrgency(goal.targetDate)
  const progressColor = getProgressColor(progress)
  const progressGradient = getProgressGradient(progress)
  const milestone = getMilestone(progress)
  const remaining = Math.max(goal.targetAmount - goal.balance, 0)

  return (
    <Card
      $mode={themeMode}
      onClick={() => onViewDetail(goal.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onViewDetail(goal.id)
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`${goal.name}: ${Math.round(progress)}% complete, ${formatCurrency(goal.balance)} of ${formatCurrency(goal.targetAmount)}`}
    >
      <TopRow>
        <IconNameGroup>
          <IconCircle $mode={themeMode}>
            {goal.icon || '🎯'}
          </IconCircle>
          <NameGroup>
            <GoalName $mode={themeMode}>{goal.name}</GoalName>
          </NameGroup>
        </IconNameGroup>
        {isComplete ? (
          <CompletedIcon>
            <FontAwesomeIcon icon={faCircleCheck} />
          </CompletedIcon>
        ) : (
          <ProgressPercentSmall $color={progressColor}>
            {Math.round(progress)}%
          </ProgressPercentSmall>
        )}
        <ChevronIcon $mode={themeMode}>
          <FontAwesomeIcon icon={faChevronRight} />
        </ChevronIcon>
      </TopRow>

      {showInput ? (
        <InputRow $mode={themeMode} onClick={(e) => e.stopPropagation()}>
          <span style={{ fontSize: '0.75rem', color: colors.gray[400], fontWeight: 600 }}>$</span>
          <BalanceInput
            $mode={themeMode}
            ref={inputRef}
            type="number"
            min={1}
            step={1}
            placeholder="Amount"
            value={addAmount}
            onChange={(e) => setAddAmount(e.target.value)}
            onKeyDown={handleInputKeyDown}
            aria-label="Amount to add"
          />
          {remaining > 0 && (
            <span style={{ fontSize: '0.6rem', color: colors.gray[400], whiteSpace: 'nowrap' }}>
              max {formatCurrency(remaining)}
            </span>
          )}
          <InputAction
            $color={colors.success[500]}
            onClick={handleConfirm}
            disabled={!addAmount || saving}
            aria-label="Confirm add"
          >
            <FontAwesomeIcon icon={faCheck} />
          </InputAction>
          <InputAction
            $color={colors.gray[400]}
            onClick={handleCancel}
            aria-label="Cancel"
          >
            <FontAwesomeIcon icon={faXmark} />
          </InputAction>
        </InputRow>
      ) : (
        <AmountRow>
          <AmountLeft>
            <CurrentAmount $mode={themeMode}>{formatCurrency(goal.balance)}</CurrentAmount>
            <TargetAmount $mode={themeMode}>of {formatCurrency(goal.targetAmount)}</TargetAmount>
          </AmountLeft>
          {!isComplete && (
            <AddBalanceBtn
              $mode={themeMode}
              onClick={handleAddClick}
              aria-label="Add to balance"
              title="Quick-add to balance"
            >
              <FontAwesomeIcon icon={faPlus} />
            </AddBalanceBtn>
          )}
        </AmountRow>
      )}

      <ProgressBarOuter $mode={themeMode}>
        <ProgressBarInner $progress={progress} $gradient={progressGradient} />
      </ProgressBarOuter>

      <FooterRow>
        <UrgencyBadge
          $bg={urgency.bg}
          $color={urgency.color}
          $border={urgency.border}
          $mode={themeMode}
        >
          {isComplete ? 'Achieved' : getRelativeDateLabel(goal.targetDate)}
        </UrgencyBadge>
        <MilestoneLabel $mode={themeMode}>
          {isComplete && <><FontAwesomeIcon icon={faCircleCheck} size="xs" /> </>}
          {milestone.label}
        </MilestoneLabel>
      </FooterRow>
    </Card>
  )
}
