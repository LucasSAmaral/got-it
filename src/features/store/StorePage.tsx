import { Alert, Box, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { EditionCard } from '../../components/EditionCard'
import { EditionGrid } from '../../components/EditionGrid'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { formatArrival } from '../../lib/format'
import type { EditionArrivals } from '../../lib/arrivals'
import { ARRIVAL_WINDOW_DAYS, fetchRecentArrivals, fetchStore, type ArrivalWithStore } from './api'
import { ArrivalStoresDialog } from './ArrivalStoresDialog'
import { OwnershipChip } from './OwnershipChip'
import { useOwnedEditionIds } from './useOwnedEditionIds'

/**
 * Vitrine pública de uma loja (`/loja/:slug`): o que chegou nos últimos dias, para quem vem do link no
 * Instagram ou no grupo do WhatsApp, com ou sem conta. Logado, cada cartão diz se você já tem.
 */
export function StorePage() {
  const { slug = '' } = useParams()
  const { session } = useAuth()
  const [selected, setSelected] = useState<EditionArrivals<ArrivalWithStore> | null>(null)

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
            {store.whatsapp || store.instagram
              ? ' Toque no gibi para ver a capa e perguntar à loja se ainda tem.'
              : ' Toque no gibi para ver a capa maior.'}
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
                // O diálogo é o mesmo do Início, aqui com uma loja só.
                onClick={() => setSelected({ edition: arrival.edition, arrivals: [{ ...arrival, store }] })}
                action={owned && <OwnershipChip has={owned.has(arrival.edition.id)} />}
              />
            ))}
          </EditionGrid>

          <ArrivalStoresDialog group={selected} onClose={() => setSelected(null)} linkStores={false} />
        </>
      )}
    </Box>
  )
}
