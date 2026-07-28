/**
 * Design Tokens — single source of truth for all visual properties.
 * Import these tokens into styled-components via the theme prop or import directly.
 */

// ── Colour Palette ────────────────────────────────────────────────────
export const colors = {
  // Primary brand
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#4299e1',
    600: '#2b6cb0',
    700: '#2c5282',
    800: '#2a4365',
    900: '#1a365d',
  },

  // Greys
  gray: {
    50: '#f7fafc',
    100: '#edf2f7',
    200: '#e2e8f0',
    300: '#cbd5e0',
    400: '#a0aec0',
    500: '#718096',
    600: '#4a5568',
    700: '#2d3748',
    800: '#1a202c',
    900: '#171923',
  },

  // Semantic
  success: {
    50: '#f0fff4',
    100: '#c6f6d5',
    400: '#48bb78',
    500: '#38a169',
    600: '#2f855a',
  },

  warning: {
    50: '#fffaf0',
    100: '#feebc8',
    400: '#ed8936',
    500: '#dd6b20',
  },

  error: {
    50: '#fff5f5',
    100: '#fed7d7',
    400: '#fc8181',
    500: '#e53e3e',
    600: '#c53030',
  },

  // Neutral
  white: '#ffffff',
  black: '#000000',
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
  sm: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
  md: '0 4px 6px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.04)',
  lg: '0 10px 25px rgba(0, 0, 0, 0.08), 0 4px 10px rgba(0, 0, 0, 0.04)',
  xl: '0 20px 60px rgba(0, 0, 0, 0.15)',
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
  fast: '0.12s ease',
  normal: '0.2s ease',
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
