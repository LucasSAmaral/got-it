import AddIcon from '@mui/icons-material/Add'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import {
  Box,
  BottomNavigation,
  BottomNavigationAction,
  Button,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { isAdmin } from '../features/admin/admin'
import { useCollection } from '../features/collection/useCollection'
import { BottomNavBar, SidebarNav } from './AppLayout.styles'

const BASE_NAV_ITEMS = [
  { to: '/', label: 'Coleção', icon: <GridViewOutlinedIcon /> },
  { to: '/eu-tenho', label: 'Eu tenho?', icon: <SearchOutlinedIcon /> },
]

const ADMIN_NAV_ITEM = { to: '/admin', label: 'Editar catálogo', icon: <EditOutlinedIcon /> }

/** Celular: navegação embaixo. Tela larga (md, 900 px, para cima): barra lateral e conteúdo com largura limitada. */
export function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { session } = useAuth()

  const navItems = isAdmin(session) ? [...BASE_NAV_ITEMS, ADMIN_NAV_ITEM] : BASE_NAV_ITEMS
  const value = navItems.slice(1).find((item) => location.pathname.startsWith(item.to))?.to ?? '/'

  // Carrega a lista completa em qualquer aba do app: é ela que atualiza a cópia usada offline.
  useCollection('')

  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      <SidebarNav component="nav">
        <Typography variant="h3" sx={{ px: 1, color: 'primary.main' }}>
          Got it?
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/cadastro')}>
          Cadastrar edição
        </Button>
        <List disablePadding>
          {navItems.map((item) => (
            <ListItemButton
              key={item.to}
              selected={value === item.to}
              onClick={() => navigate(item.to)}
              sx={{ borderRadius: 2, mb: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontWeight: 600 } } }} />
            </ListItemButton>
          ))}
        </List>
      </SidebarNav>

      <Box sx={{ flex: 1, minWidth: 0, overflowY: 'auto', pb: { xs: 8, md: 0 } }}>
        <Box sx={{ maxWidth: 1120, mx: 'auto' }}>
          <Outlet />
        </Box>
      </Box>

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
