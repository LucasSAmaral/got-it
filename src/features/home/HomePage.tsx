import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import { Alert, Box, Button, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { EditionCard } from '../../components/EditionCard'
import { EditionGrid } from '../../components/EditionGrid'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { NarrationTitle } from '../../components/NarrationTitle'
import { arrivalsSummary, groupArrivalsByEdition, type EditionArrivals } from '../../lib/arrivals'
import { ARRIVAL_WINDOW_DAYS, fetchRecentArrivalsAllStores, type ArrivalWithStore } from '../store/api'
import { OwnershipChip } from '../store/OwnershipChip'
import { useOwnedEditionIds } from '../store/useOwnedEditionIds'
import { ArrivalStoresDialog } from '../store/ArrivalStoresDialog'
import { Hero, Purpose, PurposeGrid } from './HomePage.styles'

/** Os dois propósitos do app, explicados para quem chega sem conta. */
const PURPOSES = [
  {
    title: 'Sua coleção',
    text: 'Cadastre seus gibis pelo código de barras e tenha a coleção inteira no bolso. Na loja, o "Eu tenho?" responde em segundos se você já tem aquele número, mesmo sem sinal.',
  },
  {
    title: 'Novidades nas lojas',
    text: 'As lojas de quadrinhos registram aqui o que acabou de chegar. Veja os lançamentos, em que loja tem cada um e reserve direto com ela.',
  },
]

/**
 * Início (`/`), aberto também sem conta: explica o app para quem chega pela primeira vez e mostra o que
 * chegou nas lojas. Logado, ganha o atalho do "Eu tenho?" e os selos "Tenho" / "Falta esse".
 */
export function HomePage() {
  const { session, offlineAccess } = useAuth()
  const loggedIn = !!session || offlineAccess
  const [selected, setSelected] = useState<EditionArrivals<ArrivalWithStore> | null>(null)

  const arrivalsQuery = useQuery({
    queryKey: ['store-arrivals', 'all'],
    queryFn: () => fetchRecentArrivalsAllStores(),
    select: groupArrivalsByEdition,
  })
  const groups = arrivalsQuery.data
  const owned = useOwnedEditionIds(groups?.map((group) => group.edition.id) ?? [])

  return (
    <Box sx={{ px: { xs: 2.5, md: 5 }, py: { xs: 4, md: 5 } }}>
      {loggedIn ? (
        <Stack spacing={2} sx={{ mb: 5, alignItems: 'flex-start' }}>
          <Typography variant="h2">Vai comprar?</Typography>
          <Typography variant="body2" color="text.secondary">
            Confira se já tem antes de pagar, ou veja abaixo o que chegou nas lojas.
          </Typography>
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1.5 }}>
            <Button component={Link} to="/eu-tenho" variant="contained" size="large" startIcon={<SearchOutlinedIcon />}>
              Eu tenho?
            </Button>
            <Button component={Link} to="/colecao" variant="outlined" color="inherit" size="large" startIcon={<GridViewOutlinedIcon />}>
              Sua coleção
            </Button>
          </Stack>
        </Stack>
      ) : (
        <Hero>
          <Typography variant="h2">Controle sua coleção de quadrinhos e acompanhe o que chega nas lojas.</Typography>
          <PurposeGrid>
            {PURPOSES.map((purpose) => (
              <Purpose key={purpose.title}>
                <NarrationTitle component="h3">{purpose.title}</NarrationTitle>
                <Typography variant="body1">{purpose.text}</Typography>
              </Purpose>
            ))}
          </PurposeGrid>
        </Hero>
      )}

      <NarrationTitle>Chegou nas lojas</NarrationTitle>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, mb: 3 }}>
        Lançamentos dos últimos {ARRIVAL_WINDOW_DAYS} dias. Toque no gibi para ver onde chegou e reservar.
      </Typography>

      {arrivalsQuery.isLoading && <LoadingSpinner size={24} sx={{ py: 3 }} />}
      {arrivalsQuery.isError && (
        <Alert severity={navigator.onLine ? 'error' : 'info'}>
          {navigator.onLine
            ? 'Não deu para carregar os lançamentos agora.'
            : 'Sem conexão. Os lançamentos das lojas aparecem quando a internet voltar; o "Eu tenho?" funciona assim mesmo.'}
        </Alert>
      )}
      {groups?.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
          Nenhum lançamento nos últimos {ARRIVAL_WINDOW_DAYS} dias.
        </Typography>
      )}

      <EditionGrid>
        {groups?.map((group) => (
          <EditionCard
            key={group.edition.id}
            edition={group.edition}
            detail={arrivalsSummary(group.arrivals)}
            onClick={() => setSelected(group)}
            action={owned && <OwnershipChip has={owned.has(group.edition.id)} />}
          />
        ))}
      </EditionGrid>

      <ArrivalStoresDialog group={selected} onClose={() => setSelected(null)} />
    </Box>
  )
}
