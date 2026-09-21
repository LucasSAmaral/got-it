import AddIcon from '@mui/icons-material/Add'
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
  Paper,
  Typography,
} from '@mui/material'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useCollection } from '../features/collection/useCollection'

const NAV_ITEMS = [
  { to: '/', label: 'Coleção', icon: <GridViewOutlinedIcon /> },
  { to: '/eu-tenho', label: 'Eu tenho?', icon: <SearchOutlinedIcon /> },
]

/** Celular: navegação embaixo. Tela larga (md, 900 px, para cima): barra lateral e conteúdo com largura limitada. */
export function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const value = location.pathname === '/eu-tenho' ? '/eu-tenho' : '/'

  // Carrega a lista completa em qualquer aba do app: é ela que atualiza a cópia usada offline.
  useCollection('')

  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      <Box
        component="nav"
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          gap: 3,
          width: 240,
          flexShrink: 0,
          p: 2.5,
          bgcolor: 'background.paper',
          borderRight: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="h3" sx={{ px: 1, color: 'primary.main' }}>
          Got it?
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/cadastro')}>
          Cadastrar edição
        </Button>
        <List disablePadding>
          {NAV_ITEMS.map((item) => (
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
      </Box>

      <Box sx={{ flex: 1, minWidth: 0, overflowY: 'auto', pb: { xs: 8, md: 0 } }}>
        <Box sx={{ maxWidth: 1120, mx: 'auto' }}>
          <Outlet />
        </Box>
      </Box>

      <Paper
        elevation={0}
        sx={{
          display: { xs: 'block', md: 'none' },
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <BottomNavigation showLabels value={value} onChange={(_event, newValue: string) => navigate(newValue)}>
          {NAV_ITEMS.map((item) => (
            <BottomNavigationAction key={item.to} label={item.label} value={item.to} icon={item.icon} />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  )
}
