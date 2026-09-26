import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined'
import {
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
import type { CollectionItem } from '../../types/catalog'
import { useDeleteCopy } from './useDeleteCopy'

export function CollectionItemCard({ item, showDelete = false }: { item: CollectionItem; showDelete?: boolean }) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const deleteCopy = useDeleteCopy()

  return (
    <EditionCard
      edition={item}
      to={`/exemplar/${item.copy_id}`}
      action={
        showDelete && (
          <>
            <IconButton
              aria-label="Remover exemplar da coleção"
              size="small"
              onClick={() => setConfirmOpen(true)}
              sx={{ alignSelf: 'flex-start', color: 'text.secondary' }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>

            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
              <DialogTitle>Remover exemplar?</DialogTitle>
              <DialogContent>
                <DialogContentText>
                  "{item.title}" sai da sua coleção. A edição continua no catálogo pra outras pessoas.
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setConfirmOpen(false)} color="inherit">
                  Cancelar
                </Button>
                <Button
                  color="error"
                  disabled={deleteCopy.isPending}
                  onClick={() => {
                    deleteCopy.mutate(item.copy_id, { onSuccess: () => setConfirmOpen(false) })
                  }}
                >
                  {deleteCopy.isPending ? 'Removendo…' : 'Remover'}
                </Button>
              </DialogActions>
            </Dialog>
          </>
        )
      }
    />
  )
}
