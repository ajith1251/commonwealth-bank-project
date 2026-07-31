import { useEffect, useState, useMemo } from 'react'
import styled from 'styled-components'
import type { ThemeMode } from '../../store/themeSlice'
import { colors, spacing, typography, radii, transitions } from '../../theme'
import { fetchEngagementCalendar, type CalendarDay } from '../../api/engagement'

const Wrap = styled.div`
  width: 100%;
`

const Ranges = styled.div<{ $mode: ThemeMode }>`
  display: inline-flex;
  gap: 2px;
  margin-bottom: ${spacing[0.75]};
  padding: 2px;
  background: ${(p) => (p.$mode === 'dark' ? '#0f172a' : colors.gray[50])};
  border-radius: ${radii.md};
`

const RangeBtn = styled.button<{ $mode: ThemeMode; $active: boolean }>`
  padding: 3px 10px;
  border: none;
  border-radius: ${radii.sm};
  font-size: ${typography.sizes.xs};
  font-weight: ${typography.weights.medium};
  cursor: pointer;
  background: ${(p) => (p.$active ? colors.primary[600] : 'transparent')};
  color: ${(p) => (p.$active ? colors.white : p.$mode === 'dark' ? '#94a3b8' : colors.gray[500])};
  transition: all ${transitions.fast};

  &:focus-visible {
    outline: 2px solid ${colors.primary[500]};
    outline-offset: 1px;
  }
`

const Grid = styled.div<{ $cols: number }>`
  display: grid;
  grid-template-columns: repeat(${(p) => p.$cols}, 1fr);
  gap: 3px;
`

const Cell = styled.div<{ $level: number; $mode: ThemeMode; $today: boolean }>`
  aspect-ratio: 1;
  border-radius: 3px;
  background: ${(p) =>
    p.$level === 0
      ? p.$mode === 'dark'
        ? '#1e293b'
        : colors.gray[100]
      : p.$level === 1
        ? '#dbeafe'
        : p.$level === 2
          ? '#93c5fd'
          : p.$level === 3
            ? '#3b82f6'
            : colors.primary[600]};
  transition: transform ${transitions.fast}, opacity ${transitions.fast};
  outline: ${(p) => (p.$today ? `2px solid ${colors.gray[500]}` : 'none')};
  outline-offset: 1px;

  &:hover {
    transform: scale(1.15);
    opacity: 0.85;
  }
`

const Legend = styled.div<{ $mode: ThemeMode }>`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  margin-top: ${spacing[0.5]};
  font-size: 0.6rem;
  color: ${(p) => (p.$mode === 'dark' ? '#64748b' : colors.gray[400])};
`

const LegendSwatch = styled.span<{ $level: number; $mode: ThemeMode }>`
  width: 10px;
  height: 10px;
  border-radius: 2px;
  background: ${(p) =>
    p.$level === 0
      ? p.$mode === 'dark'
        ? '#1e293b'
        : colors.gray[100]
      : p.$level === 1
        ? '#dbeafe'
        : p.$level === 2
          ? '#93c5fd'
          : p.$level <= 4
            ? '#3b82f6'
            : colors.primary[600]};
`

function levelFor(count: number): number {
  if (count === 0) return 0
  if (count === 1) return 1
  if (count === 2) return 2
  if (count <= 4) return 3
  return 4
}

function formatTooltip(day: CalendarDay): string {
  const d = new Date(day.date + 'T00:00:00')
  const label = isNaN(d.getTime())
    ? day.date
    : d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
  return `${label} — ${day.count} activit${day.count === 1 ? 'y' : 'ies'}`
}

function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

type Props = {
  /** Optional controlled days (from a report snapshot). */
  days?: CalendarDay[]
  loading?: boolean
  /** Theme mode — pass explicitly when rendered outside the Redux provider. */
  mode?: ThemeMode
}

/** GitHub-style activity heatmap with accessible per-day tooltips. */
export default function ActivityHeatmap({ days, loading, mode }: Props) {
  const themeMode: ThemeMode = mode ?? 'light'
  const [range, setRange] = useState(90)
  const [fetched, setFetched] = useState<CalendarDay[] | null>(null)
  const today = todayKey()

  useEffect(() => {
    if (days) return
    let mounted = true
    fetchEngagementCalendar(range)
      .then((data) => mounted && setFetched(data.days))
      .catch(() => undefined)
    return () => {
      mounted = false
    }
  }, [range, days])

  const activeDays = days ?? fetched
  const cols = useMemo(() => {
    if (!activeDays) return 15
    if (activeDays.length <= 30) return 10
    if (activeDays.length <= 90) return 18
    return 26
  }, [activeDays])

  if (loading) {
    return <Wrap aria-busy="true">Loading activity…</Wrap>
  }

  if (!activeDays || activeDays.length === 0) {
    return <Wrap>No activity recorded yet.</Wrap>
  }

  return (
    <Wrap>
      {!days && (
        <Ranges $mode={themeMode} role="group" aria-label="Heatmap range">
          {[30, 90, 365].map((r) => (
            <RangeBtn
              key={r}
              $mode={themeMode}
              $active={range === r}
              onClick={() => setRange(r)}
            >
              {r === 365 ? '1Y' : `${r}D`}
            </RangeBtn>
          ))}
        </Ranges>
      )}

      <div
        style={{ fontSize: 0, marginBottom: 4 }}
        role="img"
        aria-label={`Activity heatmap for the last ${activeDays.length} days`}
      />
      <Grid $cols={cols}>
        {activeDays.map((d) => (
          <Cell
            key={d.date}
            $level={levelFor(d.count)}
            $mode={themeMode}
            $today={d.date === today}
            aria-label={`${formatTooltip(d)}${d.date === today ? ' (today)' : ''}`}
            title={`${formatTooltip(d)}${d.date === today ? ' (today)' : ''}`}
          />
        ))}
      </Grid>

      <Legend $mode={themeMode}>
        Less
        <LegendSwatch $level={0} $mode={themeMode} />
        <LegendSwatch $level={1} $mode={themeMode} />
        <LegendSwatch $level={2} $mode={themeMode} />
        <LegendSwatch $level={3} $mode={themeMode} />
        <LegendSwatch $level={4} $mode={themeMode} />
        More
      </Legend>
    </Wrap>
  )
}
