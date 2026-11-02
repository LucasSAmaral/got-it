import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MIRROR_RETRY_MS } from '../collection/useCollection'
import { addWish, fetchWishlist, removeWish } from './api'

export const WISHLIST_KEY = ['wishlist']

/** A lista de desejos (com a cópia offline). O `AppLayout` a mantém carregada para a cópia estar em dia no balcão. */
export function useWishlist() {
  return useQuery({
    queryKey: WISHLIST_KEY,
    queryFn: fetchWishlist,
    refetchInterval: (q) => (q.state.data?.fromMirror ? MIRROR_RETRY_MS : false),
  })
}

export function useAddWish() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: addWish,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: WISHLIST_KEY }),
  })
}

export function useRemoveWish() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: removeWish,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: WISHLIST_KEY }),
  })
}
