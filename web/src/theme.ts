/**
 * Design Tokens — single source of truth for all visual properties.
 * Import these tokens into styled-components via the theme prop or import directly.
 */

// ── Colour Palette ────────────────────────────────────────────────────
export const colors = {
  // Primary brand — professional navy-blue
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },

  // Greys — neutral, clean
  gray: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },

  // Semantic — success
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
  },

  // Warning / amber
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
  },

  // Error / red
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
  },

  // Info / sky
  info: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
  },

  // Neutral
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',

  // Dark mode surfaces
  dark: {
    bg: '#0f172a',
    surface: '#1e293b',
    surfaceAlt: '#334155',
    border: '#334155',
    borderLight: '#475569',
    text: '#f1f5f9',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
  },

  // Light mode surfaces
  light: {
    bg: '#f8fafc',
    surface: '#ffffff',
    surfaceAlt: '#f1f5f9',
    border: '#e2e8f0',
    borderLight: '#f1f5f9',
    text: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
  },
}

// ── Spacing Scale (4px base) ──────────────────────────────────────────
export const spacing = {
  0: '0',
  0.25: '0.25rem', //  4px
  0.5: '0.5rem',   //  8px
  0.75: '0.75rem', // 12px
  1: '1rem',       // 16px
  1.25: '1.25rem', // 20px
  1.5: '1.5rem',   // 24px
  2: '2rem',       // 32px
  2.5: '2.5rem',   // 40px
  3: '3rem',       // 48px
  4: '4rem',       // 64px
  5: '5rem',       // 80px
}

// ── Typography ────────────────────────────────────────────────────────
export const typography = {
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontMono: 'SFMono-Regular, Menlo, Monaco, Consolas, monospace',

  sizes: {
    xs: '0.75rem',   // 12px
    sm: '0.875rem',  // 14px
    base: '1rem',    // 16px
    lg: '1.125rem',  // 18px
    xl: '1.25rem',   // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
  },

  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
}

// ── Shadows ───────────────────────────────────────────────────────────
export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
  // Dark mode shadows — more subtle
  dark: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.3)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
  },
}

// ── Border Radius ─────────────────────────────────────────────────────
export const radii = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
}

// ── Breakpoints ───────────────────────────────────────────────────────
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
}

// ── Transitions ───────────────────────────────────────────────────────
export const transitions = {
  fast: '0.15s ease',
  normal: '0.25s ease',
  slow: '0.35s ease',
}

// ── Z-Index Scale ─────────────────────────────────────────────────────
export const zIndex = {
  dropdown: 100,
  sticky: 200,
  modal: 1000,
  toast: 2000,
  tooltip: 3000,
}

// ── Milestone Labels ──────────────────────────────────────────────────
export const milestones = [
  { max: 24, label: 'Getting Started', color: colors.error[500], bg: colors.error[50] },
  { max: 49, label: 'Building Momentum', color: colors.warning[500], bg: colors.warning[50] },
  { max: 74, label: 'Halfway There', color: colors.primary[500], bg: colors.primary[50] },
  { max: 99, label: 'Almost There', color: colors.success[500], bg: colors.success[50] },
  { max: 100, label: 'Goal Achieved', color: colors.success[600], bg: colors.success[100] },
] as const

export function getMilestone(progressPercent: number) {
  const p = Math.min(Math.max(progressPercent, 0), 100)
  for (const m of milestones) {
    if (p <= m.max) return m
  }
  return milestones[milestones.length - 1]
}

// ── Progress Color Helpers ────────────────────────────────────────────
export function getProgressColor(progress: number): string {
  if (progress >= 100) return colors.success[500]
  if (progress >= 75) return colors.success[400]
  if (progress >= 50) return colors.primary[500]
  if (progress >= 25) return colors.warning[500]
  return colors.error[400]
}

export function getProgressGradient(progress: number): string {
  if (progress >= 100) return `linear-gradient(90deg, ${colors.success[400]}, ${colors.success[600]})`
  if (progress >= 75) return `linear-gradient(90deg, ${colors.success[400]}, ${colors.success[500]})`
  if (progress >= 50) return `linear-gradient(90deg, ${colors.primary[400]}, ${colors.primary[500]})`
  if (progress >= 25) return `linear-gradient(90deg, ${colors.warning[400]}, ${colors.warning[500]})`
  return `linear-gradient(90deg, ${colors.error[400]}, ${colors.error[500]})`
}

// ── Surface helpers ───────────────────────────────────────────────────
export const surface = (mode: 'light' | 'dark') => ({
  bg: mode === 'dark' ? colors.dark.bg : colors.light.bg,
  surface: mode === 'dark' ? colors.dark.surface : colors.light.surface,
  surfaceAlt: mode === 'dark' ? colors.dark.surfaceAlt : colors.light.surfaceAlt,
  border: mode === 'dark' ? colors.dark.border : colors.light.border,
  borderLight: mode === 'dark' ? colors.dark.borderLight : colors.light.borderLight,
  text: mode === 'dark' ? colors.dark.text : colors.light.text,
  textSecondary: mode === 'dark' ? colors.dark.textSecondary : colors.light.textSecondary,
  textMuted: mode === 'dark' ? colors.dark.textMuted : colors.light.textMuted,
  shadow: mode === 'dark' ? shadows.dark : shadows,
})
