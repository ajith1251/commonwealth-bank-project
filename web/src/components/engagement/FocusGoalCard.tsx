import { useEffect, useState, useCallback } from 'react'
import styled from 'styled-components'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBullseye, faChevronRight } from '@fortawesome/free-solid-svg-icons'
import { useAppSelector } from '../../store/hooks'
import { selectMode } from '../../store/themeSlice'
import { selectGoalIds, selectGoalsMap } from '../../store/goalSlice'
import type { ThemeMode } from '../../store/themeSlice'
import { colors, spacing, typography, radii, transitions } from '../../theme'
import { fetchFocusGoal, setFocusGoal } from '../../api/engagement'
import { formatCurrency, formatDeadlinePhrase, daysUntil } from '../../format'
import type { Goal } from '../../types'

const Card = styled.section<{ $mode: ThemeMode }>`
  background: linear-gradient(135deg, ${colors.primary[600]}, ${colors.primary[800]});
  border-radius: ${radii.lg};
  color: ${colors.white};
  padding: ${spacing[1.25]};
  overflow: hidden;
`

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  opacity: 0.85;
  margin-bottom: ${spacing[0.75]};
`

const GoalRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing[0.75]};
`

const Icon = styled.span`
  font-size: 1.6rem;
  line-height: 1;
`

const GoalName = styled.h3`
  margin: 0;
  font-size: ${typography.sizes.base};
  font-weight: ${typography.weights.bold};
`

const ProgressRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: ${spacing[0.75]};
`

const Bar = styled.div`
  flex: 1;
  height: 6px;
  border-radius: ${radii.full};
  background: rgba(255, 255, 255, 0.25);
  overflow: hidden;
`

const BarInner = styled.div<{ $progress: number }>`
  height: 100%;
  width: ${(p) => Math.min(p.$progress, 100)}%;
  background: ${colors.white};
  border-radius: ${radii.full};
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
`

const Pct = styled.span`
  font-size: ${typography.sizes.sm};
  font-weight: ${typography.weights.bold};
`

const Meta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${spacing[0.5]} ${spacing[1]};
  margin-top: ${spacing[0.75]};
  font-size: 0.7rem;
  opacity: 0.9;
`

const Deadline = styled.div<{ $urgent: boolean }>`
  margin-top: ${spacing[0.5]};
  font-size: 0.68rem;
  font-weight: ${typography.weights.medium};
  color: ${(p) => (p.$urgent ? '#fef08a' : 'rgba(255,255,255,0.95)')};
`

const Actions = styled.div`
  display: flex;
  gap: ${spacing[0.5]};
  margin-top: ${spacing[1]};
`

