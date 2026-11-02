import FavoriteIcon from '@mui/icons-material/Favorite'
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined'
import { Button } from '@mui/material'
import { useAddWish, useRemoveWish, useWishlist } from './useWishlist'

/**
 * Põe ou tira uma edição da lista de desejos com um toque (ex.: edições que você não tem, na página da série).
 * Fora da lista: "♡ Quero esse"; na lista: "♥ Na lista", e outro toque tira, sem confirmação (o estado está à
 * vista e outro toque desfaz). Com texto, e não só o coração: sozinho, ele se lê como "curtir".
 */
export function WishToggleButton({ editionId }: { editionId: string }) {
  const wishlist = useWishlist()
  const addWish = useAddWish()
  const removeWish = useRemoveWish()
  const wish = wishlist.data?.items.find((item) => item.edition_id === editionId)
  // Enquanto a lista atualiza depois de um toque, não aceita outro (evita adicionar e tirar ao mesmo tempo).
  const busy = addWish.isPending || removeWish.isPending || wishlist.isFetching

  return (
    <Button
      size="small"
      aria-label={wish ? 'Na lista de desejos. Tocar tira da lista' : 'Quero esse: adicionar à lista de desejos'}
      aria-pressed={!!wish}
      startIcon={wish ? <FavoriteIcon /> : <FavoriteBorderOutlinedIcon />}
      disabled={busy || !wishlist.data || wishlist.data.fromMirror}
      onClick={() => (wish ? removeWish.mutate(wish.wish_id) : addWish.mutate(editionId))}
    >
      {wish ? 'Na lista' : 'Quero esse'}
    </Button>
  )
}
