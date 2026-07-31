import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import styled from 'styled-components'
import { colors, typography, getProgressColor } from '../../theme'
import type { ThemeMode } from '../../store/themeSlice'
import type { GoalPerformanceEntry } from '../../api/analytics'
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

function formatPercent(value: number): string {
  return `${Math.round(value)}%`
}

function CustomTooltip({ active, payload, label }: any) {
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
        {item.icon} {label}
      </div>
      <div style={{ color: '#94a3b8' }}>
        {item.balance.toLocaleString()} of {item.targetAmount.toLocaleString()}
      </div>
      <div style={{ color: '#3b82f6', fontWeight: 600 }}>
        {formatPercent(item.progressPercent)}
      </div>
    </div>
  )
}

type Props = {
  data: GoalPerformanceEntry[]
  loading?: boolean
  mode: ThemeMode
}

export default function GoalPerformanceChart({ data, loading, mode }: Props) {
  const chartData = useMemo(
    () =>
      [...data]
        .sort((a, b) => b.progressPercent - a.progressPercent)
        .slice(0, 10)
        .map((d) => ({
          ...d,
          name: `${d.icon || '🎯'} ${d.name}`,
        })),
    [data],
  )

  const textColor = mode === 'dark' ? '#94a3b8' : '#64748b'

  if (loading) {
    return <ChartSkeleton mode={mode} chartType="bar" />
  }

  if (chartData.length === 0) {
    return (
      <Container $mode={mode}>
        <Title $mode={mode}>Goal Performance</Title>
        <EmptyState $mode={mode}>No goals to display.</EmptyState>
      </Container>
    )
  }

  return (
    <Container $mode={mode}>
      <Title $mode={mode}>Goal Performance</Title>
      <ResponsiveContainer width="100%" height={chartData.length * 40 + 40}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 40, left: 120, bottom: 4 }}
          barCategoryGap={8}
        >
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: textColor }}
            tickFormatter={(v: number) => `${v}%`}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11, fill: textColor }}
            axisLine={false}
            tickLine={false}
            width={110}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="progressPercent" radius={[0, 4, 4, 0]} animationDuration={800}>
            {chartData.map((entry, idx) => (
              <Cell key={idx} fill={getProgressColor(entry.progressPercent)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Container>
  )
}
