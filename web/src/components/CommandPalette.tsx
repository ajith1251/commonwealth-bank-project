import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import styled, { keyframes } from 'styled-components'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPlus,
  faCompass,
  faBullseye,
  faChartLine,
  faClockRotateLeft,
  faFileLines,
  faSun,
  faMoon,
  faArrowRight,
} from '@fortawesome/free-solid-svg-icons'
import { useAppSelector, useAppDispatch } from '../store/hooks'
import { selectMode, toggleMode } from '../store/themeSlice'
import type { ThemeMode } from '../store/themeSlice'
import type { PageKey } from './layout/AppShell'
import { colors, spacing, typography, shadows, radii, zIndex } from '../theme'

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
  background: rgba(0, 0, 0, 0.4);
  z-index: ${zIndex.modal + 2};
  display: flex;
  justify-content: center;
  padding-top: 10vh;
  animation: ${overlayIn} 0.1s ease;
`

const Modal = styled.div<{ $mode: ThemeMode }>`
  width: 100%;
  max-width: 520px;
  max-height: 60vh;
  background: ${(p) => (p.$mode === 'dark' ? '#1e293b' : colors.white)};
  border: 1px solid ${(p) => (p.$mode === 'dark' ? '#334155' : colors.gray[200])};
  border-radius: ${radii.lg};
  box-shadow: ${(p) => (p.$mode === 'dark' ? shadows.dark.xl : shadows.xl)};
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: ${modalIn} 0.12s ease;
`

const Input = styled.input<{ $mode: ThemeMode }>`
  width: 100%;
  padding: ${spacing[1]} ${spacing[1.25]};
  border: none;
  border-bottom: 1px solid ${(p) => (p.$mode === 'dark' ? '#334155' : colors.gray[200])};
  font-size: ${typography.sizes.base};
  background: transparent;
  color: ${(p) => (p.$mode === 'dark' ? '#f1f5f9' : colors.gray[800])};
  outline: none;

  &::placeholder {
    color: ${(p) => (p.$mode === 'dark' ? '#64748b' : colors.gray[400])};
  }
`

const Results = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${spacing[0.5]};
`

const SectionTitle = styled.div<{ $mode: ThemeMode }>`
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${(p) => (p.$mode === 'dark' ? '#64748b' : colors.gray[400])};
  padding: ${spacing[0.5]} ${spacing[0.75]} ${spacing[0.25]};
`

const ResultItem = styled.button<{ $mode: ThemeMode; $highlighted: boolean }>`
  display: flex;
  align-items: center;
  gap: ${spacing[0.75]};
  width: 100%;
  padding: ${spacing[0.5]} ${spacing[0.75]};
  border: none;
  border-radius: ${radii.md};
  background: ${(p) => (p.$highlighted ? (p.$mode === 'dark' ? 'rgba(59,130,246,0.15)' : colors.primary[50]) : 'transparent')};
  color: ${(p) => (p.$mode === 'dark' ? '#e2e8f0' : colors.gray[700])};
  cursor: pointer;
  font-size: ${typography.sizes.sm};
  text-align: left;
  transition: background 0.1s ease;

  &:hover {
    background: ${(p) => (p.$mode === 'dark' ? 'rgba(255,255,255,0.05)' : colors.gray[50])};
  }
`

const ItemIcon = styled.span<{ $color?: string }>`
  width: 28px;
  height: 28px;
  border-radius: ${radii.sm};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${(p) => p.$color || colors.gray[400]};
  font-size: ${typography.sizes.xs};
  flex-shrink: 0;
`

const ItemLabel = styled.span`
  flex: 1;
`

const ItemHint = styled.span<{ $mode: ThemeMode }>`
  font-size: 0.65rem;
  color: ${(p) => (p.$mode === 'dark' ? '#475569' : colors.gray[300])};
`

const ShortcutHint = styled.kbd<{ $mode: ThemeMode }>`
  font-size: 0.6rem;
  padding: 1px 5px;
  border: 1px solid ${(p) => (p.$mode === 'dark' ? '#475569' : colors.gray[200])};
  border-radius: 4px;
  background: ${(p) => (p.$mode === 'dark' ? '#0f172a' : colors.gray[50])};
  color: ${(p) => (p.$mode === 'dark' ? '#64748b' : colors.gray[400])};
  font-family: inherit;
`

interface CommandAction {
  id: string
  label: string
  hint?: string
  icon: typeof faCompass
  iconColor?: string
  action: () => void
  keywords: string[]
  section: string
}

type Props = {
  isOpen: boolean
  onClose: () => void
  onNavigate: (page: PageKey) => void
  onCreateGoal: () => void
  goals: { id: string; name: string; icon: string | null }[]
}

