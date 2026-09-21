import { Box, CircularProgress } from '@mui/material'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './useAuth'

export function RequireAuth() {
  const { session, loading, offlineAccess } = useAuth()

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!session && !offlineAccess) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
