import LogoutIcon from '@mui/icons-material/Logout'
import { Divider, Drawer, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogoutDialog } from '../features/auth/LogoutDialog'
import { tokens } from '../theme'
import type { NavItem } from './navItems'

type MoreMenuProps = {
  open: boolean
  onClose: () => void
  /** Itens que não cabem na barra inferior (Séries, Editar catálogo). */
  items: NavItem[]
  active: NavItem | undefined
}

/**
 * "Mais" da barra inferior do celular: abre de baixo com o resto da navegação e o Sair. O Sair fica aqui,
 * fora da barra, onde um toque sem querer é fácil; e ainda pede confirmação.
 */
export function MoreMenu({ open, onClose, items, active }: MoreMenuProps) {
  const navigate = useNavigate()
  const [logoutOpen, setLogoutOpen] = useState(false)

  return (
    <>
      <Drawer anchor="bottom" open={open} onClose={onClose} slotProps={{ paper: { sx: { borderTop: tokens.panel.border } } }}>
        <List sx={{ pb: 2 }}>
          {items.map((item) => (
            <ListItemButton
              key={item.to}
              selected={item === active}
              onClick={() => {
                onClose()
                navigate(item.to)
              }}
            >
              <ListItemIcon sx={{ color: 'inherit' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontWeight: 600 } } }} />
            </ListItemButton>
          ))}
          <Divider sx={{ my: 1 }} />
          <ListItemButton
            onClick={() => {
              onClose()
              setLogoutOpen(true)
            }}
          >
            <ListItemIcon sx={{ color: 'inherit' }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Sair" slotProps={{ primary: { sx: { fontWeight: 600 } } }} />
          </ListItemButton>
        </List>
      </Drawer>
      <LogoutDialog open={logoutOpen} onClose={() => setLogoutOpen(false)} />
    </>
  )
}
