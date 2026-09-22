import AddIcon from '@mui/icons-material/Add'
import { Button, List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material'
import { useLocation, useNavigate } from 'react-router-dom'
import { SidebarNav } from './AppLayout.styles'
import { useNavItems } from './navItems'

/**
 * Barra lateral (tela larga, a partir de `md`): título, cadastrar e navegação. Fica escondida no
 * celular (ver `SidebarNav`). Reaproveitada pelo `AppLayout` e pela tela de cadastro, que fica fora
 * dele de propósito (tela cheia no celular, com a própria seta de voltar).
 */
export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const navItems = useNavItems()

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
            selected={location.pathname === item.to}
            onClick={() => navigate(item.to)}
            sx={{ borderRadius: 2, mb: 0.5 }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontWeight: 600 } } }} />
          </ListItemButton>
        ))}
      </List>
    </SidebarNav>
  )
}
