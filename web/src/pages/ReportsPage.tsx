import { useEffect, useState, useCallback, useMemo } from 'react'
import styled, { keyframes } from 'styled-components'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload, faShareNodes, faCircleCheck } from '@fortawesome/free-solid-svg-icons'
import { useAppSelector } from '../store/hooks'
import { selectGoalIds, selectGoalsMap } from '../store/goalSlice'
import { selectMode } from '../store/themeSlice'
import type { ThemeMode } from '../store/themeSlice'
import { colors, spacing, typography, radii, transitions } from '../theme'
import ReportBuilder from '../components/report/ReportBuilder'
import ReportDocument from '../components/report/ReportDocument'
import ReportHistory from '../components/report/ReportHistory'
import ShareDialog from '../components/report/ShareDialog'
import type { ReportConfig, ReportMeta, ReportSnapshot } from '../api/reports'
import {
  previewReport,
  generateReport,
  fetchReports,
  fetchReport,
  downloadReportPdf,
} from '../api/reports'

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`

const Page = styled.div`
  padding: ${spacing[1.5]} ${spacing[1.5]} ${spacing[3]};
  max-width: 1100px;
  margin: 0 auto;
  animation: ${fadeIn} 0.3s ease;

  @media (min-width: 768px) {
    padding: ${spacing[2]} ${spacing[2]} ${spacing[4]};
  }
`

const Intro = styled.p<{ $mode: ThemeMode }>`
  margin: 0 0 ${spacing[1.25]};
  font-size: ${typography.sizes.sm};
  color: ${(p) => (p.$mode === 'dark' ? '#64748b' : colors.gray[400])};
  max-width: 640px;
  line-height: 1.6;
`

const Layout = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${spacing[1.25]};

  @media (min-width: 1024px) {
    grid-template-columns: 360px 1fr;
    align-items: start;
  }
`

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing[1.25]};

  @media (min-width: 1024px) {
    position: sticky;
    top: 76px;
  }
`

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing[1.25]};
  min-width: 0;
`

// ── Preview toolbar ───────────────────────────────────────────────────

const PreviewToolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${spacing[0.75]};
  flex-wrap: wrap;
`

const GeneratedBanner = styled.div<{ $mode: ThemeMode }>`
  display: flex;
  align-items: center;
  gap: ${spacing[0.75]};
  flex-wrap: wrap;
  padding: ${spacing[0.75]} ${spacing[1]};
  border-radius: ${radii.md};
  background: ${(p) => (p.$mode === 'dark' ? 'rgba(34,197,94,0.12)' : colors.success[50])};
  border: 1px solid ${(p) => (p.$mode === 'dark' ? '#15803d' : colors.success[200])};
  font-size: ${typography.sizes.sm};
  color: ${(p) => (p.$mode === 'dark' ? '#86efac' : colors.success[700])};

  strong {
    font-weight: ${typography.weights.semibold};
  }

  > span {
    flex: 1;
    min-width: 0;
  }
`

const PreviewInfo = styled.span`
  font-size: ${typography.sizes.xs};
  color: ${colors.gray[400]};

  strong {
    color: ${colors.gray[600]};
  }
`

const ToolbarActions = styled.div`
  display: flex;
  gap: ${spacing[0.5]};
  flex-wrap: wrap;
`

const ToolbarBtn = styled.button<{ $primary?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: ${spacing[0.5]} ${spacing[1]};
  border-radius: ${radii.md};
  font-size: ${typography.sizes.sm};
  font-weight: ${typography.weights.semibold};
  cursor: pointer;
  transition: all ${transitions.fast};
  border: none;
  background: ${(p) => (p.$primary ? colors.primary[600] : colors.white)};
  color: ${(p) => (p.$primary ? colors.white : colors.gray[600])};
  border: ${(p) => (p.$primary ? 'none' : `1px solid ${colors.gray[200]}`)};

  &:hover:not(:disabled) {
    background: ${(p) => (p.$primary ? colors.primary[700] : colors.gray[50])};
  }

  &:active:not(:disabled) {
    transform: scale(0.97);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`

const EmptyPreview = styled.div<{ $mode: ThemeMode }>`
  border: 1.5px dashed ${(p) => (p.$mode === 'dark' ? '#334155' : colors.gray[200])};
  border-radius: ${radii.lg};
  padding: ${spacing[3]} ${spacing[1.5]};
  text-align: center;
  color: ${(p) => (p.$mode === 'dark' ? '#64748b' : colors.gray[400])};
  font-size: ${typography.sizes.sm};
`

const Emoji = styled.div`
  font-size: 2.5rem;
  margin-bottom: ${spacing[0.75]};
`

const LoadingPreview = styled.div<{ $mode: ThemeMode }>`
  border: 1px solid ${(p) => (p.$mode === 'dark' ? '#334155' : colors.gray[200])};
  border-radius: ${radii.lg};
  padding: ${spacing[2]};
  text-align: center;
  color: ${(p) => (p.$mode === 'dark' ? '#64748b' : colors.gray[400])};
  font-size: ${typography.sizes.sm};
`

function defaultTitle(): string {
  const d = new Date()
  const month = d.toLocaleDateString('en-US', { month: 'long' })
  return `Financial Goals Report — ${month} ${d.getFullYear()}`
}

