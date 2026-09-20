import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { fetchCollection } from '../collection/api'

function useDebouncedValue(value: string, delayMs: number) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}

export function useCheck(term: string) {
  const debouncedTerm = useDebouncedValue(term, 300).trim()

  const query = useQuery({
    queryKey: ['check', debouncedTerm],
    queryFn: () => fetchCollection(debouncedTerm),
    enabled: debouncedTerm.length > 0,
  })

  return { ...query, debouncedTerm }
}
