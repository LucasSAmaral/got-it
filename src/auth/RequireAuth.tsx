import { Navigate, Outlet } from 'react-router-dom'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { useAuth } from './useAuth'

export function RequireAuth() {
  const { session, loading, offlineAccess } = useAuth()

  if (loading) {
    return <LoadingSpinner sx={{ height: '100%', alignItems: 'center' }} />
  }

  if (!session && !offlineAccess) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
