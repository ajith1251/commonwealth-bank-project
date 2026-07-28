import styled from 'styled-components'
import { useAppSelector } from '../store/hooks'
import { selectGoalsMap } from '../store/goalSlice'
import { colors, spacing, typography, shadows, radii, transitions } from '../theme'

type Props = {
  id: string
  onEdit: (goalId: string) => void
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
  if (days < 0) return 'Overdue!'
  if (days === 0) return 'Due today!'
  if (days === 1) return 'Due tomorrow'
  if (days <= 7) return `${days} days left`
  const weeks = Math.floor(days / 7)
  if (weeks <= 4) return `${weeks}w left`
  const months = Math.floor(days / 30)
  if (months <= 12) return `${months}mo left`
  return `>1y left`
}

type Urgency = 'overdue' | 'urgent' | 'soon' | 'normal' | 'distant'

function getUrgency(targetDate: string): { level: Urgency; color: string; bg: string; border: string } {
  const days = getDaysUntil(targetDate)

  if (days < 0) {
    return { level: 'overdue', color: colors.error[600], bg: colors.error[50], border: colors.error[100] }
  }
  if (days <= 7) {
    return { level: 'urgent', color: colors.warning[500], bg: colors.warning[50], border: colors.warning[100] }
  }
  if (days <= 30) {
    return { level: 'soon', color: '#d69e2e', bg: '#fffff0', border: '#fefcbf' }
  }
  if (days <= 180) {
    return { level: 'normal', color: colors.primary[500], bg: colors.primary[50], border: colors.primary[100] }
  }
  return { level: 'distant', color: colors.gray[400], bg: colors.gray[50], border: colors.gray[200] }
}

function getProgressColor(progress: number): string {
  if (progress >= 100) return colors.success[500]
  if (progress >= 75) return colors.success[400]
  if (progress >= 50) return colors.primary[500]
  if (progress >= 25) return colors.warning[500]
  return colors.error[400]
}

function getProgressGradient(progress: number): string {
  if (progress >= 100) return `linear-gradient(90deg, ${colors.success[400]}, ${colors.success[600]})`
  if (progress >= 75) return `linear-gradient(90deg, ${colors.success[400]}, ${colors.success[500]})`
  if (progress >= 50) return `linear-gradient(90deg, ${colors.primary[400]}, ${colors.primary[500]})`
  if (progress >= 25) return `linear-gradient(90deg, ${colors.warning[400]}, ${colors.warning[500]})`
  return `linear-gradient(90deg, ${colors.error[400]}, ${colors.error[500]})`
}

// ── Styled Components ─────────────────────────────────────────────────

const Container = styled.div`
  background: ${colors.white};
  border: 1px solid ${colors.gray[200]};
  border-radius: ${radii.lg};
  padding: ${spacing[1.5]};
  cursor: pointer;
  transition: box-shadow ${transitions.normal}, transform ${transitions.fast}, border-color ${transitions.normal};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${spacing[0.5]};
  position: relative;
  overflow: hidden;

  &:hover {
    box-shadow: ${shadows.lg};
    transform: translateY(-3px);
    border-color: ${colors.primary[200]};
  }

  &:active {
    transform: translateY(-1px);
    box-shadow: ${shadows.sm};
  }
`

const Icon = styled.h1`
  font-size: 5rem;
  margin: 0;
  line-height: 1;
  user-select: none;
  transition: transform ${transitions.normal};

  ${Container}:hover & {
    transform: scale(1.1) rotate(-4deg);
  }
`

const Name = styled.h3`
  margin: ${spacing[0.25]} 0;
  font-size: ${typography.sizes.base};
  font-weight: ${typography.weights.semibold};
  color: ${colors.gray[800]};
  text-align: center;
  line-height: ${typography.lineHeights.tight};
`

const TargetAmount = styled.span`
  font-size: ${typography.sizes.xl};
  font-weight: ${typography.weights.bold};
  color: ${colors.primary[600]};
`

// ── Urgency Badge ─────────────────────────────────────────────────────

const BadgeRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing[0.5]};
  width: 100%;
  justify-content: center;
`

const UrgencyBadge = styled.span<{ $bg: string; $color: string; $border: string }>`
  font-size: 0.65rem;
  font-weight: ${typography.weights.semibold};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 2px 8px;
  border-radius: ${radii.full};
  background: ${(p) => p.$bg};
  color: ${(p) => p.$color};
  border: 1px solid ${(p) => p.$border};
`

const DueDate = styled.span`
  font-size: ${typography.sizes.xs};
  color: ${colors.gray[400]};
`

// ── Progress ──────────────────────────────────────────────────────────

const ProgressBarOuter = styled.div`
  width: 100%;
  height: 10px;
  background: ${colors.gray[100]};
  border-radius: ${radii.full};
  overflow: hidden;
  margin-top: ${spacing[0.5]};
`

const ProgressBarInner = styled.div<{ $progress: number; $gradient: string }>`
  height: 100%;
  width: ${(p) => Math.min(p.$progress, 100)}%;
  background: ${(p) => p.$gradient};
  border-radius: ${radii.full};
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
`

const SavedInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-top: ${spacing[0.25]};
`

const SavedAmount = styled.span`
  font-size: ${typography.sizes.xs};
  font-weight: ${typography.weights.medium};
  color: ${colors.gray[600]};
`

const ProgressPercent = styled.span<{ $color: string }>`
  font-size: ${typography.sizes.xs};
  font-weight: ${typography.weights.bold};
  color: ${(p) => p.$color};
`

// ── Formatting Helpers ────────────────────────────────────────────────

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

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

  if (!goal) return null

  const progress = goal.targetAmount > 0 ? Math.min((goal.balance / goal.targetAmount) * 100, 100) : 0
  const urgency = getUrgency(goal.targetDate)
  const progressColor = getProgressColor(progress)
  const progressGradient = getProgressGradient(progress)

  return (
    <Container
      onClick={() => props.onEdit(goal.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          props.onEdit(goal.id)
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Edit ${goal.name} goal`}
    >
      {goal.icon && <Icon>{goal.icon}</Icon>}
      <Name>{goal.name}</Name>
      <TargetAmount>{formatCurrency(goal.targetAmount)}</TargetAmount>

      <BadgeRow>
        <UrgencyBadge $bg={urgency.bg} $color={urgency.color} $border={urgency.border}>
          {getRelativeDateLabel(goal.targetDate)}
        </UrgencyBadge>
        <DueDate>{formatDate(goal.targetDate)}</DueDate>
      </BadgeRow>

      <ProgressBarOuter>
        <ProgressBarInner $progress={progress} $gradient={progressGradient} />
      </ProgressBarOuter>

      <SavedInfo>
        <SavedAmount>{formatCurrency(goal.balance)} saved</SavedAmount>
        <ProgressPercent $color={progressColor}>
          {Math.round(progress)}%
        </ProgressPercent>
      </SavedInfo>
    </Container>
  )
}