const ActionBtn = styled.button<{ $primary?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: ${radii.md};
  font-size: ${typography.sizes.xs};
  font-weight: ${typography.weights.semibold};
  cursor: pointer;
  transition: all ${transitions.fast};
  border: none;
  background: ${(p) => (p.$primary ? colors.white : 'rgba(255,255,255,0.15)')};
  color: ${(p) => (p.$primary ? colors.primary[700] : colors.white)};

  &:hover {
    background: ${(p) => (p.$primary ? colors.gray[100] : 'rgba(255,255,255,0.25)')};
  }
`

const Select = styled.select<{ $mode: ThemeMode }>`
  flex: 1;
  min-width: 0;
  max-width: 100%;
  padding: 6px 10px;
  border: none;
  border-radius: ${radii.md};
  font-size: ${typography.sizes.xs};
  background: rgba(255, 255, 255, 0.92);
  color: ${colors.gray[800]};
  cursor: pointer;

  &:focus {
    outline: 2px solid rgba(255, 255, 255, 0.6);
  }
`

type Props = {
  onViewGoal: (id: string) => void
  onToast?: (message: string, type: 'success' | 'error') => void
}

/** Focus goal — displayed prominently on Overview; persists selection. */
export default function FocusGoalCard({ onViewGoal, onToast }: Props) {
  const themeMode = useAppSelector(selectMode)
  const goalIds = useAppSelector(selectGoalIds)
  const goalsMap = useAppSelector(selectGoalsMap)

  const [focus, setFocus] = useState<Goal | null>(null)
  const [changing, setChanging] = useState(false)

  const load = useCallback(() => {
    fetchFocusGoal()
      .then(setFocus)
      .catch(() => undefined)
  }, [])

  useEffect(load, [load])

  const eligible = goalIds
    .map((id) => goalsMap[id])
    .filter((g): g is Goal => !!g && !(g.targetAmount > 0 && g.balance >= g.targetAmount))

  const handleChange = async (goalId: string) => {
    if (!goalId) return
    setChanging(true)
    try {
      const goal = await setFocusGoal(goalId)
      setFocus(goal)
      onToast?.('Focus goal updated', 'success')
    } catch {
      onToast?.('Failed to update focus goal', 'error')
    } finally {
      setChanging(false)
    }
  }

  const handlePick = (goalId: string) => {
    if (goalId) {
      setChanging(false) // close the picker immediately on a successful pick
      handleChange(goalId)
    }
  }

  const progress = focus && focus.targetAmount > 0 ? Math.min((focus.balance / focus.targetAmount) * 100, 100) : 0
  const isComplete = !!focus && focus.targetAmount > 0 && focus.balance >= focus.targetAmount
  const daysLeft = focus && !isComplete ? daysUntil(focus.targetDate) : null

  return (
    <Card $mode={themeMode}>
      <Header>
        <FontAwesomeIcon icon={faBullseye} /> Focus Goal
      </Header>

      {focus ? (
        <>
          <GoalRow>
            <Icon>{focus.icon || '🎯'}</Icon>
            <GoalName>{focus.name}</GoalName>
          </GoalRow>
          <ProgressRow>
            <Bar>
              <BarInner $progress={progress} />
            </Bar>
            <Pct>{Math.round(progress)}%</Pct>
          </ProgressRow>
          <Meta>
            <span>{formatCurrency(focus.balance)} saved</span>
            <span>of {formatCurrency(focus.targetAmount)}</span>
            <span>
              {Math.max(focus.targetAmount - focus.balance, 0) > 0
                ? `${formatCurrency(Math.max(focus.targetAmount - focus.balance, 0))} to go`
                : 'Target reached'}
            </span>
          </Meta>
          {daysLeft !== null && (
            <Deadline $urgent={daysLeft <= 14}>{formatDeadlinePhrase(focus.targetDate)}</Deadline>
          )}
          <Actions>
            <ActionBtn $primary onClick={() => onViewGoal(focus.id)}>
              View Goal <FontAwesomeIcon icon={faChevronRight} size="xs" />
            </ActionBtn>
            <ActionBtn onClick={() => setChanging(true)} aria-label="Change focus goal">
              Change
            </ActionBtn>
            {changing && (
              <Select
                $mode={themeMode}
                value=""
                autoFocus
                onChange={(e) => handlePick(e.target.value)}
                onBlur={() => setChanging(false)}
                aria-label="Choose a new focus goal"
              >
                <option value="" disabled>
                  Choose a goal…
                </option>
                {eligible
                  .filter((g) => g.id !== focus.id)
                  .map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.icon || '🎯'} {g.name}
                    </option>
                  ))}
              </Select>
            )}
          </Actions>
        </>
      ) : (
        <>
          <GoalRow>
            <Icon>🎯</Icon>
            <GoalName>No focus goal set</GoalName>
          </GoalRow>
          <p style={{ margin: '6px 0 10px', fontSize: '0.75rem', opacity: 0.85 }}>
            Pick one goal to keep front and centre on your dashboard.
          </p>
          <Select
            $mode={themeMode}
            value=""
            onChange={(e) => handleChange(e.target.value)}
            aria-label="Set focus goal"
          >
            <option value="" disabled>
              Set a focus goal…
            </option>
            {eligible.map((g) => (
              <option key={g.id} value={g.id}>
                {g.icon || '🎯'} {g.name}
              </option>
            ))}
          </Select>
        </>
      )}
    </Card>
  )
}
