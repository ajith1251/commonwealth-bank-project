import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import styled from 'styled-components'
import { colors, typography } from '../../theme'
import type { ThemeMode } from '../../store/themeSlice'
import type { ProgressEntry } from '../../api/analytics'
import ChartSkeleton from './ChartSkeleton'

const Container = styled.div<{ $mode: ThemeMode }>`
  background: ${(p) => (p.$mode === 'dark' ? '#1e293b' : colors.white)};
  border: 1px solid ${(p) => (p.$mode === 'dark' ? '#334155' : colors.gray[200])};
  border-radius: 12px;
  padding: 20px;
`

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`

const Title = styled.h3<{ $mode: ThemeMode }>`
  margin: 0;
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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
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
      <div style={{ color: '#94a3b8', marginBottom: 4 }}>{label}</div>
      <div style={{ color: '#3b82f6', fontWeight: 600 }}>
        {formatCurrency(payload[0].value)}
      </div>
    </div>
  )
}

type Props = {
  data: ProgressEntry[]
  loading?: boolean
  error?: string | null
  mode: ThemeMode
}

export default function SavingsTrendChart({ data, loading, error, mode }: Props) {
  const chartData = useMemo(() => {
    // Aggregate by date
    const dateMap = new Map<string, number>()
    for (const entry of data) {
      const date = entry.date.split('T')[0]
      dateMap.set(date, entry.amount)
    }
    return Array.from(dateMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [data])

  const textColor = mode === 'dark' ? '#94a3b8' : '#64748b'
  const gridColor = mode === 'dark' ? '#334155' : colors.gray[100]

  if (loading) {
    return <ChartSkeleton mode={mode} chartType="area" />
  }

  if (error) {
    return (
      <Container $mode={mode}>
        <Title $mode={mode}>Savings Growth</Title>
        <EmptyState $mode={mode}>Failed to load: {error}</EmptyState>
      </Container>
    )
  }

  if (chartData.length === 0) {
    return (
      <Container $mode={mode}>
        <Title $mode={mode}>Savings Growth</Title>
        <EmptyState $mode={mode}>
          No savings history yet. Start adding to your goals to see trends here.
        </EmptyState>
      </Container>
    )
  }

  return (
    <Container $mode={mode}>
      <Header>
        <Title $mode={mode}>Savings Growth</Title>
      </Header>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <defs>
            <linearGradient id={`savings-gradient-${mode}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors.primary[500]} stopOpacity={0.2} />
              <stop offset="95%" stopColor={colors.primary[500]} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: textColor }}
            axisLine={{ stroke: gridColor }}
            tickLine={false}
            tickFormatter={(val: string) => {
              const d = new Date(val)
              return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: textColor }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(val: number) => formatCurrency(val)}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="amount"
            stroke={colors.primary[500]}
            strokeWidth={2}
            fill={`url(#savings-gradient-${mode})`}
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Container>
  )
}
