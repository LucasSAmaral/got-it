import { useQuery } from '@tanstack/react-query'
import { fetchCollection } from './api'

// Enquanto a tela mostra a cópia salva, tenta o servidor de novo de tempos em tempos: com sinal ruim
// o navegador acha que está online e nenhum evento de reconexão dispara.
export const MIRROR_RETRY_MS = 15000

export function useCollection(query: string) {
  return useQuery({
    queryKey: ['collection', query.trim()],
    queryFn: () => fetchCollection(query),
    refetchInterval: (q) => (q.state.data?.fromMirror ? MIRROR_RETRY_MS : false),
  })
}
