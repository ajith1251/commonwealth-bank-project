import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCalendarDay,
  faCircleCheck,
  faCircleExclamation,
  faRocket,
  faClock,
  faLightbulb,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons'
import { useAppSelector } from '../../store/hooks'
import { selectMode } from '../../store/themeSlice'
import { selectGoalsMap } from '../../store/goalSlice'
import type { ThemeMode } from '../../store/themeSlice'
import { colors, spacing, typography, radii, transitions } from '../../theme'
import { fetchNextBestActions, type NextBestAction } from '../../api/engagement'

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: ${spacing[0.5]};
`

const Item = styled.li<{ $mode: ThemeMode }>`
  display: flex;
  align-items: center;
  gap: ${spacing[0.75]};
  padding: ${spacing[0.5]} ${spacing[0.75]};
  background: ${(p) => (p.$mode === 'dark' ? '#0f172a' : colors.gray[50])};
  border: 1px solid ${(p) => (p.$mode === 'dark' ? '#1e293b' : colors.gray[100])};
  border-radius: ${radii.md};
  transition: border-color ${transitions.fast}, transform ${transitions.fast};
  min-width: 0;

  &:hover {
    border-color: ${colors.primary[200]};
  }
`

const Icon = styled.span<{ $color: string }>`
  color: ${(p) => p.$color};
  font-size: ${typography.sizes.sm};
  margin-top: 1px;
  flex-shrink: 0;
`

const Body = styled.div`
  flex: 1;
  min-width: 0;
`

const Title = styled.div<{ $mode: ThemeMode }>`
  font-size: ${typography.sizes.xs};
  font-weight: ${typography.weights.semibold};
  color: ${(p) => (p.$mode === 'dark' ? '#e2e8f0' : colors.gray[700])};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const Reason = styled.div<{ $mode: ThemeMode }>`
  font-size: 0.65rem;
  color: ${(p) => (p.$mode === 'dark' ? '#64748b' : colors.gray[400])};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const ReviewBtn = styled.button<{ $mode: ThemeMode }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 1px solid ${(p) => (p.$mode === 'dark' ? '#334155' : colors.gray[200])};
  border-radius: ${radii.md};
  background: transparent;
  color: ${(p) => (p.$mode === 'dark' ? '#94a3b8' : colors.gray[500])};
  font-size: 0.65rem;
  font-weight: ${typography.weights.semibold};
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all ${transitions.fast};

  &:hover {
    border-color: ${colors.primary[300]};
    color: ${colors.primary[600]};
    background: ${(p) => (p.$mode === 'dark' ? 'rgba(59,130,246,0.15)' : colors.primary[50])};
  }
`

const Empty = styled.p<{ $mode: ThemeMode }>`
  margin: 0;
  font-size: ${typography.sizes.xs};
  color: ${(p) => (p.$mode === 'dark' ? '#64748b' : colors.gray[400])};
`

function iconFor(type: NextBestAction['type']) {
  switch (type) {
    case 'deadline':
      return { icon: faCalendarDay, color: colors.warning[500] }
    case 'near_completion':
      return { icon: faRocket, color: colors.success[500] }
    case 'not_reviewed':
      return { icon: faClock, color: colors.gray[400] }
    case 'completed':
      return { icon: faCircleCheck, color: colors.success[500] }
    case 'attention':
      return { icon: faCircleExclamation, color: colors.error[500] }
    default:
      return { icon: faLightbulb, color: colors.primary[500] }
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

type Props = {
  /** Opens the goal detail drawer for a suggestion (WHAT → ACTION). */
  onViewGoal?: (goalId: string) => void
}

/**
 * Deterministic rule-based suggestions (no AI, no financial advice).
 * Each item communicates WHAT (goal), WHY (reason) and ACTION (Review Goal).
 */
export default function NextBestActions({ onViewGoal }: Props) {
  const themeMode = useAppSelector(selectMode)
  const goalsMap = useAppSelector(selectGoalsMap)
  const [actions, setActions] = useState<NextBestAction[] | null>(null)

  useEffect(() => {
    let mounted = true
    fetchNextBestActions()
      .then((a) => mounted && setActions(a))
      .catch(() => mounted && setActions([]))
    return () => {
      mounted = false
    }
  }, [])

  if (actions === null) return null

  if (actions.length === 0) {
    return <Empty $mode={themeMode}>No suggestions right now — your goals are in good shape.</Empty>
  }

  return (
    <List>
      {actions.map((a) => {
        const viz = iconFor(a.type)
        const name = goalsMap[a.goalId]?.name
        // WHY — strip the goal name prefix the backend always prepends.
        const reason = name && a.message.startsWith(name)
          ? capitalize(a.message.slice(name.length).trim())
          : a.message
        return (
          <Item key={a.id} $mode={themeMode}>
            <Icon $color={viz.color}>
              <FontAwesomeIcon icon={viz.icon} />
            </Icon>
            <Body>
              <Title $mode={themeMode}>{name ?? a.message}</Title>
              <Reason $mode={themeMode}>{name ? reason : ''}</Reason>
            </Body>
            {onViewGoal && (
              <ReviewBtn $mode={themeMode} onClick={() => onViewGoal(a.goalId)} aria-label={`Review ${name ?? 'goal'}`}>
                Review <FontAwesomeIcon icon={faChevronRight} size="xs" />
              </ReviewBtn>
            )}
          </Item>
        )
      })}
    </List>
  )
}
