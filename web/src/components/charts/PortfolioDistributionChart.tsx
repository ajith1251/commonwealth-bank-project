import { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import styled from 'styled-components'
import { colors, typography } from '../../theme'
import type { ThemeMode } from '../../store/themeSlice'
import type { PortfolioDistributionEntry } from '../../api/analytics'
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

const EmptyState = styled.div<{ $mode: ThemeMode }>`
  text-align: center;
  padding: 32px;
  color: ${(p) => (p.$mode === 'dark' ? colors.dark.textMuted : colors.gray[400])};
  font-size: ${typography.sizes.sm};
`

const LegendGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 12px;
`

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: ${colors.gray[500]};
`

const LegendDot = styled.span<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${(p) => p.$color};
  flex-shrink: 0;
`

const LegendName = styled.span`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const LegendPct = styled.span`
  font-weight: 600;
  color: ${colors.gray[700]};
  margin-left: auto;
`

const CHART_COLORS = [
  colors.primary[500],
  colors.success[500],
  colors.warning[500],
  colors.error[400],
  colors.info[400],
  colors.primary[300],
  colors.success[400],
  colors.warning[400],
]

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const item = payload[0].payload
  return (
    <div
      style={{
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: '0.8rem',
      }}
    >
      <div style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 4 }}>
        {item.icon} {item.name}
      </div>
      <div style={{ color: '#94a3b8' }}>
        Target: {formatCurrency(item.targetAmount)}
      </div>
      <div style={{ color: '#3b82f6', fontWeight: 600 }}>
        {item.percentage}% of portfolio
      </div>
    </div>
  )
}

type Props = {
  data: PortfolioDistributionEntry[]
  loading?: boolean
  mode: ThemeMode
}

export default function PortfolioDistributionChart({ data, loading, mode }: Props) {
  const chartData = useMemo(
    () =>
      data.map((d, i) => ({
        ...d,
        color: CHART_COLORS[i % CHART_COLORS.length],
      })),
    [data],
  )

  if (loading) {
    return <ChartSkeleton mode={mode} chartType="pie" />
  }

  if (chartData.length === 0) {
    return (
      <Container $mode={mode}>
        <Title $mode={mode}>Portfolio Distribution</Title>
        <EmptyState $mode={mode}>
          No goals to display distribution.
        </EmptyState>
      </Container>
    )
  }

  return (
    <Container $mode={mode}>
      <Title $mode={mode}>Portfolio Distribution</Title>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={85}
            dataKey="targetAmount"
            nameKey="name"
            animationDuration={800}
          >
            {chartData.map((entry) => (
              <Cell key={entry.goalId} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <LegendGrid>          {chartData.map((entry) => (
            <LegendItem key={entry.goalId}>
            <LegendDot $color={entry.color} />
            <LegendName>
              {entry.icon} {entry.name}
            </LegendName>
            <LegendPct>{entry.percentage}%</LegendPct>
          </LegendItem>
        ))}
      </LegendGrid>
    </Container>
  )
}
