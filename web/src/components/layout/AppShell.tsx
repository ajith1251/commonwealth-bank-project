import { useState, useCallback } from 'react'
import styled, { keyframes } from 'styled-components'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCompass,
  faBullseye,
  faChartLine,
  faClockRotateLeft,
  faFileLines,
  faSun,
  faMoon,
  faBars,
  faChevronLeft,
} from '@fortawesome/free-solid-svg-icons'
import { useAppSelector, useAppDispatch } from '../../store/hooks'
import { toggleMode, selectMode } from '../../store/themeSlice'
import type { ThemeMode } from '../../store/themeSlice'
import ConsistencyCard from '../engagement/ConsistencyCard'
import { colors, spacing, typography, shadows, radii, breakpoints, transitions, zIndex } from '../../theme'

export type PageKey = 'overview' | 'goals' | 'analytics' | 'activity' | 'reports'

// ── Animations ────────────────────────────────────────────────────────

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`

// ── Styled Components ─────────────────────────────────────────────────

const ShellContainer = styled.div`
  display: flex;
  min-height: 100vh;
`

const Sidebar = styled.aside<{ $mode: ThemeMode; $collapsed: boolean; $mobileOpen: boolean }>`
  width: ${(p) => (p.$collapsed ? '64px' : '240px')};
  background: ${(p) => (p.$mode === 'dark' ? '#0f172a' : colors.white)};
  border-right: 1px solid ${(p) => (p.$mode === 'dark' ? colors.dark.border : colors.gray[200])};
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: width ${transitions.normal};
  z-index: ${zIndex.sticky};
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;

  @media (max-width: ${breakpoints.md}) {
    position: fixed;
    left: ${(p) => (p.$mobileOpen ? '0' : '-100%')};
    width: 280px;
    z-index: ${zIndex.modal};
    transition: left ${transitions.normal};
    box-shadow: ${(p) => (p.$mobileOpen ? (p.$mode === 'dark' ? shadows.dark.xl : shadows.xl) : 'none')};
  }
`

const MobileOverlay = styled.div<{ $visible: boolean }>`
  @media (max-width: ${breakpoints.md}) {
    display: ${(p) => (p.$visible ? 'block' : 'none')};
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: ${zIndex.modal - 1};
    animation: ${fadeIn} 0.15s ease;
  }

  @media (min-width: calc(${breakpoints.md} + 1px)) {
    display: none;
  }
`

const SidebarHeader = styled.div<{ $collapsed: boolean }>`
  padding: ${spacing[1.25]} ${spacing[1]};
  display: flex;
  align-items: center;
  gap: ${spacing[0.75]};
  border-bottom: 1px solid ${colors.gray[100]};
  min-height: 56px;

  @media (max-width: ${breakpoints.md}) {
    display: flex;
  }
`

const Logo = styled.div<{ $mode: ThemeMode }>`
  width: 32px;
  height: 32px;
  border-radius: ${radii.md};
  background: ${(p) => (p.$mode === 'dark' ? colors.primary[800] : colors.primary[600])};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${colors.white};
  font-size: ${typography.sizes.sm};
  flex-shrink: 0;
`

const BrandName = styled.span<{ $visible: boolean; $mode: ThemeMode }>`
  font-size: ${typography.sizes.sm};
  font-weight: ${typography.weights.bold};
  color: ${(p) => (p.$mode === 'dark' ? colors.dark.text : colors.gray[800])};
  white-space: nowrap;
  overflow: hidden;
  opacity: ${(p) => (p.$visible ? 1 : 0)};
  transition: opacity ${transitions.fast};
`

const Nav = styled.nav<{ $collapsed: boolean }>`
  flex: 1;
  padding: ${spacing[0.75]} ${spacing[0.5]};
  display: flex;
  flex-direction: column;
  gap: 2px;
`

const NavItem = styled.button<{
  $active: boolean
  $mode: ThemeMode
  $collapsed: boolean
}>`
  display: flex;
  align-items: center;
  gap: ${spacing[0.75]};
  padding: ${spacing[0.5]} ${spacing[0.75]};
  border: none;
  border-radius: ${radii.md};
  background: ${(p) => (p.$active ? (p.$mode === 'dark' ? 'rgba(59,130,246,0.15)' : colors.primary[50]) : 'transparent')};
  color: ${(p) =>
    p.$active
      ? colors.primary[600]
      : p.$mode === 'dark'
        ? colors.dark.textSecondary
        : colors.gray[500]};
  cursor: pointer;
  font-size: ${typography.sizes.sm};
  font-weight: ${(p) => (p.$active ? 600 : 400)};
  transition: all ${transitions.fast};
  white-space: nowrap;
  width: 100%;
  text-align: left;

  &:hover {
    background: ${(p) => (p.$mode === 'dark' ? 'rgba(255,255,255,0.05)' : colors.gray[50])};
    color: ${(p) => (p.$active ? colors.primary[600] : p.$mode === 'dark' ? colors.dark.text : colors.gray[700])};
  }

  svg {
    width: 18px;
    flex-shrink: 0;
  }
