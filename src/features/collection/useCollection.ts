import { useQuery } from '@tanstack/react-query'
import { fetchCollection } from './api'

export function useCollection(query: string) {
  return useQuery({
    queryKey: ['collection', query.trim()],
    queryFn: () => fetchCollection(query),
  })
}
