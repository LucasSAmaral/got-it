import { Box, Paper, styled } from '@mui/material'
import type { ElementType } from 'react'

/** Barra lateral de navegação (tela larga, a partir de `md`); escondida no celular. */
export const SidebarNav = styled(Box)<{ component?: ElementType }>(({ theme }) => ({
  display: 'none',
  [theme.breakpoints.up('md')]: {
    display: 'flex',
  },
  flexDirection: 'column',
  gap: theme.spacing(3),
  width: 240,
  flexShrink: 0,
  padding: theme.spacing(2.5),
  backgroundColor: theme.palette.background.paper,
  borderRight: `1px solid ${theme.palette.divider}`,
}))

/** Navegação fixa embaixo (celular); escondida a partir de `md`, onde entra a `SidebarNav`. */
export const BottomNavBar = styled(Paper)(({ theme }) => ({
  display: 'block',
  [theme.breakpoints.up('md')]: {
    display: 'none',
  },
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  borderTop: `1px solid ${theme.palette.divider}`,
}))

/** Cabeçalho das páginas públicas para quem não entrou (ver `PublicLayout`): nome do app e "Entrar". */
export const PublicHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(1.5, 2.5),
  backgroundColor: theme.palette.background.paper,
  borderBottom: `1px solid ${theme.palette.divider}`,
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(2, 5),
  },
}))
