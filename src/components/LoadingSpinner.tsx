import { Box, CircularProgress, type SxProps, type Theme } from '@mui/material'

type LoadingSpinnerProps = {
  size?: number
  /** Espaço ao redor do spinner (ex.: `py` numa seção, ou `height`/`alignItems` numa tela cheia). */
  sx?: SxProps<Theme>
}

/** Spinner centralizado horizontalmente, usado enquanto uma consulta está em andamento. */
export function LoadingSpinner({ size, sx }: LoadingSpinnerProps) {
  return (
    <Box sx={[{ display: 'flex', justifyContent: 'center' }, ...(Array.isArray(sx) ? sx : [sx])]}>
      <CircularProgress size={size} />
    </Box>
  )
}
