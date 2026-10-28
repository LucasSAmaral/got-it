import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Link as MuiLink, Stack, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import { LargeCover } from '../../components/LargeCover'
import type { EditionArrivals } from '../../lib/arrivals'
import { formatArrival } from '../../lib/format'
import { tokens } from '../../theme'
import type { ArrivalWithStore } from './api'
import { ReserveButton } from './ReserveButton'

type ArrivalStoresDialogProps = {
  /** `null` fecha o diálogo. */
  group: EditionArrivals<ArrivalWithStore> | null
  onClose: () => void
  /** O nome da loja vira link para a vitrine dela. Desligado na própria vitrine, onde o link não levaria a lugar nenhum. */
  linkStores?: boolean
}

/**
 * Um gibi que chegou nas lojas: capa maior, editora e ISBN e, para cada loja, data, preço e o botão para
 * perguntar se ainda tem. Abre ao tocar no cartão no Início e na vitrine da loja.
 */
export function ArrivalStoresDialog({ group, onClose, linkStores = true }: ArrivalStoresDialogProps) {
  return (
    <Dialog open={group !== null} onClose={onClose} fullWidth maxWidth="xs">
      {group && (
        <>
          <DialogTitle>{group.edition.title}</DialogTitle>
          <DialogContent>
            <LargeCover coverUrl={group.edition.cover_url} title={group.edition.title} maxWidth={200} />
            <Stack spacing={0.25} sx={{ mt: 2.5, alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {[group.edition.publisher, group.edition.volume].filter(Boolean).join(' · ') || 'Editora não informada'}
              </Typography>
              {group.edition.isbn13 && (
                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: tokens.font.mono }}>
                  {group.edition.isbn13}
                </Typography>
              )}
            </Stack>

            <Stack spacing={2.5} sx={{ mt: 3 }}>
              {group.arrivals.map((arrival) => (
                <Stack key={arrival.id} spacing={1} sx={{ alignItems: 'flex-start' }}>
                  <div>
                    {linkStores ? (
                      <MuiLink component={Link} to={`/loja/${arrival.store.slug}`} underline="hover" sx={{ fontWeight: 600 }}>
                        {arrival.store.name}
                      </MuiLink>
                    ) : (
                      <Typography sx={{ fontWeight: 600 }}>{arrival.store.name}</Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      {formatArrival(arrival.arrived_on, arrival.price)}
                    </Typography>
                  </div>
                  <ReserveButton store={arrival.store} edition={group.edition} />
                </Stack>
              ))}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>Fechar</Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  )
}
