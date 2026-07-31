import { useEffect, useRef, useState, useCallback } from 'react'
import styled, { keyframes } from 'styled-components'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faXmark,
  faLink,
  faCopy,
  faTriangleExclamation,
  faClock,
  faArrowRotateRight,
} from '@fortawesome/free-solid-svg-icons'
import { colors, spacing, typography, shadows, radii, zIndex, transitions } from '../../theme'
import type { ReportMeta, ReportShare } from '../../api/reports'
import {
  createShare,
  fetchShares,
  revokeShare,
  downloadReportPdf,
} from '../../api/reports'

const overlayIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`

const modalIn = keyframes`
  from { opacity: 0; transform: translateY(-12px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  z-index: ${zIndex.modal + 2};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${spacing[1]};
  animation: ${overlayIn} 0.12s ease;
`

const Modal = styled.div`
  width: 100%;
  max-width: 480px;
  max-height: 85vh;
  overflow-y: auto;
  background: ${colors.white};
  border-radius: ${radii.lg};
  box-shadow: ${shadows.xl};
  animation: ${modalIn} 0.14s ease;
  outline: none;
`

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${spacing[1]} ${spacing[1.25]};
  border-bottom: 1px solid ${colors.gray[100]};
`

const HeaderTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: ${spacing[0.5]};
  margin: 0;
  font-size: ${typography.sizes.base};
  font-weight: ${typography.weights.semibold};
  color: ${colors.gray[800]};

  svg {
    color: ${colors.primary[600]};
  }
`

const CloseBtn = styled.button`
  background: none;
  border: none;
  color: ${colors.gray[400]};
  cursor: pointer;
  padding: 6px;
  border-radius: ${radii.md};
  transition: all ${transitions.fast};

  &:hover {
    color: ${colors.gray[600]};
    background: ${colors.gray[50]};
  }
`

const Body = styled.div`
  padding: ${spacing[1.25]};
  display: flex;
  flex-direction: column;
  gap: ${spacing[1]};
`

const PrivacyNote = styled.div`
  display: flex;
  gap: ${spacing[0.5]};
  padding: ${spacing[0.75]};
  background: ${colors.warning[50]};
  border: 1px solid ${colors.warning[100]};
  border-radius: ${radii.md};
  font-size: ${typography.sizes.xs};
  color: ${colors.gray[600]};
  line-height: 1.5;

  svg {
    color: ${colors.warning[500]};
    flex-shrink: 0;
    margin-top: 2px;
  }
`

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const Label = styled.label`
  font-size: ${typography.sizes.xs};
  font-weight: ${typography.weights.medium};
  color: ${colors.gray[500]};
`

const Select = styled.select`
  padding: ${spacing[0.5]} ${spacing[0.75]};
  border: 1px solid ${colors.gray[200]};
  border-radius: ${radii.md};
  font-size: ${typography.sizes.sm};
  color: ${colors.gray[800]};
  background: ${colors.white};
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${colors.primary[500]};
  }
`

const CreateBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
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

const LinkBox = styled.div`
  display: flex;
  gap: ${spacing[0.5]};
  align-items: stretch;
`

const LinkInput = styled.input`
  flex: 1;
  min-width: 0;
  padding: ${spacing[0.5]} ${spacing[0.75]};
  border: 1px solid ${colors.gray[200]};
  border-radius: ${radii.md};
  font-size: ${typography.sizes.xs};
  color: ${colors.gray[700]};
  background: ${colors.gray[50]};
`

const CopyBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0 ${spacing[0.75]};
  background: ${colors.gray[50]};
  border: 1px solid ${colors.gray[200]};
  border-radius: ${radii.md};
  font-size: ${typography.sizes.xs};
  font-weight: 600;
  color: ${colors.gray[600]};
  cursor: pointer;
  white-space: nowrap;
  transition: all ${transitions.fast};

  &:hover {
    border-color: ${colors.primary[300]};
    color: ${colors.primary[600]};
    background: ${colors.primary[50]};
  }
`

const SharesList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: ${spacing[0.5]};
`

const ShareRow = styled.li`
  display: flex;
  align-items: center;
  gap: ${spacing[0.5]};
  padding: ${spacing[0.5]} ${spacing[0.75]};
  border: 1px solid ${colors.gray[100]};
  border-radius: ${radii.md};
  flex-wrap: wrap;
`

const ShareInfo = styled.div`
  flex: 1;
  min-width: 140px;
  font-size: ${typography.sizes.xs};
  color: ${colors.gray[500]};
`

const ShareStatus = styled.span<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.6rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 2px 8px;
  border-radius: ${radii.full};
  background: ${(p) => (p.$active ? colors.success[50] : colors.gray[100])};
  color: ${(p) => (p.$active ? colors.success[600] : colors.gray[400])};
`

const ShareActions = styled.div`
  display: flex;
  gap: 4px;
`

const SmallBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  font-size: 0.65rem;
  font-weight: 600;
  color: ${colors.gray[500]};
  background: ${colors.white};
  border: 1px solid ${colors.gray[200]};
  border-radius: ${radii.md};
  cursor: pointer;
  transition: all ${transitions.fast};

  &:hover {
    color: ${colors.error[500]};
    border-color: ${colors.error[200]};
  }
`

const EmptyShares = styled.div`
  font-size: ${typography.sizes.xs};
  color: ${colors.gray[400]};
  text-align: center;
  padding: ${spacing[0.75]};
`

function formatExpiry(iso: string | null): string {
  if (!iso) return 'Never expires'
  const d = new Date(iso)
  return isNaN(d.getTime()) ? 'Never expires' : `Expires ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
}

