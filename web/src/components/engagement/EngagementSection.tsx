import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFire, faTrophy, faCalendarCheck, faChartLine } from '@fortawesome/free-solid-svg-icons'
import { useAppSelector } from '../../store/hooks'
import { selectMode } from '../../store/themeSlice'
import type { ThemeMode } from '../../store/themeSlice'
import { colors, spacing, typography, radii } from '../../theme'
import { fetchEngagementSummary, type EngagementSummary } from '../../api/engagement'
import ActivityHeatmap from './ActivityHeatmap'
import WeeklyReview from './WeeklyReview'

const Section = styled.section<{ $mode: ThemeMode }>`
  background: ${(p) => (p.$mode === 'dark' ? '#1e293b' : colors.white)};
  border: 1px solid ${(p) => (p.$mode === 'dark' ? '#334155' : colors.gray[200])};
  border-radius: ${radii.lg};
  padding: ${spacing[1.25]};
`

const SectionTitle = styled.h3<{ $mode: ThemeMode }>`
  display: flex;
  align-items: center;
  gap: ${spacing[0.5]};
  margin: 0 0 ${spacing[1]};
  font-size: ${typography.sizes.base};
  font-weight: ${typography.weights.semibold};
  color: ${(p) => (p.$mode === 'dark' ? '#e2e8f0' : colors.gray[800])};

  svg {
    color: ${colors.primary[600]};
    font-size: ${typography.sizes.sm};
  }
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${spacing[1]};

  @media (min-width: 1024px) {
    grid-template-columns: 1fr 1fr;
  }
`

const KPIStrip = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${spacing[0.5]};
  margin-bottom: ${spacing[1]};

  @media (min-width: 640px) {
    grid-template-columns: repeat(5, 1fr);
  }
`

const KPICard = styled.div<{ $mode: ThemeMode }>`
  background: ${(p) => (p.$mode === 'dark' ? '#0f172a' : colors.gray[50])};
  border: 1px solid ${(p) => (p.$mode === 'dark' ? '#334155' : colors.gray[100])};
  border-radius: ${radii.md};
  padding: ${spacing[0.5]} ${spacing[0.75]};
`

const KPIHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 2px;
`

const KPIIcon = styled.span<{ $color: string }>`
  color: ${(p) => p.$color};
  font-size: ${typography.sizes.xs};
  display: flex;
`

const KPILabel = styled.span<{ $mode: ThemeMode }>`
  font-size: 0.6rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${(p) => (p.$mode === 'dark' ? '#64748b' : colors.gray[400])};
`

const KPIValue = styled.div<{ $mode: ThemeMode }>`
  font-size: ${typography.sizes.base};
  font-weight: ${typography.weights.bold};
  color: ${(p) => (p.$mode === 'dark' ? '#f1f5f9' : colors.gray[800])};
`

const PanelTitle = styled.h4<{ $mode: ThemeMode }>`
  margin: 0 0 ${spacing[0.5]};
  font-size: ${typography.sizes.xs};
  font-weight: ${typography.weights.semibold};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${(p) => (p.$mode === 'dark' ? '#94a3b8' : colors.gray[500])};
`

/** Engagement analytics — real check-in metrics, heatmap and weekly review. */
export default function EngagementSection() {
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

  const kpis = [
    { label: 'Current Streak', value: summary ? `${summary.currentStreak}d` : '—', icon: faFire, color: colors.warning[500] },
    { label: 'Longest Streak', value: summary ? `${summary.longestStreak}d` : '—', icon: faTrophy, color: colors.primary[500] },
    { label: 'Active Days', value: summary ? String(summary.totalActiveDays) : '—', icon: faCalendarCheck, color: colors.success[500] },
    { label: 'Weekly Consistency', value: summary ? `${summary.weeklyConsistency}%` : '—', icon: faChartLine, color: colors.info[500] },
    { label: 'This Week', value: summary ? `${summary.activeDaysThisWeek} / 7` : '—', icon: faFire, color: colors.warning[400] },
  ]

  return (
    <Section $mode={themeMode} aria-label="Consistency and engagement analytics">
      <SectionTitle $mode={themeMode}>
        <FontAwesomeIcon icon={faFire} /> Consistency &amp; Engagement
      </SectionTitle>

      <KPIStrip>
        {kpis.map((k) => (
          <KPICard key={k.label} $mode={themeMode}>
            <KPIHeader>
              <KPIIcon $color={k.color}>
                <FontAwesomeIcon icon={k.icon} />
              </KPIIcon>
              <KPILabel $mode={themeMode}>{k.label}</KPILabel>
            </KPIHeader>
            <KPIValue $mode={themeMode}>{k.value}</KPIValue>
          </KPICard>
        ))}
      </KPIStrip>

      <Grid>
        <div>
          <PanelTitle $mode={themeMode}>Activity Heatmap</PanelTitle>
          <ActivityHeatmap mode={themeMode} />
        </div>
        <div>
          <PanelTitle $mode={themeMode}>Weekly Review</PanelTitle>
          <WeeklyReview />
        </div>
      </Grid>
    </Section>
  )
}
