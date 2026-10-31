import AddIcon from '@mui/icons-material/Add'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { addCopyToExistingEdition } from '../register/api'
import type { SeriesEdition } from './api'

type AddToCollectionButtonProps = {
  edition: Pick<SeriesEdition, 'id' | 'title' | 'publisher' | 'volume'>
}

/**
 * "Adicionar" no cartão de uma edição que você não tem, na página da série: confirma e cria o exemplar sem
 * passar pelo cadastro, porque a edição já está no catálogo. Estado, data e preço ficam vazios e se completam
 * depois no detalhe do exemplar. A confirmação existe para um toque sem querer não pôr na coleção um gibi que
 * você não tem (e o "Eu tenho?" passaria a responder "Já tem").
 */
export function AddToCollectionButton({ edition }: AddToCollectionButtonProps) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const addCopy = useMutation({
    mutationFn: () => addCopyToExistingEdition(edition.id, { condition: '', acquiredAt: '', pricePaid: '' }),
    onSuccess: () => {
      setOpen(false)
      // A página da série troca o selo para "Tenho"; o resto atualiza a coleção (e a cópia offline) e as contagens.
      for (const key of ['series', 'series-list', 'collection', 'check', 'store-owned']) {
        queryClient.invalidateQueries({ queryKey: [key] })
      }
    },
  })
  const subtitle = [edition.publisher, edition.volume].filter(Boolean).join(' · ')

  function close() {
    if (addCopy.isPending) return
    setOpen(false)
    addCopy.reset()
  }

  return (
    <>
      <Button size="small" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
        Adicionar
      </Button>

      <Dialog open={open} onClose={close}>
        <DialogTitle>Você tem esta edição?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            "{edition.title}"{subtitle && ` (${subtitle})`} vai para a sua coleção. Estado, data e preço você
            completa depois, no detalhe do exemplar.
          </DialogContentText>
          {addCopy.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Não deu para adicionar. Confira a internet e tente de novo.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={close} color="inherit" disabled={addCopy.isPending}>
            Cancelar
          </Button>
          <Button variant="contained" disabled={addCopy.isPending} onClick={() => addCopy.mutate()}>
            {addCopy.isPending ? 'Adicionando…' : 'Tenho, adicionar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
