import MenuIcon from '@mui/icons-material/Menu'
import { Box, BottomNavigation, BottomNavigationAction } from '@mui/material'
import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useCollection } from '../features/collection/useCollection'
import { BottomNavBar } from './AppLayout.styles'
import { MoreMenu } from './MoreMenu'
import { activeNavItem, useNavItems } from './navItems'
import { PageContent } from './PageContent'
import { Sidebar } from './Sidebar'

const MORE = 'mais'

/**
 * Celular: navegação embaixo (Início, Coleção, Eu tenho? e "Mais" com o resto). Tela larga (md, 900 px,
 * para cima): barra lateral com tudo e conteúdo com largura limitada.
 */
export function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const navItems = useNavItems()
  const [moreOpen, setMoreOpen] = useState(false)
  const active = activeNavItem(navItems, location.pathname)
  const moreItems = navItems.filter((item) => !item.inBottomBar)
  // Item do "Mais" marca o "Mais"; rota sem item (ex.: vitrine da loja) não marca nada.
  const value = active ? (active.inBottomBar ? active.to : MORE) : false

  // Carrega a lista completa em qualquer aba do app: é ela que atualiza a cópia usada offline.
  useCollection('')

  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      <Sidebar />

      <PageContent sx={{ pb: { xs: 8, md: 0 } }}>
        <Outlet />
      </PageContent>

      <BottomNavBar elevation={0}>
        <BottomNavigation
          showLabels
          value={value}
          onChange={(_event, newValue: string) => (newValue === MORE ? setMoreOpen(true) : navigate(newValue))}
        >
          {navItems
            .filter((item) => item.inBottomBar)
            .map((item) => (
              <BottomNavigationAction key={item.to} label={item.label} value={item.to} icon={item.icon} />
            ))}
          <BottomNavigationAction label="Mais" value={MORE} icon={<MenuIcon />} />
        </BottomNavigation>
      </BottomNavBar>
      <MoreMenu open={moreOpen} onClose={() => setMoreOpen(false)} items={moreItems} active={active} />
    </Box>
  )
}