export default function CommandPalette({ isOpen, onClose, onNavigate, onCreateGoal, goals }: Props) {
  const themeMode = useAppSelector(selectMode)
  const dispatch = useAppDispatch()
  const [query, setQuery] = useState('')
  const [highlightIdx, setHighlightIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setHighlightIdx(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  const commands = useMemo((): CommandAction[] => {
    const items: CommandAction[] = [
      {
        id: 'nav-overview',
        label: 'Go to Overview',
        hint: 'Dashboard',
        icon: faCompass,
        action: () => { onNavigate('overview'); onClose() },
        keywords: ['overview', 'dashboard', 'home', 'summary'],
        section: 'Navigation',
      },
      {
        id: 'nav-goals',
        label: 'Go to Goals',
        hint: 'Manage goals',
        icon: faBullseye,
        action: () => { onNavigate('goals'); onClose() },
        keywords: ['goals', 'targets', 'manage'],
        section: 'Navigation',
      },
      {
        id: 'nav-analytics',
        label: 'Go to Analytics',
        hint: 'Insights & charts',
        icon: faChartLine,
        action: () => { onNavigate('analytics'); onClose() },
        keywords: ['analytics', 'charts', 'insights', 'stats', 'performance'],
        section: 'Navigation',
      },
      {
        id: 'nav-activity',
        label: 'Go to Activity',
        hint: 'Recent events',
        icon: faClockRotateLeft,
        action: () => { onNavigate('activity'); onClose() },
        keywords: ['activity', 'history', 'events', 'log'],
        section: 'Navigation',
      },
      {
        id: 'nav-reports',
        label: 'Go to Reports',
        hint: 'Build & share reports',
        icon: faFileLines,
        action: () => { onNavigate('reports'); onClose() },
        keywords: ['reports', 'pdf', 'export', 'share', 'print'],
        section: 'Navigation',
      },
      {
        id: 'create-goal',
        label: 'Create Goal',
        hint: 'Ctrl+N',
        icon: faPlus,
        iconColor: colors.primary[500],
        action: () => { onCreateGoal(); onClose() },
        keywords: ['create', 'new', 'add', 'goal'],
        section: 'Actions',
      },
      {
        id: 'toggle-theme',
        label: themeMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
        hint: '',
        icon: themeMode === 'dark' ? faSun : faMoon,
        iconColor: colors.warning[500],
        action: () => { dispatch(toggleMode()); onClose() },
        keywords: ['theme', 'dark', 'light', 'mode', 'toggle'],
        section: 'Actions',
      },
    ]

    // Add goal search results
    for (const goal of goals) {
      items.push({
        id: `goal-${goal.id}`,
        label: goal.name,
        hint: 'View goal',
        icon: faBullseye,
        iconColor: colors.primary[400],
        action: () => { onNavigate('goals'); onClose() },
        keywords: [goal.name, ...goal.name.split(' ')],
        section: 'Goals',
      })
    }

    return items
  }, [onNavigate, onClose, onCreateGoal, themeMode, dispatch, goals])

  const filtered = useMemo(() => {
    if (!query.trim()) return commands
    const q = query.toLowerCase()
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.keywords.some((k) => k.toLowerCase().includes(q)),
    )
  }, [query, commands])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightIdx((i) => Math.min(i + 1, filtered.length - 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightIdx((i) => Math.max(i - 1, 0))
        return
      }
      if (e.key === 'Enter' && filtered[highlightIdx]) {
        filtered[highlightIdx].action()
      }
    },
    [onClose, filtered, highlightIdx],
  )

  if (!isOpen) return null

  // Group results by section
  const sections = new Map<string, CommandAction[]>()
  for (const item of filtered) {
    const existing = sections.get(item.section) || []
    existing.push(item)
    sections.set(item.section, existing)
  }

  const sectionOrder = ['Navigation', 'Actions', 'Goals']

  return (
    <Overlay onClick={onClose}>
      <Modal $mode={themeMode} onClick={(e) => e.stopPropagation()}>
        <Input
          $mode={themeMode}
          ref={inputRef}
          type="text"
          placeholder="Search goals, pages, actions..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setHighlightIdx(0)
          }}
          onKeyDown={handleKeyDown}
        />
        <Results>
          {filtered.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '24px',
                color: themeMode === 'dark' ? '#64748b' : colors.gray[400],
                fontSize: typography.sizes.sm,
              }}
            >
              No results for "{query}"
            </div>
          )}
          {sectionOrder.map((section) => {
            const items = sections.get(section)
            if (!items) return null
            return (
              <div key={section}>
                <SectionTitle $mode={themeMode}>{section}</SectionTitle>
                {items.map((item) => {
                  const idx = filtered.indexOf(item)
                  return (
                    <ResultItem
                      key={item.id}
                      $mode={themeMode}
                      $highlighted={idx === highlightIdx}
                      onClick={item.action}
                      onMouseEnter={() => setHighlightIdx(idx)}
                    >
                      <ItemIcon $color={item.iconColor}>
                        <FontAwesomeIcon icon={item.icon} />
                      </ItemIcon>
                      <ItemLabel>{item.label}</ItemLabel>
                      {item.hint && <ItemHint $mode={themeMode}>{item.hint}</ItemHint>}
                      <ShortcutHint $mode={themeMode}>
                        <FontAwesomeIcon icon={faArrowRight} size="xs" />
                      </ShortcutHint>
                    </ResultItem>
                  )
                })}
              </div>
            )
          })}
        </Results>
      </Modal>
    </Overlay>
  )
}
