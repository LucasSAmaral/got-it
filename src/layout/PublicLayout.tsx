import { Box, Button, Typography } from '@mui/material'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { AppLayout } from './AppLayout'
import { PublicHeader } from './AppLayout.styles'
import { PageContent } from './PageContent'

/**
 * Páginas que abrem sem conta (Início e vitrine da loja). Com sessão (ou cópia offline), ficam dentro do
 * `AppLayout`, com a navegação de sempre; sem, ganham só um cabeçalho com o nome do app e "Entrar".
 */
export function PublicLayout() {
  const { session, loading, offlineAccess } = useAuth()
  const { pathname } = useLocation()

  if (loading) {
    return <LoadingSpinner sx={{ height: '100%', alignItems: 'center' }} />
  }

  if (session || offlineAccess) {
    return <AppLayout />
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PublicHeader>
        <Typography variant="h3" component={Link} to="/" sx={{ color: 'primary.main', textDecoration: 'none' }}>
          Tem esse?
        </Typography>
        {/* Depois de entrar, volta para a página em que estava (ex.: a vitrine da loja). */}
        <Button component={Link} to={pathname === '/' ? '/login' : `/login?voltar=${pathname}`} variant="contained">
          Entrar
        </Button>
      </PublicHeader>
      <PageContent>
        <Outlet />
      </PageContent>
    </Box>
  )
}
