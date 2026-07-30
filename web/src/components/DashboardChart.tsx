import styled from 'styled-components'
import { colors, spacing, typography, radii } from '../theme'
import type { ThemeMode } from '../store/themeSlice'

const ChartContainer = styled.div<{ $mode: ThemeMode }>`
  background: ${(p) => (p.$mode === 'dark' ? colors.dark.surface : colors.white)};
  border: 1px solid ${(p) => (p.$mode === 'dark' ? colors.dark.border : colors.gray[200])};
  border-radius: ${radii.xl};
  padding: ${spacing[1.25]} ${spacing[1.5]};
  display: flex;
  align-items: center;
  gap: ${spacing[1.25]};
`

const SVGWrapper = styled.div`
  flex-shrink: 0;
  position: relative;
  width: 100px;
  height: 100px;
`

const CenterText = styled.div<{ $mode: ThemeMode }>`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`

const CenterPercent = styled.span<{ $mode: ThemeMode }>`
  font-size: ${typography.sizes.xl};
  font-weight: ${typography.weights.bold};
  color: ${(p) => (p.$mode === 'dark' ? colors.dark.text : colors.gray[800])};
  line-height: 1;
`

const CenterLabel = styled.span<{ $mode: ThemeMode }>`
  font-size: 0.6rem;
  color: ${(p) => (p.$mode === 'dark' ? colors.dark.textMuted : colors.gray[400])};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: ${typography.weights.medium};
`

const ChartInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${spacing[0.5]};
  min-width: 0;
`

const ChartTitle = styled.h3<{ $mode: ThemeMode }>`
  margin: 0;
  font-size: ${typography.sizes.base};
  font-weight: ${typography.weights.semibold};
  color: ${(p) => (p.$mode === 'dark' ? colors.dark.text : colors.gray[800])};
`

const ChartStats = styled.div<{ $mode: ThemeMode }>`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${spacing[0.25]} ${spacing[1]};
`

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
`

const StatValue = styled.span<{ $mode: ThemeMode }>`
  font-size: ${typography.sizes.sm};
  font-weight: ${typography.weights.semibold};
  color: ${(p) => (p.$mode === 'dark' ? colors.dark.text : colors.gray[700])};
`

const StatLabel = styled.span<{ $mode: ThemeMode }>`
  font-size: 0.65rem;
  color: ${(p) => (p.$mode === 'dark' ? colors.dark.textMuted : colors.gray[400])};
`

const LegendRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing[0.75]};
  margin-top: ${spacing[0.25]};
  flex-wrap: wrap;
`

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.65rem;
  color: ${colors.gray[400]};
`

const LegendDot = styled.span<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${(p) => p.$color};
`

type Props = {
  totalSaved: number
  totalTarget: number
  goalCount: number
  completedCount: number
  mode: ThemeMode
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function DashboardChart({ totalSaved, totalTarget, goalCount, completedCount, mode }: Props) {
  const overallProgress = totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0
  const circumference = 2 * Math.PI * 38
  const offset = circumference - (overallProgress / 100) * circumference
  const color = overallProgress >= 100 ? colors.success[500] : overallProgress >= 50 ? colors.primary[500] : colors.primary[400]

  return (
    <ChartContainer $mode={mode}>
      <SVGWrapper>
        <svg width="100" height="100" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="none"
            stroke={mode === 'dark' ? colors.dark.surfaceAlt : colors.gray[100]}
            strokeWidth="8"
          />
          {/* Progress arc */}
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 50 50)"
            style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />
        </svg>
        <CenterText $mode={mode}>
          <CenterPercent $mode={mode}>{Math.round(overallProgress)}%</CenterPercent>
          <CenterLabel $mode={mode}>overall</CenterLabel>
        </CenterText>
      </SVGWrapper>

      <ChartInfo>
        <ChartTitle $mode={mode}>Overall Progress</ChartTitle>
        <ChartStats $mode={mode}>
          <StatItem>
            <StatValue $mode={mode}>{formatCurrency(totalSaved)}</StatValue>
            <StatLabel $mode={mode}>Saved</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue $mode={mode}>{formatCurrency(totalTarget)}</StatValue>
            <StatLabel $mode={mode}>Target</StatLabel>
          </StatItem>
        </ChartStats>
        <LegendRow>
          <LegendItem>
            <LegendDot $color={colors.primary[400]} />
            {goalCount} {goalCount === 1 ? 'goal' : 'goals'}
          </LegendItem>
          {completedCount > 0 && (
            <LegendItem>
              <LegendDot $color={colors.success[500]} />
              {completedCount} completed
            </LegendItem>
          )}
        </LegendRow>
      </ChartInfo>
    </ChartContainer>
  )
}
