import { Alert, Box, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { EditionCard } from '../../components/EditionCard'
import { EditionGrid } from '../../components/EditionGrid'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { formatArrival } from '../../lib/format'
import { ARRIVAL_WINDOW_DAYS, fetchRecentArrivals, fetchStore } from './api'
import { OwnershipChip } from './OwnershipChip'
import { ReserveButton } from './ReserveButton'
import { CardActions } from './StorePage.styles'
import { useOwnedEditionIds } from './useOwnedEditionIds'

/**
 * Vitrine pública de uma loja (`/loja/:slug`): o que chegou nos últimos dias, para quem vem do link no
 * Instagram ou no grupo do WhatsApp, com ou sem conta. Logado, cada cartão diz se você já tem.
 */
export function StorePage() {
  const { slug = '' } = useParams()
  const { session } = useAuth()

  const storeQuery = useQuery({ queryKey: ['store', slug], queryFn: () => fetchStore(slug) })
  const store = storeQuery.data

  const arrivalsQuery = useQuery({
    queryKey: ['store-arrivals', store?.id],
    queryFn: () => fetchRecentArrivals(store!.id),
    enabled: !!store,
  })
  const arrivals = arrivalsQuery.data
  const owned = useOwnedEditionIds(arrivals?.map((arrival) => arrival.edition.id) ?? [])

  return (
    <Box sx={{ px: { xs: 2.5, md: 5 }, py: { xs: 4, md: 5 } }}>
      {storeQuery.isLoading && <LoadingSpinner size={28} sx={{ py: 4 }} />}
      {storeQuery.isError && <Alert severity="error">Não deu para abrir a vitrine agora. Tenta de novo daqui a pouco.</Alert>}
      {store === null && <Alert severity="info">Essa loja não existe.</Alert>}

      {store && (
        <>
          <Typography variant="h2">Chegou na {store.name}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
            Lançamentos dos últimos {ARRIVAL_WINDOW_DAYS} dias.
            {(store.whatsapp || store.instagram) && ' Para reservar, toque no ícone do cartão.'}
            {session && ' Os que faltam na sua coleção aparecem como "Falta esse".'}
          </Typography>

          {arrivalsQuery.isLoading && <LoadingSpinner size={24} sx={{ py: 3 }} />}
          {arrivalsQuery.isError && <Alert severity="error">Não deu para carregar os lançamentos agora.</Alert>}
          {arrivals?.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              Nenhum lançamento nos últimos {ARRIVAL_WINDOW_DAYS} dias.
            </Typography>
          )}

          <EditionGrid>
            {arrivals?.map((arrival) => (
              <EditionCard
                key={arrival.id}
                edition={arrival.edition}
                detail={formatArrival(arrival.arrived_on, arrival.price)}
                action={
                  <CardActions>
                    {owned && <OwnershipChip has={owned.has(arrival.edition.id)} />}
                    <ReserveButton store={store} edition={arrival.edition} />
                  </CardActions>
                }
              />
            ))}
          </EditionGrid>
        </>
      )}
    </Box>
  )
}
