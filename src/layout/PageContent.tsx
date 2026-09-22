import { Box, type SxProps, type Theme } from '@mui/material'
import type { ReactNode } from 'react'

type PageContentProps = {
  children: ReactNode
  /** Estilo extra na área que rola (ex.: o espaço reservado pra navegação inferior no celular). */
  sx?: SxProps<Theme>
}

/**
 * Área de conteúdo ao lado da `Sidebar`: rola independente dela, largura máxima de 1120px
 * centralizada. Reaproveitada pelo `AppLayout` (via `Outlet`) e pela tela de cadastro.
 */
export function PageContent({ children, sx }: PageContentProps) {
  return (
    <Box sx={[{ flex: 1, minWidth: 0, overflowY: 'auto' }, ...(Array.isArray(sx) ? sx : [sx])]}>
      <Box sx={{ maxWidth: 1120, mx: 'auto' }}>{children}</Box>
    </Box>
  )
}
