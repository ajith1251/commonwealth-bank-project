import styled from 'styled-components'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faFileLines,
  faBullseye,
  faWallet,
  faChartLine,
  faFlagCheckered,
  faFire,
} from '@fortawesome/free-solid-svg-icons'
import type { ReportSnapshot } from '../../api/reports'
import ActivityHeatmap from '../engagement/ActivityHeatmap'
import { colors, spacing, typography, radii } from '../../theme'
import SavingsTrendChart from '../charts/SavingsTrendChart'
import GoalPerformanceChart from '../charts/GoalPerformanceChart'
import PortfolioDistributionChart from '../charts/PortfolioDistributionChart'
import GoalHealthChart from '../charts/GoalHealthChart'

// ── Report design system (light, print-friendly) ──────────────────────

const Document = styled.article`
  background: ${colors.white};
  border: 1px solid ${colors.gray[200]};
  border-radius: ${radii.lg};
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
  overflow: hidden;
`

const BrandBar = styled.div`
  height: 4px;
  background: linear-gradient(90deg, ${colors.primary[600]}, ${colors.primary[400]});
`

const Header = styled.header`
  padding: ${spacing[1.5]} ${spacing[1.5]};
  border-bottom: 1px solid ${colors.gray[100]};
`

const BrandLabel = styled.div`
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${colors.gray[400]};
  margin-bottom: ${spacing[0.25]};
`

const Title = styled.h2`
  margin: 0 0 2px;
  font-size: ${typography.sizes['2xl']};
  font-weight: ${typography.weights.bold};
  color: ${colors.gray[900]};
  line-height: 1.2;
`

const Subtitle = styled.p`
  margin: 0;
  font-size: ${typography.sizes.sm};
  font-weight: 500;
  letter-spacing: 0.04em;
  color: ${colors.gray[500]};
`

const MetaStrip = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${spacing[0.75]} ${spacing[1.5]};
  margin-top: ${spacing[1]};
  padding-top: ${spacing[0.75]};
  border-top: 1px solid ${colors.gray[100]};
`

const MetaItem = styled.div`
  font-size: ${typography.sizes.xs};
  color: ${colors.gray[500]};

  strong {
    display: block;
    font-weight: ${typography.weights.semibold};
    color: ${colors.gray[700]};
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-size: 0.6rem;
    margin-bottom: 1px;
  }
`

const Body = styled.div`
  padding: ${spacing[1.5]};
  display: flex;
  flex-direction: column;
  gap: ${spacing[1.5]};
`

// ── Sections ──────────────────────────────────────────────────────────

const Section = styled.section`
  & + & {
    padding-top: ${spacing[1.25]};
    border-top: 1px solid ${colors.gray[100]};
  }
`

const SectionTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: ${spacing[0.5]};
  margin: 0 0 ${spacing[0.75]};
  font-size: ${typography.sizes.base};
  font-weight: ${typography.weights.semibold};
  color: ${colors.gray[800]};

  svg {
    color: ${colors.primary[600]};
    font-size: ${typography.sizes.sm};
  }
`

const SectionCaption = styled.p`
  margin: -${spacing[0.5]} 0 ${spacing[0.75]};
  font-size: ${typography.sizes.xs};
  color: ${colors.gray[400]};
`

// ── Executive summary KPIs ────────────────────────────────────────────

const KPIGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${spacing[0.5]};

  @media (min-width: 640px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (min-width: 900px) {
    grid-template-columns: repeat(5, 1fr);
  }
`

const KPICard = styled.div`
  background: ${colors.gray[50]};
  border: 1px solid ${colors.gray[100]};
  border-radius: ${radii.md};
  padding: ${spacing[0.75]};
`

const KPIHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: ${spacing[0.25]};
`

const KPIIcon = styled.span<{ $color: string }>`
  color: ${(p) => p.$color};
  font-size: ${typography.sizes.xs};
  display: flex;
`

const KPILabel = styled.span`
  font-size: 0.6rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${colors.gray[400]};
`

const KPIValue = styled.div`
  font-size: ${typography.sizes.lg};
  font-weight: ${typography.weights.bold};
  color: ${colors.gray[800]};
`

// ── Tables ────────────────────────────────────────────────────────────

const TableWrap = styled.div`
  overflow-x: auto;
  border: 1px solid ${colors.gray[100]};
  border-radius: ${radii.md};
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: ${typography.sizes.xs};
  min-width: 520px;
`

const Th = styled.th`
  text-align: left;
  padding: ${spacing[0.5]} ${spacing[0.75]};
  background: ${colors.gray[50]};
  color: ${colors.gray[500]};
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.6rem;
  letter-spacing: 0.04em;
  border-bottom: 1px solid ${colors.gray[100]};
  white-space: nowrap;
`

const Td = styled.td`
  padding: ${spacing[0.5]} ${spacing[0.75]};
  color: ${colors.gray[700]};
  border-bottom: 1px solid ${colors.gray[50]};
  white-space: nowrap;

  &.num {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
`

const StatusPill = styled.span<{ $status: string }>`
  display: inline-block;
  padding: 2px 8px;
  border-radius: ${radii.full};
  font-size: 0.6rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  background: ${(p) =>
    p.$status === 'completed'
      ? colors.success[50]
      : p.$status === 'on_track'
        ? colors.info[50]
        : p.$status === 'attention'
          ? colors.warning[50]
          : colors.error[50]};
  color: ${(p) =>
    p.$status === 'completed'
      ? colors.success[600]
      : p.$status === 'on_track'
        ? colors.info[600]
        : p.$status === 'attention'
          ? colors.warning[600]
          : colors.error[600]};
`

const STATUS_LABEL: Record<string, string> = {
  completed: 'Completed',
  on_track: 'On Track',
  attention: 'Attention',
  overdue: 'Overdue',
}

// ── Engagement section ────────────────────────────────────────────────

const EngagementKPI = styled.div`
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: ${typography.sizes.xs};
  color: ${colors.gray[600]};

  strong {
    font-size: ${typography.sizes.base};
    color: ${colors.gray[800]};
  }
`

const HeatmapCaption = styled.p`
  margin: ${spacing[0.5]} 0 0;
  font-size: 0.65rem;
  color: ${colors.gray[400]};
`

// ── Activity summary ──────────────────────────────────────────────────

const ActivityList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: ${spacing[0.5]};
`

const ActivityItem = styled.li`
  display: flex;
  align-items: baseline;
  gap: ${spacing[0.75]};
  font-size: ${typography.sizes.xs};
  color: ${colors.gray[600]};
`

const ActivityDate = styled.span`
  flex-shrink: 0;
  width: 90px;
  color: ${colors.gray[400]};
`

const ActivityLabel = styled.span`
  font-weight: 600;
  color: ${colors.gray[700]};
`

const ActivityGoal = styled.span`
  color: ${colors.gray[500]};
`

// ── Helpers ───────────────────────────────────────────────────────────

const ACTIVITY_LABELS: Record<string, string> = {
  GOAL_CREATED: 'Goal created',
  GOAL_UPDATED: 'Balance updated',
  GOAL_COMPLETED: 'Goal completed',
  GOAL_DELETED: 'Goal deleted',
  MILESTONE_REACHED: 'Milestone reached',
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Component ─────────────────────────────────────────────────────────

type Props = {
  report: ReportSnapshot
  /** Optional header action slot (e.g. Download PDF button). */
  headerAction?: React.ReactNode
}

export default function ReportDocument({ report, headerAction }: Props) {
  const sections = new Set(report.filters.sections ?? [])
  const s = report.summary

  const summaryItems = [
    { label: 'Total Saved', value: formatMoney(s.totalSaved), icon: faWallet, color: colors.success[600] },
    { label: 'Target Value', value: formatMoney(s.totalTarget), icon: faBullseye, color: colors.primary[600] },
    { label: 'Overall Progress', value: `${Math.round(s.averageProgress)}%`, icon: faChartLine, color: colors.warning[600] },
    { label: 'Active Goals', value: String(s.activeGoals), icon: faBullseye, color: colors.info[600] },
    { label: 'Completed Goals', value: String(s.completedGoals), icon: faFlagCheckered, color: colors.success[600] },
  ]

  return (
    <Document>
      <BrandBar />
      <Header>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing[1] }}>
          <div>
            <BrandLabel>CommBank Goal Tracker</BrandLabel>
            <Title>{report.title}</Title>
            <Subtitle>Financial Goals Analytics Report</Subtitle>
          </div>
          {headerAction}
        </div>
        <MetaStrip>
          <MetaItem>
            <strong>Reporting period</strong>
            {report.period.label}
          </MetaItem>
          <MetaItem>
            <strong>Generated</strong>
            {formatDate(report.generatedAt)}
          </MetaItem>
          <MetaItem>
            <strong>Goals included</strong>
            {report.filters.goalCount}
            {report.filters.goalIds === 'all' ? ' (all)' : ' (selected)'}
          </MetaItem>
        </MetaStrip>
      </Header>

      <Body>
        {sections.has('executiveSummary') && (
          <Section>
            <SectionTitle>
              <FontAwesomeIcon icon={faFileLines} /> Executive Summary
            </SectionTitle>
            <KPIGrid>
              {summaryItems.map((item) => (
                <KPICard key={item.label}>
                  <KPIHeader>
                    <KPIIcon $color={item.color}>
                      <FontAwesomeIcon icon={item.icon} />
                    </KPIIcon>
                    <KPILabel>{item.label}</KPILabel>
                  </KPIHeader>
                  <KPIValue>{item.value}</KPIValue>
                </KPICard>
              ))}
            </KPIGrid>
          </Section>
        )}

        {sections.has('savingsGrowth') && report.savingsTrend && (
          <Section>
            <SectionTitle>
              <FontAwesomeIcon icon={faChartLine} /> Savings Growth
            </SectionTitle>
            <SectionCaption>Total balance across goals over the reporting period.</SectionCaption>
            <SavingsTrendChart data={report.savingsTrend} mode="light" />
          </Section>
        )}

        {sections.has('goalPerformance') && report.goalPerformance && (
          <Section>
            <SectionTitle>
              <FontAwesomeIcon icon={faBullseye} /> Goal Performance
            </SectionTitle>
            <GoalPerformanceChart data={report.goalPerformance} mode="light" />
          </Section>
        )}

        {sections.has('distribution') && report.distribution && (
          <Section>
            <SectionTitle>
              <FontAwesomeIcon icon={faChartLine} /> Portfolio Distribution
            </SectionTitle>
            <SectionCaption>Share of total target value by goal.</SectionCaption>
            <PortfolioDistributionChart data={report.distribution} mode="light" />
          </Section>
        )}

        {sections.has('health') && report.health && (
          <Section>
            <SectionTitle>
              <FontAwesomeIcon icon={faFlagCheckered} /> Goal Health
            </SectionTitle>
            <GoalHealthChart data={report.health} mode="light" />
          </Section>
        )}

        {sections.has('deadlines') && report.deadlines && (
          <Section>
            <SectionTitle>
              <FontAwesomeIcon icon={faFlagCheckered} /> Upcoming Deadlines
            </SectionTitle>
            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <Th>Goal</Th>
                    <Th>Deadline</Th>
                    <Th>Progress</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {report.deadlines.map((d) => (
                    <tr key={d.goalId}>
                      <Td>
                        {d.icon} {d.name}
                      </Td>
                      <Td>{formatDate(d.targetDate)}</Td>
                      <Td className="num">{Math.round(d.progressPercent)}%</Td>
                      <Td>
                        <StatusPill $status={d.status ?? 'on_track'}>
                          {STATUS_LABEL[d.status ?? 'on_track'] ?? 'On Track'}
                        </StatusPill>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          </Section>
        )}

        {sections.has('goalDetails') && report.goalDetails && (
          <Section>
            <SectionTitle>
              <FontAwesomeIcon icon={faBullseye} /> Goal Details
            </SectionTitle>
            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <Th>Goal</Th>
                    <Th>Saved</Th>
                    <Th>Target</Th>
                    <Th>Progress</Th>
                    <Th>Deadline</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {report.goalDetails.map((g) => (
                    <tr key={g.goalId}>
                      <Td>
                        {g.icon} {g.name}
                      </Td>
                      <Td className="num">{formatMoney(g.balance)}</Td>
                      <Td className="num">{formatMoney(g.targetAmount)}</Td>
                      <Td className="num">{g.progressPercent}%</Td>
                      <Td>{formatDate(g.targetDate)}</Td>
                      <Td>
                        <StatusPill $status={g.status}>{STATUS_LABEL[g.status] ?? 'On Track'}</StatusPill>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          </Section>
        )}

        {sections.has('engagement') && report.engagement && (
          <Section>
            <SectionTitle>
              <FontAwesomeIcon icon={faFire} /> Consistency &amp; Engagement
            </SectionTitle>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: spacing[0.5],
                marginBottom: spacing[0.75],
              }}
            >
              <EngagementKPI>
                <strong>{report.engagement.currentStreak}d</strong> current streak
              </EngagementKPI>
              <EngagementKPI>
                <strong>{report.engagement.longestStreak}d</strong> longest
              </EngagementKPI>
              <EngagementKPI>
                <strong>{report.engagement.activeDays}</strong> active days
              </EngagementKPI>
              <EngagementKPI>
                <strong>{report.engagement.weeklyConsistency}%</strong> weekly consistency
              </EngagementKPI>
              <EngagementKPI>
                <strong>{report.engagement.activeDaysThisWeek}/7</strong> this week
              </EngagementKPI>
            </div>
            <ActivityHeatmap days={report.engagement.heatmap} mode="light" />
            <HeatmapCaption>
              {report.engagement.goalsReviewed} goals reviewed ·{' '}
              {report.engagement.goalsUpdated} updated ·{' '}
              {report.engagement.milestonesReached} milestones ·{' '}
              {report.engagement.reportsGenerated} reports this week
            </HeatmapCaption>
          </Section>
        )}

        {sections.has('activities') && report.activities && (
          <Section>
            <SectionTitle>
              <FontAwesomeIcon icon={faChartLine} /> Activity Summary
            </SectionTitle>
            {report.activities.length === 0 ? (
              <SectionCaption>No activity recorded in the selected period.</SectionCaption>
            ) : (
              <ActivityList>
                {report.activities.map((a) => {
                  const goalName =
                    a.metadata && typeof a.metadata.name === 'string' ? a.metadata.name : null
                  return (
                    <ActivityItem key={a.id}>
                      <ActivityDate>{formatDate(a.createdAt)}</ActivityDate>
                      <ActivityLabel>{ACTIVITY_LABELS[a.type] ?? a.type.replace(/_/g, ' ')}</ActivityLabel>
                      {goalName && <ActivityGoal>· {goalName}</ActivityGoal>}
                    </ActivityItem>
                  )
                })}
              </ActivityList>
            )}
          </Section>
        )}
      </Body>
    </Document>
  )
}