`

const NavLabel = styled.span<{ $visible: boolean }>`
  opacity: ${(p) => (p.$visible ? 1 : 0)};
  transition: opacity ${transitions.fast};
  overflow: hidden;
`

const SidebarFooter = styled.div<{ $collapsed: boolean }>`
  padding: ${spacing[0.75]} ${spacing[0.5]};
  border-top: 1px solid ${colors.gray[100]};
  display: flex;
  flex-direction: column;
  gap: 2px;
`

const FooterButton = styled.button<{ $mode: ThemeMode; $collapsed: boolean }>`
  display: flex;
  align-items: center;
  gap: ${spacing[0.75]};
  padding: ${spacing[0.5]} ${spacing[0.75]};
  border: none;
  border-radius: ${radii.md};
  background: transparent;
  color: ${(p) => (p.$mode === 'dark' ? colors.dark.textSecondary : colors.gray[500])};
  cursor: pointer;
  font-size: ${typography.sizes.sm};
  transition: all ${transitions.fast};
  width: 100%;
  text-align: left;

  &:hover {
    background: ${(p) => (p.$mode === 'dark' ? 'rgba(255,255,255,0.05)' : colors.gray[50])};
    color: ${(p) => (p.$mode === 'dark' ? colors.dark.text : colors.gray[700])};
  }
`

const ContentArea = styled.main<{ $collapsed: boolean }>`
  flex: 1;
  min-width: 0; /* allow shrink below content min-width (prevents horizontal overflow) */
  margin-left: ${(p) => (p.$collapsed ? '64px' : '240px')};
  transition: margin-left ${transitions.normal};
  min-height: 100vh;

  @media (max-width: ${breakpoints.md}) {
    margin-left: 0;
  }
`

const TopBar = styled.header<{ $mode: ThemeMode }>`
  background: ${(p) => (p.$mode === 'dark' ? '#0f172a' : colors.white)};
  border-bottom: 1px solid ${(p) => (p.$mode === 'dark' ? colors.dark.border : colors.gray[200])};
  padding: ${spacing[0.75]} ${spacing[1.25]};
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: ${zIndex.sticky};
`

const TopBarLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing[0.75]};
`

const MenuButton = styled.button<{ $mode: ThemeMode }>`
  display: none;
  background: none;
  border: none;
  color: ${(p) => (p.$mode === 'dark' ? colors.dark.text : colors.gray[600])};
  cursor: pointer;
  padding: 4px;
  font-size: ${typography.sizes.lg};

  @media (max-width: ${breakpoints.md}) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`

const PageTitle = styled.h1<{ $mode: ThemeMode }>`
  margin: 0;
  font-size: ${typography.sizes.lg};
  font-weight: ${typography.weights.bold};
  color: ${(p) => (p.$mode === 'dark' ? colors.dark.text : colors.gray[800])};
`

const PageDescription = styled.span<{ $mode: ThemeMode }>`
  font-size: ${typography.sizes.sm};
  color: ${(p) => (p.$mode === 'dark' ? colors.dark.textMuted : colors.gray[400])};
  display: none;

  @media (min-width: ${breakpoints.md}) {
    display: inline;
  }
`

const TopBarRight = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing[0.5]};
`

const IconBtn = styled.button<{ $mode: ThemeMode }>`
  width: 36px;
  height: 36px;
  border-radius: ${radii.md};
  border: 1px solid ${(p) => (p.$mode === 'dark' ? colors.dark.border : colors.gray[200])};
  background: ${(p) => (p.$mode === 'dark' ? colors.dark.surface : colors.white)};
  color: ${(p) => (p.$mode === 'dark' ? colors.dark.textSecondary : colors.gray[500])};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all ${transitions.fast};

  &:hover {
    border-color: ${colors.primary[200]};
    color: ${colors.primary[600]};
    background: ${colors.primary[50]};
  }
`

const SidebarToggle = styled.button<{ $mode: ThemeMode; $visible: boolean }>`
  display: ${(p) => (p.$visible ? 'flex' : 'none')};
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: ${radii.sm};
  border: 1px solid ${(p) => (p.$mode === 'dark' ? colors.dark.border : colors.gray[200])};
  background: ${(p) => (p.$mode === 'dark' ? colors.dark.surface : colors.white)};
  color: ${(p) => (p.$mode === 'dark' ? colors.dark.textMuted : colors.gray[400])};
  cursor: pointer;
  font-size: 0.6rem;
  transition: all ${transitions.fast};
  position: absolute;
  right: -12px;
  top: 16px;
  z-index: 5;

  &:hover {
    border-color: ${colors.primary[300]};
    color: ${colors.primary[600]};
  }

  @media (max-width: ${breakpoints.md}) {
    display: none;
  }
