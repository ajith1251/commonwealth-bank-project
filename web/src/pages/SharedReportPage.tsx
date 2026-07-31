import { useEffect, useState, useCallback } from 'react'
import styled from 'styled-components'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faDownload,
  faLinkSlash,
  faShieldHalved,
  faHourglassEnd,
} from '@fortawesome/free-solid-svg-icons'
import { colors, spacing, typography, radii, transitions } from '../theme'
import ReportDocument from '../components/report/ReportDocument'
import type { ReportSnapshot } from '../api/reports'
import { fetchSharedReport, downloadSharedPdf } from '../api/reports'

const Page = styled.div`
  min-height: 100vh;
  background: #f1f5f9;
  display: flex;
  flex-direction: column;
`

const TopBar = styled.header`
  background: ${colors.white};
  border-bottom: 1px solid ${colors.gray[200]};
  padding: ${spacing[0.75]} ${spacing[1.25]};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${spacing[0.75]};
`

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing[0.5]};
`

const Logo = styled.span`
  width: 28px;
  height: 28px;
  border-radius: ${radii.md};
  background: ${colors.primary[600]};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${colors.white};
  font-size: ${typography.sizes.sm};
`

const BrandName = styled.span`
  font-size: ${typography.sizes.sm};
  font-weight: ${typography.weights.bold};
  color: ${colors.gray[800]};
`

const SharedTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${colors.info[600]};
  background: ${colors.info[50]};
  border: 1px solid ${colors.info[100]};
  padding: 4px 10px;
  border-radius: ${radii.full};
`

const Main = styled.main`
  flex: 1;
  width: 100%;
  max-width: 860px;
  margin: 0 auto;
  padding: ${spacing[1.5]};
`

const DownloadBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: ${spacing[1]};
`

const DownloadBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: ${spacing[0.5]} ${spacing[1]};
  background: ${colors.primary[600]};
  color: ${colors.white};
  border: none;
  border-radius: ${radii.md};
  font-size: ${typography.sizes.sm};
  font-weight: ${typography.weights.semibold};
  cursor: pointer;
  transition: background ${transitions.fast}, transform ${transitions.fast};

  &:hover {
    background: ${colors.primary[700]};
  }

  &:active {
    transform: scale(0.97);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

// ── States ────────────────────────────────────────────────────────────

const State = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: ${spacing[3]} ${spacing[1.5]};
  color: ${colors.gray[500]};
`

const StateEmoji = styled.div`
  font-size: 3rem;
  margin-bottom: ${spacing[1]};
`

const StateTitle = styled.h1`
  margin: 0 0 ${spacing[0.5]};
  font-size: ${typography.sizes.xl};
  font-weight: ${typography.weights.semibold};
  color: ${colors.gray[700]};
`

const StateText = styled.p`
  margin: 0;
  font-size: ${typography.sizes.sm};
  color: ${colors.gray[400]};
  max-width: 380px;
  line-height: 1.6;
`

const Footer = styled.footer`
  text-align: center;
  padding: ${spacing[1]};
  font-size: ${typography.sizes.xs};
  color: ${colors.gray[400]};
`

// ── Component ─────────────────────────────────────────────────────────

type Props = {
  token: string
}

type ReportStatus = 'loading' | 'ready' | 'expired' | 'invalid'

export default function SharedReportPage({ token }: Props) {
  const [report, setReport] = useState<ReportSnapshot | null>(null)
  const [status, setStatus] = useState<ReportStatus>('loading')
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState(false)

  const load = useCallback(() => {
    setStatus('loading')
    fetchSharedReport(token)
      .then((res) => {
        setReport(res.report)
        setStatus('ready')
      })
      .catch((err) => {
        // Backend maps not-found → 404, everything else (expired/revoked) → 410.
        const code = (err as { response?: { status?: number } }).response?.status
        setStatus(code === 410 ? 'expired' : 'invalid')
      })
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  const handleDownload = async () => {
    setDownloading(true)
    setDownloadError(false)
    try {
      const { blob, filename } = await downloadSharedPdf(token)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // A download hiccup is not an invalid link — keep the report visible.
      setDownloadError(true)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Page>
      <TopBar>
        <Brand>
          <Logo>🎯</Logo>
          <BrandName>CommBank Goal Tracker</BrandName>
        </Brand>
        <SharedTag>
          <FontAwesomeIcon icon={faShieldHalved} /> Shared Report
        </SharedTag>
      </TopBar>

      {status === 'loading' && (
        <State>
          <StateEmoji>⏳</StateEmoji>
          <StateTitle>Loading report…</StateTitle>
        </State>
      )}

      {status === 'expired' && (
        <State>
          <StateEmoji>
            <FontAwesomeIcon icon={faHourglassEnd} />
          </StateEmoji>
          <StateTitle>This share link is no longer active.</StateTitle>
          <StateText>
            The link has expired or was revoked by its owner. Ask the sender for a fresh link.
          </StateText>
        </State>
      )}

      {status === 'invalid' && (
        <State>
          <StateEmoji>🔒</StateEmoji>
          <StateTitle>This report link is not valid.</StateTitle>
          <StateText>
            The link is incorrect or the report no longer exists. Check the address or ask for a
            fresh link.
          </StateText>
        </State>
      )}

      {status === 'ready' && report && (
        <>
          <Main>
            <DownloadBar>
              {downloadError && (
                <span
                  style={{
                    marginRight: 'auto',
                    fontSize: typography.sizes.xs,
                    color: colors.error[600],
                  }}
                  role="alert"
                >
                  Could not generate the PDF right now. Please try again.
                </span>
              )}
              <DownloadBtn onClick={handleDownload} disabled={downloading} aria-busy={downloading}>
                <FontAwesomeIcon icon={faDownload} />
                {downloading ? 'Generating PDF…' : 'Download PDF'}
              </DownloadBtn>
            </DownloadBar>
            <ReportDocument report={report} />
          </Main>
          <Footer>
            <FontAwesomeIcon icon={faLinkSlash} size="xs" /> Read-only view · No sign-in required ·{' '}
            {new Date(report.generatedAt).toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </Footer>
        </>
      )}
    </Page>
  )
}
