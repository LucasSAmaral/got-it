import { Box, BottomNavigation, BottomNavigationAction } from '@mui/material'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useCollection } from '../features/collection/useCollection'
import { BottomNavBar } from './AppLayout.styles'
import { useNavItems } from './navItems'
import { PageContent } from './PageContent'
import { Sidebar } from './Sidebar'

/** Celular: navegação embaixo. Tela larga (md, 900 px, para cima): barra lateral e conteúdo com largura limitada. */
export function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const navItems = useNavItems()
  const value = navItems.slice(1).find((item) => location.pathname.startsWith(item.to))?.to ?? '/'

  // Carrega a lista completa em qualquer aba do app: é ela que atualiza a cópia usada offline.
  useCollection('')

  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      <Sidebar />

      <PageContent sx={{ pb: { xs: 8, md: 0 } }}>
        <Outlet />
      </PageContent>

      <BottomNavBar elevation={0}>
        <BottomNavigation showLabels value={value} onChange={(_event, newValue: string) => navigate(newValue)}>
          {navItems.map((item) => (
            <BottomNavigationAction key={item.to} label={item.label} value={item.to} icon={item.icon} />
          ))}
        </BottomNavigation>
      </BottomNavBar>
    </Box>
  )
}
