import AddIcon from '@mui/icons-material/Add'
import LogoutIcon from '@mui/icons-material/Logout'
import { Button, List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { LogoutDialog } from '../features/auth/LogoutDialog'
import { SidebarNav } from './AppLayout.styles'
import { activeNavItem, useNavItems } from './navItems'

/**
 * Barra lateral (tela larga, a partir de `md`): título, cadastrar e navegação. Fica escondida no
 * celular (ver `SidebarNav`). Reaproveitada pelo `AppLayout` e pela tela de cadastro, que fica fora
 * dele de propósito (tela cheia no celular, com a própria seta de voltar).
 */
export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const navItems = useNavItems()
  const active = activeNavItem(navItems, location.pathname)
  const [logoutOpen, setLogoutOpen] = useState(false)

  return (
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
            selected={item === active}
            onClick={() => navigate(item.to)}
            sx={{ borderRadius: 2, mb: 0.5 }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontWeight: 600 } } }} />
          </ListItemButton>
        ))}
      </List>

      {/* `mt: auto` empurra o Sair para o pé da barra; `flexGrow: 0` porque o ListItemButton cresce por padrão. */}
      <ListItemButton onClick={() => setLogoutOpen(true)} sx={{ borderRadius: 2, mt: 'auto', flexGrow: 0 }}>
        <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
          <LogoutIcon />
        </ListItemIcon>
        <ListItemText primary="Sair" slotProps={{ primary: { sx: { fontWeight: 600 } } }} />
      </ListItemButton>
      <LogoutDialog open={logoutOpen} onClose={() => setLogoutOpen(false)} />
    </SidebarNav>
  )
}