type Props = {
  report: ReportMeta
  onClose: () => void
  onToast: (message: string, type: 'success' | 'error') => void
  onChanged: () => void
}

export default function ShareDialog({ report, onClose, onToast, onChanged }: Props) {
  const [expiresInDays, setExpiresInDays] = useState<number | null>(7)
  const [creating, setCreating] = useState(false)
  const [shares, setShares] = useState<ReportShare[]>([])
  const [link, setLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  // Load existing shares
  const loadShares = useCallback(() => {
    fetchShares(report.id)
      .then(setShares)
      .catch(() => setShares([]))
  }, [report.id])

  useEffect(() => {
    loadShares()
  }, [loadShares])

  // Focus trap + Escape
  useEffect(() => {
    modalRef.current?.focus()
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab' && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button, input, select, [href], [tabindex]:not([tabindex="-1"])',
        )
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const handleCreate = async () => {
    setCreating(true)
    try {
      const result = await createShare(report.id, expiresInDays)
      setLink(result.link)
      setCopied(false)
      onToast('Share link created', 'success')
      loadShares()
      onChanged()
    } catch {
      onToast('Failed to create share link', 'error')
    } finally {
      setCreating(false)
    }
  }

  const handleCopy = async () => {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      onToast('Share link copied', 'success')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      onToast('Could not copy link — copy it manually', 'error')
    }
  }

  const handleRevoke = async (shareId: string) => {
    try {
      await revokeShare(report.id, shareId)
      onToast('Share link revoked', 'success')
      loadShares()
      onChanged()
    } catch {
      onToast('Failed to revoke share link', 'error')
    }
  }

  const handleDownload = async () => {
    try {
      const { blob, filename } = await downloadReportPdf(report.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      onToast('Report ready', 'success')
    } catch {
      onToast('Failed to download PDF', 'error')
    }
  }

  return (
    <Overlay onClick={onClose} role="dialog" aria-modal="true" aria-label={`Share ${report.title}`}>
      <Modal
        ref={modalRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <Header>
          <HeaderTitle>
            <FontAwesomeIcon icon={faLink} /> Share Report
          </HeaderTitle>
          <CloseBtn onClick={onClose} aria-label="Close share dialog">
            <FontAwesomeIcon icon={faXmark} />
          </CloseBtn>
        </Header>

        <Body>
          <PrivacyNote>
            <FontAwesomeIcon icon={faTriangleExclamation} />
            <span>
              This link provides read-only access to the selected report. Anyone with the link may
              be able to view it until it expires or is revoked. This is a portfolio/demo
              application, not a Commonwealth Bank financial statement.
            </span>
          </PrivacyNote>

          <Field>
            <Label htmlFor="share-expiration">Expiration</Label>
            <Select
              id="share-expiration"
              value={expiresInDays === null ? 'none' : String(expiresInDays)}
              onChange={(e) =>
                setExpiresInDays(e.target.value === 'none' ? null : Number(e.target.value))
              }
            >
              <option value="1">24 hours</option>
              <option value="7">7 days</option>
              <option value="30">30 days</option>
              <option value="none">No expiration</option>
            </Select>
          </Field>

          <CreateBtn onClick={handleCreate} disabled={creating} aria-busy={creating}>
            <FontAwesomeIcon icon={faLink} />
            {creating ? 'Creating…' : 'Create Share Link'}
          </CreateBtn>

          {link && (
            <Field>
              <Label htmlFor="share-link">Share link</Label>
              <LinkBox>
                <LinkInput id="share-link" readOnly value={link} onFocus={(e) => e.target.select()} />
                <CopyBtn onClick={handleCopy} aria-live="polite">
                  <FontAwesomeIcon icon={faCopy} /> {copied ? 'Copied' : 'Copy'}
                </CopyBtn>
              </LinkBox>
            </Field>
          )}

          <Field>
            <Label>Existing links</Label>
            {shares.length === 0 ? (
              <EmptyShares>No share links yet.</EmptyShares>
            ) : (
              <SharesList>
                {shares.map((s) => (
                  <ShareRow key={s.id}>
                    <ShareInfo>
                      <div>
                        <ShareStatus $active={s.active}>
                          {s.active ? 'Active' : s.revokedAt ? 'Revoked' : 'Expired'}
                        </ShareStatus>
                      </div>
                      <div style={{ marginTop: 2 }}>
                        {formatExpiry(s.expiresAt)} · {s.viewCount} {s.viewCount === 1 ? 'view' : 'views'}
                      </div>
                    </ShareInfo>
                    {s.active && (
                      <ShareActions>
                        <SmallBtn onClick={() => handleRevoke(s.id)}>
                          <FontAwesomeIcon icon={faXmark} size="xs" /> Revoke
                        </SmallBtn>
                      </ShareActions>
                    )}
                  </ShareRow>
                ))}
              </SharesList>
            )}
          </Field>

          <div style={{ display: 'flex', gap: spacing[0.5], flexWrap: 'wrap' }}>
            <SmallBtn
              onClick={handleDownload}
              style={{ color: colors.primary[600], borderColor: colors.primary[200] }}
            >
              <FontAwesomeIcon icon={faArrowRotateRight} /> Download PDF
            </SmallBtn>
            <span style={{ fontSize: typography.sizes.xs, color: colors.gray[400], alignSelf: 'center' }}>
              <FontAwesomeIcon icon={faClock} size="xs" /> Links are only shown once at creation.
            </span>
          </div>
        </Body>
      </Modal>
    </Overlay>
  )
}
