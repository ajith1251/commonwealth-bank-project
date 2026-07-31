import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFire } from '@fortawesome/free-solid-svg-icons'
import { useAppSelector } from '../../store/hooks'
import { selectMode } from '../../store/themeSlice'
import type { ThemeMode } from '../../store/themeSlice'
import { colors, spacing, typography, radii, transitions } from '../../theme'
import { fetchEngagementSummary, type EngagementSummary } from '../../api/engagement'

const Card = styled.div<{ $mode: ThemeMode }>`
  margin: 0;
  padding: ${spacing[0.75]};
  background: ${(p) => (p.$mode === 'dark' ? '#1e293b' : '#f8fafc')};
  border: 1px solid ${(p) => (p.$mode === 'dark' ? '#334155' : colors.gray[200])};
  border-radius: ${radii.lg};
`

const StreakRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
`

const FireIcon = styled.span<{ $hot: boolean }>`
  color: ${(p) => (p.$hot ? colors.warning[500] : colors.gray[300])};
  font-size: ${typography.sizes.sm};
  display: flex;
`

const StreakValue = styled.span<{ $mode: ThemeMode }>`
  font-size: ${typography.sizes.base};
  font-weight: ${typography.weights.bold};
  color: ${(p) => (p.$mode === 'dark' ? '#f1f5f9' : colors.gray[800])};
`

const StreakUnit = styled.span<{ $mode: ThemeMode }>`
  font-size: ${typography.sizes.xs};
  color: ${(p) => (p.$mode === 'dark' ? '#64748b' : colors.gray[400])};
`

const Best = styled.span<{ $mode: ThemeMode }>`
  margin-left: auto;
  font-size: ${typography.sizes.xs};
  color: ${(p) => (p.$mode === 'dark' ? '#94a3b8' : colors.gray[500])};

  strong {
    color: ${(p) => (p.$mode === 'dark' ? '#e2e8f0' : colors.gray[700])};
  }
`

const WeekRow = styled.div`
  display: flex;
  gap: 3px;
  margin-top: 6px;
`

const DayCell = styled.span<{ $active: boolean; $mode: ThemeMode }>`
  flex: 1;
  text-align: center;
  font-size: 0.6rem;
  padding: 3px 0;
  border-radius: ${radii.sm};
  color: ${(p) => (p.$active ? (p.$mode === 'dark' ? '#0f172a' : colors.white) : p.$mode === 'dark' ? '#475569' : colors.gray[300])};
  background: ${(p) =>
    p.$active
      ? (p.$mode === 'dark' ? '#fbbf24' : colors.warning[500])
      : p.$mode === 'dark'
        ? '#1e293b'
        : colors.gray[100]};
  transition: background ${transitions.fast};
`

const Footer = styled.div<{ $mode: ThemeMode }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 0.6rem;
  color: ${(p) => (p.$mode === 'dark' ? '#64748b' : colors.gray[400])};
`

const TodayDot = styled.span<{ $active: boolean; $mode: ThemeMode }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${(p) => (p.$active ? colors.success[500] : p.$mode === 'dark' ? '#475569' : colors.gray[300])};
  }
`

/** Compact sidebar card: current streak, best, week activity, consistency. */
export default function ConsistencyCard() {
  const themeMode = useAppSelector(selectMode)
  const [summary, setSummary] = useState<EngagementSummary | null>(null)

  useEffect(() => {
    let mounted = true
    fetchEngagementSummary()
      .then((s) => mounted && setSummary(s))
      .catch(() => undefined)
    return () => {
      mounted = false
    }
  }, [])

  if (!summary) return null

  return (
    <Card $mode={themeMode} aria-label="Consistency summary">
      <StreakRow>
        <FireIcon $hot={summary.currentStreak > 0}>
          <FontAwesomeIcon icon={faFire} />
        </FireIcon>
        <StreakValue $mode={themeMode}>{summary.currentStreak}</StreakValue>
        <StreakUnit $mode={themeMode}>
          day{summary.currentStreak === 1 ? '' : 's'} streak
        </StreakUnit>
        <Best $mode={themeMode}>
          Best: <strong>{summary.longestStreak}</strong>
        </Best>
      </StreakRow>

      <WeekRow aria-label="This week's activity">
        {summary.weekDays.map((d, i) => (
          <DayCell
            key={i}
            $active={d.active}
            $mode={themeMode}
            title={`${d.label} — ${d.active ? 'active' : 'inactive'}`}
          >
            {d.label}
          </DayCell>
        ))}
      </WeekRow>

      <Footer $mode={themeMode}>
        <span>
          {summary.activeDaysThisWeek} / 7 active days · {summary.weeklyConsistency}%
        </span>
        <TodayDot $active={summary.activeToday} $mode={themeMode}>
          {summary.activeToday ? 'Active today' : 'Not active yet'}
        </TodayDot>
      </Footer>
    </Card>
  )
}
