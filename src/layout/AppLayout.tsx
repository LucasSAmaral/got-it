import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import { Box, BottomNavigation, BottomNavigationAction, Paper } from '@mui/material'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useCollection } from '../features/collection/useCollection'

export function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const value = location.pathname === '/eu-tenho' ? '/eu-tenho' : '/'

  // Carrega a lista completa em qualquer aba do app: é ela que atualiza a cópia usada offline.
  useCollection('')

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ flex: 1, overflowY: 'auto', pb: 8 }}>
        <Outlet />
      </Box>
      <Paper elevation={0} sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, borderTop: 1, borderColor: 'divider' }}>
        <BottomNavigation
          showLabels
          value={value}
          onChange={(_event, newValue: string) => navigate(newValue)}
        >
          <BottomNavigationAction label="Coleção" value="/" icon={<GridViewOutlinedIcon />} />
          <BottomNavigationAction label="Eu tenho?" value="/eu-tenho" icon={<SearchOutlinedIcon />} />
        </BottomNavigation>
      </Paper>
    </Box>
  )
}
