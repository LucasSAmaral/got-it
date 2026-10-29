import { Link, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { AuthPageBox } from './AuthPage.styles'

/** Moldura das telas de entrar e criar conta: nome do app, o formulário e o aviso de rodapé. */
export function AuthPage({ children }: { children: ReactNode }) {
  return (
    <AuthPageBox>
      <Stack spacing={1}>
        <Typography variant="h1" color="text.primary">
          Tem esse?
        </Typography>
        <Typography variant="body2" color="text.secondary">
          sua coleção de HQs, sempre à mão
        </Typography>
      </Stack>

      {children}

      <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
        Ao continuar, você concorda em guardar sua coleção nesta conta.{' '}
        <Link component={RouterLink} to="/privacidade" color="inherit">
          Privacidade
        </Link>
      </Typography>
    </AuthPageBox>
  )
}
