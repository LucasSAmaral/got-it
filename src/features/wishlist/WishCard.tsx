import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
} from '@mui/material'
import { useState } from 'react'
import { EditionCard } from '../../components/EditionCard'
import { AddToCollectionButton } from '../series/AddToCollectionButton'
import type { WishItem } from '../../types/catalog'
import { useRemoveWish } from './useWishlist'

/**
 * Cartão de um item da lista de desejos, que abre a página da edição, com a lixeira e "Adicionar à coleção" (para quando a pessoa comprou: o
 * exemplar entra e o banco tira o item da lista). Os dois somem quando a lista vem da cópia offline.
 */
export function WishCard({ item, showActions }: { item: WishItem; showActions: boolean }) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const removeWish = useRemoveWish()

  function close() {
    if (removeWish.isPending) return
    setConfirmOpen(false)
    removeWish.reset()
  }

  return (
    <EditionCard
      edition={item}
      // Sem sinal não abre: a página da edição consulta o catálogo, que não fica no aparelho.
      to={showActions ? `/edicao/${item.edition_id}` : undefined}
      actionPlacement="corner"
      footer={
        showActions && (
          // À direita, como no cartão da página da série (lá o "Quero esse" ocupa a esquerda).
          <Box sx={{ ml: 'auto' }}>
            <AddToCollectionButton
              edition={{ id: item.edition_id, title: item.title, publisher: item.publisher, volume: item.volume }}
              fromWishlist
            />
          </Box>
        )
      }
      action={
        showActions && (
          <>
            <IconButton
              aria-label="Tirar da lista de desejos"
              size="small"
              onClick={() => setConfirmOpen(true)}
              sx={{ color: 'text.secondary' }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>

            {/* Confirma porque a lista é mostrada no balcão: um toque sem querer não pode sumir com um item. */}
            <Dialog open={confirmOpen} onClose={close}>
              <DialogTitle>Tirar da lista?</DialogTitle>
              <DialogContent>
                <DialogContentText>"{item.title}" sai da sua lista de desejos.</DialogContentText>
                {removeWish.isError && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    Não deu para tirar. Confira a internet e tente de novo.
                  </Alert>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={close} color="inherit" disabled={removeWish.isPending}>
                  Cancelar
                </Button>
                <Button
                  color="error"
                  disabled={removeWish.isPending}
                  onClick={() => removeWish.mutate(item.wish_id, { onSuccess: () => setConfirmOpen(false) })}
                >
                  {removeWish.isPending ? 'Tirando…' : 'Tirar'}
                </Button>
              </DialogActions>
            </Dialog>
          </>
        )
      }
    />
  )
}
