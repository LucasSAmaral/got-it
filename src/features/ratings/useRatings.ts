import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchEditionRatingStats, fetchMyRating, fetchSeriesRatingStats, removeMyRating, saveMyRating } from './api'

/** A sua nota da edição. Só online: a nota não fica na cópia do aparelho. */
export function useMyRating(editionId: string) {
  return useQuery({
    queryKey: ['my-rating', editionId],
    queryFn: () => fetchMyRating(editionId),
    enabled: navigator.onLine,
    retry: false,
  })
}

/**
 * Média e contagem das edições pedidas. A chave leva os ids ordenados, para a mesma lista em outra ordem
 * aproveitar o cache. Falhar aqui não derruba a tela: a média só não aparece.
 */
export function useEditionRatingStats(editionIds: string[]) {
  const ids = [...editionIds].sort()
  return useQuery({
    queryKey: ['edition-rating-stats', ids],
    queryFn: () => fetchEditionRatingStats(ids),
    enabled: navigator.onLine && ids.length > 0,
    retry: false,
  })
}

export function useSeriesRatingStats() {
  return useQuery({
    queryKey: ['series-rating-stats'],
    queryFn: fetchSeriesRatingStats,
    enabled: navigator.onLine,
    retry: false,
  })
}

/**
 * Dar, mudar ou tirar a sua nota (`stars` `null` tira). Depois atualiza as médias e, como avaliar marca o
 * exemplar como lido (gatilho no banco), o detalhe, a coleção e o "Eu tenho?".
 */
export function useSetMyRating(editionId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (stars: number | null) => (stars === null ? removeMyRating(editionId) : saveMyRating(editionId, stars)),
    onSuccess: () =>
      Promise.all(
        ['my-rating', 'edition-rating-stats', 'series-rating-stats', 'copy-detail', 'collection', 'check'].map((key) =>
          queryClient.invalidateQueries({ queryKey: [key] }),
        ),
      ),
  })
}