type Props = {
  onToast: (message: string, type: 'success' | 'error') => void
}

export default function ReportsPage({ onToast }: Props) {
  const themeMode = useAppSelector(selectMode)
  const goalIds = useAppSelector(selectGoalIds)
  const goalsMap = useAppSelector(selectGoalsMap)

  const goals = useMemo(() => goalIds.map((id) => goalsMap[id]).filter(Boolean), [goalIds, goalsMap])

  const [preview, setPreview] = useState<ReportSnapshot | null>(null)
  const [history, setHistory] = useState<ReportMeta[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [busyLabel, setBusyLabel] = useState('Generating')
  const [downloading, setDownloading] = useState(false)
  const [shareReport, setShareReport] = useState<ReportMeta | null>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)

  const refreshHistory = useCallback(() => {
    setHistoryLoading(true)
    return fetchReports()
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false))
  }, [])

  useEffect(() => {
    refreshHistory()
  }, [refreshHistory])

  const showToast = onToast

  const handleSubmit = async (config: ReportConfig, mode: 'preview' | 'save') => {
    setBusy(true)
    setBusyLabel(mode === 'preview' ? 'Building preview' : 'Generating report')
    try {
      if (mode === 'preview') {
        const snapshot = await previewReport(config)
        setPreview(snapshot)
        setPreviewId(null)
      } else {
        const snapshot = await generateReport(config)
        setPreview(snapshot)
        setPreviewId(snapshot.reportId)
        // Await the refresh so the banner's Share action can always resolve the meta.
        await refreshHistory()
        showToast('Report saved to history', 'success')
      }
    } catch {
      showToast('Failed to build report', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleView = async (id: string) => {
    try {
      const snapshot = await fetchReport(id)
      setPreview(snapshot)
      setPreviewId(id)
    } catch {
      showToast('Failed to load report', 'error')
    }
  }

  const handleDownload = async (id: string) => {
    setDownloading(true)
    try {
      const { blob, filename } = await downloadReportPdf(id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      showToast('Report ready', 'success')
    } catch {
      showToast('Failed to download PDF', 'error')
    } finally {
      setDownloading(false)
    }
  }

  const handleShare = (report: ReportMeta) => setShareReport(report)

  return (
    <Page>
      <Intro $mode={themeMode}>
        Build presentation-quality analytics reports from your goal data, export them as PDF, and
        share read-only links. The preview, PDF and shared page all reflect the same immutable
        snapshot.
      </Intro>

      <Layout>
        <Sidebar>
          <ReportBuilder
            goals={goals}
            defaultTitle={defaultTitle()}
            busy={busy}
            busyLabel={busyLabel}
            onSubmit={handleSubmit}
          />
          <ReportHistory
            reports={history}
            loading={historyLoading}
            onView={handleView}
            onDownload={handleDownload}
            onShare={handleShare}
          />
        </Sidebar>

        <Content>
          <PreviewToolbar>
            <PreviewInfo>
              {preview ? (
                <>
                  <strong>{preview.title}</strong> · {preview.period.label}
                </>
              ) : (
                'Configure a report and press Preview to see it here.'
              )}
            </PreviewInfo>
          </PreviewToolbar>

          {preview && previewId && (
            <GeneratedBanner $mode={themeMode} role="status">
              <FontAwesomeIcon icon={faCircleCheck} />
              <span>
                <strong>Report generated.</strong> It is saved to your history and ready to share.
              </span>
              <ToolbarActions>
                <ToolbarBtn onClick={() => handleDownload(previewId)} disabled={downloading} aria-busy={downloading}>
                  <FontAwesomeIcon icon={faDownload} /> {downloading ? 'Generating PDF…' : 'Download PDF'}
                </ToolbarBtn>
                <ToolbarBtn
                  $primary
                  onClick={() => {
                    const meta = history.find((r) => r.id === previewId)
                    if (meta) handleShare(meta)
                  }}
                >
                  <FontAwesomeIcon icon={faShareNodes} /> Share
                </ToolbarBtn>
              </ToolbarActions>
            </GeneratedBanner>
          )}

          {busy ? (
            <LoadingPreview $mode={themeMode}>Generating report…</LoadingPreview>
          ) : preview ? (
            <ReportDocument
              report={preview}
              headerAction={
                previewId ? (
                  <ToolbarBtn $primary onClick={() => handleDownload(previewId)} disabled={downloading}>
                    <FontAwesomeIcon icon={faDownload} />
                    {downloading ? 'Generating PDF…' : 'Download PDF'}
                  </ToolbarBtn>
                ) : undefined
              }
            />
          ) : (
            <EmptyPreview $mode={themeMode}>
              <Emoji>📄</Emoji>
              <div>
                <strong style={{ color: themeMode === 'dark' ? '#94a3b8' : colors.gray[500] }}>
                  No preview yet
                </strong>
                <div style={{ marginTop: 4 }}>
                  Pick a period, goals and sections on the left, then hit Preview Report.
                </div>
              </div>
            </EmptyPreview>
          )}
        </Content>
      </Layout>

      {shareReport && (
        <ShareDialog
          report={shareReport}
          onClose={() => setShareReport(null)}
          onToast={showToast}
          onChanged={refreshHistory}
        />
      )}
    </Page>
  )
}
