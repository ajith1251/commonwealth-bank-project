import styled from 'styled-components'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronRight, faCircleCheck } from '@fortawesome/free-solid-svg-icons'
import { useAppSelector } from '../store/hooks'
import { selectGoalsMap } from '../store/goalSlice'
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
import type { ThemeMode } from '../store/themeSlice'

type Props = {
  id: string
  onViewDetail: (goalId: string) => void
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
  overflow: hidden;
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
  align-items: baseline;
  justify-content: space-between;
  gap: ${spacing[0.5]};
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

// ── Formatting Helpers ────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// ── Component ─────────────────────────────────────────────────────────

export default function GoalCard(props: Props) {
  const goal = useAppSelector(selectGoalsMap)[props.id]
  const themeMode = useAppSelector(selectMode)

  if (!goal) return null

  const progress = goal.targetAmount > 0 ? Math.min((goal.balance / goal.targetAmount) * 100, 100) : 0
  const isComplete = progress >= 100
  const urgency = isComplete ? { level: 'complete' as const, color: colors.success[600], bg: colors.success[50], border: colors.success[100] } : getUrgency(goal.targetDate)
  const progressColor = getProgressColor(progress)
  const progressGradient = getProgressGradient(progress)
  const milestone = getMilestone(progress)

  return (
    <Card
      $mode={themeMode}
      onClick={() => props.onViewDetail(goal.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          props.onViewDetail(goal.id)
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

      <AmountRow>
        <CurrentAmount $mode={themeMode}>{formatCurrency(goal.balance)}</CurrentAmount>
        <TargetAmount $mode={themeMode}>of {formatCurrency(goal.targetAmount)}</TargetAmount>
      </AmountRow>

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
