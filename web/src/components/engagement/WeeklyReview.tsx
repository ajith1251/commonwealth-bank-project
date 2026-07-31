import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCalendarCheck,
  faEye,
  faPencil,
  faCoins,
  faFlagCheckered,
  faFileLines,
} from '@fortawesome/free-solid-svg-icons'
import { useAppSelector } from '../../store/hooks'
import { selectMode } from '../../store/themeSlice'
import type { ThemeMode } from '../../store/themeSlice'
import { colors, spacing, typography, radii } from '../../theme'
import { fetchWeeklyReview, type WeeklyReview as WeeklyReviewData, type WeekMetrics } from '../../api/engagement'

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing[0.5]};
`

const Metric = styled.div<{ $mode: ThemeMode }>`
  display: flex;
  align-items: center;
  gap: ${spacing[0.75]};
  padding: ${spacing[0.5]} ${spacing[0.75]};
  background: ${(p) => (p.$mode === 'dark' ? '#0f172a' : colors.gray[50])};
  border-radius: ${radii.md};
`

const MetricIcon = styled.span<{ $color: string }>`
  color: ${(p) => p.$color};
  font-size: ${typography.sizes.sm};
  width: 18px;
  display: flex;
  justify-content: center;
`

const MetricLabel = styled.span<{ $mode: ThemeMode }>`
  font-size: ${typography.sizes.xs};
  color: ${(p) => (p.$mode === 'dark' ? '#94a3b8' : colors.gray[500])};
`

const MetricValue = styled.span<{ $mode: ThemeMode }>`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: ${typography.sizes.xs};
  font-weight: ${typography.weights.semibold};
  color: ${(p) => (p.$mode === 'dark' ? '#e2e8f0' : colors.gray[700])};
`

const Compare = styled.span<{ $up: boolean }>`
  font-size: 0.6rem;
  font-weight: ${typography.weights.medium};
  color: ${(p) => (p.$up ? colors.success[500] : colors.error[500])};
`

const Note = styled.p<{ $mode: ThemeMode }>`
  margin: ${spacing[0.25]} 0 0;
  font-size: 0.65rem;
  color: ${(p) => (p.$mode === 'dark' ? '#475569' : colors.gray[400])};
`

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

type Row = {
  label: string
  key: keyof WeekMetrics
  value: string
  icon: typeof faEye
  color: string
}

/** Compact weekly review — real metrics with a previous-week comparison. */
export default function WeeklyReview() {
  const themeMode = useAppSelector(selectMode)
  const [data, setData] = useState<WeeklyReviewData | null>(null)

  useEffect(() => {
    let mounted = true
    fetchWeeklyReview()
      .then((d) => mounted && setData(d))
      .catch(() => undefined)
    return () => {
      mounted = false
    }
  }, [])

  if (!data) return null

  const c = data.current
  const rows: Row[] = [
    { label: 'Active days', key: 'activeDays', value: String(c.activeDays), icon: faCalendarCheck, color: colors.primary[500] },
    { label: 'Goals reviewed', key: 'goalsReviewed', value: String(c.goalsReviewed), icon: faEye, color: colors.info[500] },
    { label: 'Goals updated', key: 'goalsUpdated', value: String(c.goalsUpdated), icon: faPencil, color: colors.warning[500] },
    { label: 'Progress added', key: 'progressAdded', value: formatMoney(c.progressAdded), icon: faCoins, color: colors.success[500] },
    { label: 'Milestones reached', key: 'milestonesReached', value: String(c.milestonesReached), icon: faFlagCheckered, color: colors.warning[500] },
    { label: 'Reports generated', key: 'reportsGenerated', value: String(c.reportsGenerated), icon: faFileLines, color: colors.primary[400] },
  ]

  const showComparison = data.hasComparison && !!data.previous
  const isMoney = (key: keyof WeekMetrics) => key === 'progressAdded'

  return (
    <Wrap>
      {rows.map((r) => {
        const prev = data.previous ? (data.previous[r.key] as number) : null
        const delta = showComparison && prev !== null ? (c[r.key] as number) - prev : null
        const deltaLabel =
          delta === null ? null : isMoney(r.key) ? formatMoney(Math.abs(delta)) : String(Math.abs(delta))
        return (
          <Metric key={r.key} $mode={themeMode}>
            <MetricIcon $color={r.color}>
              <FontAwesomeIcon icon={r.icon} />
            </MetricIcon>
            <MetricLabel $mode={themeMode}>{r.label}</MetricLabel>
            <MetricValue $mode={themeMode}>
              {r.value}
              {delta !== null && delta !== 0 && deltaLabel && (
                <Compare $up={delta > 0}>
                  {delta > 0 ? '▲' : '▼'} {deltaLabel}
                </Compare>
              )}
            </MetricValue>
          </Metric>
        )
      })}
      <Note $mode={themeMode}>
        {showComparison ? 'Compared with the previous week.' : 'No previous-week data yet.'}
      </Note>
    </Wrap>
  )
}
