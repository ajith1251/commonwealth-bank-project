import styled from 'styled-components'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faFileLines,
  faDownload,
  faEye,
  faShareNodes,
  faLink,
  faHistory,
} from '@fortawesome/free-solid-svg-icons'
import { colors, spacing, typography, radii, transitions } from '../../theme'
import type { ReportMeta } from '../../api/reports'

const Card = styled.section`
  background: ${colors.white};
  border: 1px solid ${colors.gray[200]};
  border-radius: ${radii.lg};
  padding: ${spacing[1.25]};
`

const CardTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: ${spacing[0.5]};
  margin: 0 0 ${spacing[1]};
  font-size: ${typography.sizes.base};
  font-weight: ${typography.weights.semibold};
  color: ${colors.gray[800]};

  svg {
    color: ${colors.primary[600]};
  }
`

const Empty = styled.div`
  text-align: center;
  padding: ${spacing[2]} ${spacing[1]};
  color: ${colors.gray[400]};
  font-size: ${typography.sizes.sm};
`

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: ${spacing[0.5]};
`

const Row = styled.li`
  display: flex;
  align-items: center;
  gap: ${spacing[0.75]};
  padding: ${spacing[0.75]};
  border: 1px solid ${colors.gray[100]};
  border-radius: ${radii.md};
  transition: border-color ${transitions.fast}, background ${transitions.fast};
  flex-wrap: wrap;

  &:hover {
    border-color: ${colors.primary[200]};
    background: ${colors.gray[50]};
  }
`

const RowIcon = styled.span`
  color: ${colors.primary[500]};
  font-size: ${typography.sizes.lg};
  flex-shrink: 0;
`

const RowBody = styled.div`
  flex: 1;
  min-width: 180px;
`

const RowTitle = styled.div`
  font-size: ${typography.sizes.sm};
  font-weight: ${typography.weights.semibold};
  color: ${colors.gray[800]};
`

const RowMeta = styled.div`
  font-size: ${typography.sizes.xs};
  color: ${colors.gray[400]};
  margin-top: 2px;
`

const SharedBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.6rem;
  font-weight: 600;
  color: ${colors.info[600]};
  background: ${colors.info[50]};
  padding: 2px 8px;
  border-radius: ${radii.full};
  margin-left: 6px;
`

const Actions = styled.div`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
`

const ActionBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  font-size: ${typography.sizes.xs};
  font-weight: 600;
  color: ${colors.gray[600]};
  background: ${colors.white};
  border: 1px solid ${colors.gray[200]};
  border-radius: ${radii.md};
  cursor: pointer;
  transition: all ${transitions.fast};
  white-space: nowrap;

  &:hover {
    border-color: ${colors.primary[300]};
    color: ${colors.primary[600]};
    background: ${colors.primary[50]};
  }
`

function formatDate(iso: string): string {
  const d = new Date(iso)
  return isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatExpiry(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '' : `Expires ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}

type Props = {
  reports: ReportMeta[]
  loading: boolean
  onView: (id: string) => void
  onDownload: (id: string) => void
  onShare: (report: ReportMeta) => void
}

export default function ReportHistory({ reports, loading, onView, onDownload, onShare }: Props) {
  return (
    <Card>
      <CardTitle>
        <FontAwesomeIcon icon={faHistory} /> Report History
      </CardTitle>

      {loading && reports.length === 0 && (
        <Empty>Loading reports…</Empty>
      )}

      {!loading && reports.length === 0 && (
        <Empty>
          No reports generated yet. Build a report above and save it to see it here.
        </Empty>
      )}

      {reports.length > 0 && (
        <List>
          {reports.map((r) => {
            const shared = r.activeShares > 0
            return (
              <Row key={r.id}>
                <RowIcon>
                  <FontAwesomeIcon icon={faFileLines} />
                </RowIcon>
                <RowBody>
                  <RowTitle>
                    {r.title}
                    {shared && (
                      <SharedBadge>
                        <FontAwesomeIcon icon={faLink} size="xs" /> Shared
                        {r.earliestExpiry && ` · ${formatExpiry(r.earliestExpiry)}`}
                      </SharedBadge>
                    )}
                  </RowTitle>
                  <RowMeta>
                    {formatDate(r.generatedAt)} · {r.configuration.period.toUpperCase()} period ·{' '}
                    {r.activeShares} active {r.activeShares === 1 ? 'link' : 'links'}
                  </RowMeta>
                </RowBody>
                <Actions>
                  <ActionBtn onClick={() => onView(r.id)} aria-label={`View ${r.title}`}>
                    <FontAwesomeIcon icon={faEye} /> View
                  </ActionBtn>
                  <ActionBtn onClick={() => onDownload(r.id)} aria-label={`Download ${r.title} as PDF`}>
                    <FontAwesomeIcon icon={faDownload} /> PDF
                  </ActionBtn>
                  <ActionBtn onClick={() => onShare(r)} aria-label={`Share ${r.title}`}>
                    <FontAwesomeIcon icon={faShareNodes} /> Share
                  </ActionBtn>
                </Actions>
              </Row>
            )
          })}
        </List>
      )}
    </Card>
  )
}
