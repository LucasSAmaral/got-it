import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Link as MuiLink, List, ListItem, ListItemText } from '@mui/material'
import { Link } from 'react-router-dom'
import type { EditionArrivals } from '../../lib/arrivals'
import { formatArrival } from '../../lib/format'
import type { ArrivalWithStore } from '../store/api'
import { ReserveButton } from '../store/ReserveButton'

type ArrivalStoresDialogProps = {
  /** `null` fecha o diálogo. */
  group: EditionArrivals<ArrivalWithStore> | null
  onClose: () => void
}

/** Em quais lojas o gibi chegou: data, preço, link para a vitrine e o botão de reserva de cada uma. */
export function ArrivalStoresDialog({ group, onClose }: ArrivalStoresDialogProps) {
  return (
    <Dialog open={group !== null} onClose={onClose} fullWidth maxWidth="xs">
      {group && (
        <>
          <DialogTitle>{group.edition.title}</DialogTitle>
          <DialogContent sx={{ px: 1 }}>
            <List disablePadding>
              {group.arrivals.map((arrival) => (
                <ListItem key={arrival.id} secondaryAction={<ReserveButton store={arrival.store} edition={group.edition} />}>
                  <ListItemText
                    primary={
                      <MuiLink component={Link} to={`/loja/${arrival.store.slug}`} underline="hover" sx={{ fontWeight: 600 }}>
                        {arrival.store.name}
                      </MuiLink>
                    }
                    secondary={formatArrival(arrival.arrived_on, arrival.price)}
                  />
                </ListItem>
              ))}
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>Fechar</Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  )
}
