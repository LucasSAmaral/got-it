import { createTheme } from '@mui/material/styles'

/**
 * Valores extraídos do design system "Got it?" (tema claro).
 * https://claude.ai/artifact/QkwZirgKCYBsuAFgTzuwQU
 */
export const tokens = {
  color: {
    surface100: '#efeae0',
    surface200: '#ffffff',
    ink: '#201c16',
    inkMuted: '#6b6357',
    brand: '#c1421a',
    brandInk: '#ffffff',
    gold: '#a3760f',
    line: '#dad2c0',
    success: '#2f7d5f',
    danger: '#a3341f',
  },
  font: {
    display: "'Bricolage Grotesque', system-ui, sans-serif",
    body: "'Public Sans', system-ui, sans-serif",
    mono: "'IBM Plex Mono', ui-monospace, 'SFMono-Regular', monospace",
  },
  radius: {
    sm: 6,
    md: 12,
    lg: 20,
    pill: 999,
  },
  space: (n: number) => `${n * 4}px`,
}

export const theme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: tokens.color.surface100,
      paper: tokens.color.surface200,
    },
    text: {
      primary: tokens.color.ink,
      secondary: tokens.color.inkMuted,
    },
    primary: {
      main: tokens.color.brand,
      contrastText: tokens.color.brandInk,
    },
    success: {
      main: tokens.color.success,
    },
    error: {
      main: tokens.color.danger,
    },
    divider: tokens.color.line,
  },
  shape: {
    borderRadius: tokens.radius.md,
  },
  typography: {
    fontFamily: tokens.font.body,
    h1: { fontFamily: tokens.font.display, fontWeight: 800, fontSize: 34, lineHeight: '40px' },
    h2: { fontFamily: tokens.font.display, fontWeight: 800, fontSize: 28, lineHeight: '34px' },
    h3: { fontFamily: tokens.font.display, fontWeight: 700, fontSize: 22, lineHeight: '28px' },
    h4: { fontFamily: tokens.font.display, fontWeight: 700, fontSize: 18, lineHeight: '24px' },
    body1: { fontSize: 16, lineHeight: '24px' },
    body2: { fontSize: 14, lineHeight: '20px' },
    caption: { fontSize: 12, lineHeight: '16px' },
    button: { fontWeight: 600, fontSize: 13, letterSpacing: '0.01em', textTransform: 'none' },
    overline: { fontWeight: 600, fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase' },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: tokens.radius.pill },
        contained: { boxShadow: 'none' },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: tokens.radius.sm },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: tokens.radius.md },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: tokens.radius.pill },
      },
    },
  },
})
