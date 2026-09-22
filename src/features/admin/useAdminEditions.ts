import { useQuery } from '@tanstack/react-query'
import { searchEditions } from './api'

export function useAdminEditions(query: string) {
  return useQuery({
    queryKey: ['admin-editions', query.trim()],
    queryFn: () => searchEditions(query),
  })
}