`

// ── Navigation Configuration ──────────────────────────────────────────

interface NavConfigItem {
  key: PageKey
  label: string
  icon: typeof faCompass
}

const navItems: NavConfigItem[] = [
  { key: 'overview', label: 'Overview', icon: faCompass },
  { key: 'goals', label: 'Goals', icon: faBullseye },
  { key: 'analytics', label: 'Analytics', icon: faChartLine },
  { key: 'activity', label: 'Activity', icon: faClockRotateLeft },
  { key: 'reports', label: 'Reports', icon: faFileLines },
]

const pageInfo: Record<PageKey, { title: string; description: string }> = {
  overview: { title: 'Overview', description: 'Executive dashboard — goal summary at a glance' },
  goals: { title: 'Goals', description: 'Manage and track your financial goals' },
  analytics: { title: 'Analytics', description: 'Detailed insights and performance metrics' },
  activity: { title: 'Activity', description: 'Recent changes and milestone events' },
  reports: { title: 'Reports', description: 'Build, export and share analytics reports' },
}

// ── Component ─────────────────────────────────────────────────────────

type Props = {
  currentPage: PageKey
  onNavigate: (page: PageKey) => void
  children: React.ReactNode
  onToggleTheme?: () => void
  rightActions?: React.ReactNode
}

export default function AppShell({ currentPage, onNavigate, children, onToggleTheme, rightActions }: Props) {
  const themeMode = useAppSelector(selectMode)
  const dispatch = useAppDispatch()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleNavigate = useCallback(
    (page: PageKey) => {
      onNavigate(page)
      setMobileOpen(false)
    },
    [onNavigate],
  )

  const handleToggleTheme = useCallback(() => {
    if (onToggleTheme) onToggleTheme()
    else dispatch(toggleMode())
  }, [dispatch, onToggleTheme])

  const info = pageInfo[currentPage]

  return (
    <ShellContainer>
      {/* Mobile Overlay */}
      <MobileOverlay $visible={mobileOpen} onClick={() => setMobileOpen(false)} />

      {/* Sidebar */}
      <Sidebar $mode={themeMode} $collapsed={collapsed} $mobileOpen={mobileOpen}>
        <div style={{ position: 'relative' }}>
          <SidebarHeader $collapsed={collapsed}>
            <Logo $mode={themeMode}>
              <FontAwesomeIcon icon={faBullseye} />
            </Logo>
            <BrandName $visible={!collapsed} $mode={themeMode}>
              CommBank
            </BrandName>
          </SidebarHeader>
          <SidebarToggle
            $mode={themeMode}
            $visible={true}
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <FontAwesomeIcon icon={faChevronLeft} style={{ transform: collapsed ? 'rotate(180deg)' : 'none' }} />
          </SidebarToggle>
        </div>

        <Nav $collapsed={collapsed}>
          {navItems.map((item) => (
            <NavItem
              key={item.key}
              $active={currentPage === item.key}
              $mode={themeMode}
              $collapsed={collapsed}
              onClick={() => handleNavigate(item.key)}
              aria-label={item.label}
              title={collapsed ? item.label : undefined}
            >
              <FontAwesomeIcon icon={item.icon} />
              <NavLabel $visible={!collapsed}>{item.label}</NavLabel>
            </NavItem>
          ))}
        </Nav>

        {!collapsed && (
          <div style={{ padding: '0 8px 8px' }}>
            <ConsistencyCard />
          </div>
        )}

        <SidebarFooter $collapsed={collapsed}>
          <FooterButton $mode={themeMode} $collapsed={collapsed} onClick={handleToggleTheme}>
            <FontAwesomeIcon icon={themeMode === 'dark' ? faSun : faMoon} />
            <NavLabel $visible={!collapsed}>{themeMode === 'dark' ? 'Light' : 'Dark'} Mode</NavLabel>
          </FooterButton>
        </SidebarFooter>
      </Sidebar>

      {/* Content */}
      <ContentArea $collapsed={collapsed}>
        <TopBar $mode={themeMode}>
          <TopBarLeft>
            <MenuButton $mode={themeMode} onClick={() => setMobileOpen(true)} aria-label="Open navigation menu">
              <FontAwesomeIcon icon={faBars} />
            </MenuButton>
            <div>
              <PageTitle $mode={themeMode}>{info.title}</PageTitle>
            </div>
            <PageDescription $mode={themeMode}>{info.description}</PageDescription>
          </TopBarLeft>
          <TopBarRight>
            {rightActions}
            <IconBtn $mode={themeMode} onClick={handleToggleTheme} aria-label="Toggle theme">
              <FontAwesomeIcon icon={themeMode === 'dark' ? faSun : faMoon} />
            </IconBtn>
          </TopBarRight>
        </TopBar>
        {children}
      </ContentArea>
    </ShellContainer>
  )
}
