import styled from 'styled-components'
import {
  faCircleCheck,
  faCheck,
  faExclamationTriangle,
  faClock,
} from '@fortawesome/free-solid-svg-icons'
import { colors, typography, radii } from '../../theme'
import type { ThemeMode } from '../../store/themeSlice'
import type { GoalHealthResult } from '../../api/analytics'
import ChartSkeleton from './ChartSkeleton'

const Container = styled.div<{ $mode: ThemeMode }>`
  background: ${(p) => (p.$mode === 'dark' ? '#1e293b' : colors.white)};
  border: 1px solid ${(p) => (p.$mode === 'dark' ? '#334155' : colors.gray[200])};
  border-radius: 12px;
  padding: 20px;
`

const Title = styled.h3<{ $mode: ThemeMode }>`
  margin: 0 0 16px;
  font-size: ${typography.sizes.base};
  font-weight: ${typography.weights.semibold};
  color: ${(p) => (p.$mode === 'dark' ? colors.dark.text : colors.gray[800])};
`

const HealthGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`

const HealthCard = styled.div<{ $bg: string; $border: string }>`
  background: ${(p) => p.$bg};
  border: 1px solid ${(p) => p.$border};
  border-radius: ${radii.md};
  padding: 12px;
  text-align: center;
`

const HealthCount = styled.div<{ $color: string }>`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${(p) => p.$color};
  line-height: 1;
  margin-bottom: 4px;
`

const HealthLabel = styled.div<{ $color: string }>`
  font-size: 0.7rem;
  font-weight: 600;
  color: ${(p) => p.$color};
  text-transform: uppercase;
  letter-spacing: 0.04em;
`

const EmptyState = styled.div<{ $mode: ThemeMode }>`
  text-align: center;
  padding: 24px;
  color: ${(p) => (p.$mode === 'dark' ? colors.dark.textMuted : colors.gray[400])};
  font-size: ${typography.sizes.sm};
`

type Props = {
  data: GoalHealthResult | null
  loading?: boolean
  mode: ThemeMode
}

export default function GoalHealthChart({ data, loading, mode }: Props) {
  if (loading) {
    return <ChartSkeleton mode={mode} chartType="grid" />
  }

  if (!data) {
    return (
      <Container $mode={mode}>
        <Title $mode={mode}>Goal Health</Title>
        <EmptyState $mode={mode}>
          No health data available.
        </EmptyState>
      </Container>
    )
  }

  const healthItems = [
    {
      count: data.completed.length,
      label: 'Completed',
      color: colors.success[600],
      bg: colors.success[50],
      border: colors.success[100],
      icon: faCircleCheck,
    },
    {
      count: data.onTrack.length,
      label: 'On Track',
      color: colors.info[500],
      bg: colors.info[50],
      border: colors.info[100],
      icon: faCheck,
    },
    {
      count: data.attention.length,
      label: 'Attention',
      color: colors.warning[500],
      bg: colors.warning[50],
      border: colors.warning[100],
      icon: faExclamationTriangle,
    },
    {
      count: data.overdue.length,
      label: 'Overdue',
      color: colors.error[500],
      bg: colors.error[50],
      border: colors.error[100],
      icon: faClock,
    },
  ]

  return (
    <Container $mode={mode}>
      <Title $mode={mode}>Goal Health</Title>
      <HealthGrid>
        {healthItems.map((item) => (
          <HealthCard key={item.label} $bg={item.bg} $border={item.border}>
            <HealthCount $color={item.color}>{item.count}</HealthCount>
            <HealthLabel $color={item.color}>{item.label}</HealthLabel>
          </HealthCard>
        ))}
      </HealthGrid>
    </Container>
  )
}
