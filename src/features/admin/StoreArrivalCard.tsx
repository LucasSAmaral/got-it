import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
} from '@mui/material'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { EditionCard } from '../../components/EditionCard'
import { formatArrival } from '../../lib/format'
import { deleteArrival, type StoreArrival } from '../store/api'

/** Uma chegada na lista do admin, com a lixeira para desfazer um registro feito por engano. */
export function StoreArrivalCard({ arrival }: { arrival: StoreArrival }) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const queryClient = useQueryClient()
  const remove = useMutation({
    mutationFn: () => deleteArrival(arrival.id),
    onSuccess: () => {
      setConfirmOpen(false)
      queryClient.invalidateQueries({ queryKey: ['store-arrivals'] })
    },
  })

  return (
    <EditionCard
      edition={arrival.edition}
      detail={formatArrival(arrival.arrived_on, arrival.price)}
      action={
        <>
          <IconButton
            aria-label={`Remover a chegada de "${arrival.edition.title}"`}
            size="small"
            onClick={() => setConfirmOpen(true)}
            sx={{ alignSelf: 'flex-start', color: 'text.secondary' }}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>

          <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
            <DialogTitle>Remover chegada?</DialogTitle>
            <DialogContent>
              <DialogContentText>
                "{arrival.edition.title}" sai da vitrine da loja. A edição continua no catálogo.
              </DialogContentText>
              {remove.isError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  Não deu para remover agora. Tenta de novo.
                </Alert>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setConfirmOpen(false)} color="inherit">
                Cancelar
              </Button>
              <Button color="error" disabled={remove.isPending} onClick={() => remove.mutate()}>
                {remove.isPending ? 'Removendo…' : 'Remover'}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      }
    />
  )
}
