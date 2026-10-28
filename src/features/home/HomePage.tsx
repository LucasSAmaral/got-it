import QrCodeScannerOutlinedIcon from '@mui/icons-material/QrCodeScannerOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined'
import { Alert, Box, Button, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { EditionCard } from '../../components/EditionCard'
import { EditionGrid } from '../../components/EditionGrid'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { arrivalsSummary, groupArrivalsByEdition, type EditionArrivals } from '../../lib/arrivals'
import { ARRIVAL_WINDOW_DAYS, fetchRecentArrivalsAllStores, type ArrivalWithStore } from '../store/api'
import { OwnershipChip } from '../store/OwnershipChip'
import { useOwnedEditionIds } from '../store/useOwnedEditionIds'
import { ArrivalStoresDialog } from './ArrivalStoresDialog'
import { Feature, FeatureList, Hero } from './HomePage.styles'

const FEATURES = [
  { icon: <QrCodeScannerOutlinedIcon />, text: 'Cadastre pelo código de barras: aponte a câmera e a edição vem preenchida.' },
  { icon: <SearchOutlinedIcon />, text: 'Pergunte "Eu tenho?" antes de pagar, mesmo sem sinal dentro da loja.' },
  { icon: <StorefrontOutlinedIcon />, text: 'Veja o que chegou nas lojas e reserve direto com elas.' },
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
          <Button component={Link} to="/eu-tenho" variant="contained" size="large" startIcon={<SearchOutlinedIcon />}>
            Eu tenho?
          </Button>
        </Stack>
      ) : (
        <Hero>
          <Typography variant="h2">Já tem esse gibi?</Typography>
          <Typography variant="body1" color="text.secondary">
            O Tem esse? guarda a sua coleção de quadrinhos e, na hora da compra, responde em segundos se você já
            tem aquele número. Nasceu de uma compra repetida.
          </Typography>
          <FeatureList>
            {FEATURES.map((feature) => (
              <Feature key={feature.text}>
                {feature.icon}
                <Typography variant="body2">{feature.text}</Typography>
              </Feature>
            ))}
          </FeatureList>
        </Hero>
      )}

      <Typography variant="h3">Chegou nas lojas</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
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
