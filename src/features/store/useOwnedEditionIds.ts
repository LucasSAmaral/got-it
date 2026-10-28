import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../auth/useAuth'
import { fetchOwnedEditionIds } from './api'

/**
 * Quais dessas edições quem está logado tem, para "Tenho" / "Falta esse". Sem sessão não consulta
 * (`undefined`); se falhar, também fica `undefined` e a tela segue sem os selos.
 */
export function useOwnedEditionIds(editionIds: string[]): Set<string> | undefined {
  const { session } = useAuth()
  const { data } = useQuery({
    queryKey: ['store-owned', session?.user.id, editionIds],
    queryFn: () => fetchOwnedEditionIds(editionIds),
    enabled: !!session && editionIds.length > 0,
  })
  return data
}
