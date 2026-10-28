import InstagramIcon from '@mui/icons-material/Instagram'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import { Alert, Button, Chip, IconButton, Snackbar, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { EditionCard } from '../../components/EditionCard'
import { EditionGrid } from '../../components/EditionGrid'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { formatArrival } from '../../lib/format'
import { instagramUrl, reservationMessage, whatsappUrl } from '../../lib/reservation'
import {
  ARRIVAL_WINDOW_DAYS,
  fetchOwnedEditionIds,
  fetchRecentArrivals,
  fetchStore,
  type Store,
  type StoreArrival,
} from './api'
import { CardActions, StoreHeader, StorePageContent, StorePageRoot } from './StorePage.styles'

/** Botão de reserva pelo canal que a loja tiver; nenhum quando ela ainda não informou contato. */
function ReserveButton({ store, arrival, onCopied }: { store: Store; arrival: StoreArrival; onCopied: () => void }) {
  const message = reservationMessage(arrival.edition, store.name)

  if (store.whatsapp) {
    return (
      <IconButton
        component="a"
        href={whatsappUrl(store.whatsapp, message)}
        target="_blank"
        rel="noopener"
        aria-label={`Reservar "${arrival.edition.title}" pelo WhatsApp`}
        size="small"
        color="success"
      >
        <WhatsAppIcon fontSize="small" />
      </IconButton>
    )
  }

  if (store.instagram) {
    return (
      <IconButton
        component="a"
        href={instagramUrl(store.instagram)}
        target="_blank"
        rel="noopener"
        aria-label={`Reservar "${arrival.edition.title}" pelo Instagram`}
        size="small"
        // O direct não aceita texto pronto: copia antes de abrir, para a pessoa só colar.
        onClick={() => navigator.clipboard?.writeText(message).then(onCopied, () => {})}
      >
        <InstagramIcon fontSize="small" />
      </IconButton>
    )
  }

  return null
}

/**
 * Vitrine pública de uma loja (`/loja/:slug`): o que chegou nos últimos dias, para quem vem do link no
 * Instagram ou no grupo do WhatsApp, com ou sem conta. Logado, cada cartão diz se você já tem.
 */
export function StorePage() {
  const { slug = '' } = useParams()
  const { session } = useAuth()
  const [copied, setCopied] = useState(false)

  const storeQuery = useQuery({ queryKey: ['store', slug], queryFn: () => fetchStore(slug) })
  const store = storeQuery.data

  const arrivalsQuery = useQuery({
    queryKey: ['store-arrivals', store?.id],
    queryFn: () => fetchRecentArrivals(store!.id),
    enabled: !!store,
  })
  const arrivals = arrivalsQuery.data

  const editionIds = arrivals?.map((arrival) => arrival.edition.id) ?? []
  // Se falhar, a vitrine continua, só sem "Tenho" / "Falta esse".
  const ownedQuery = useQuery({
    queryKey: ['store-owned', session?.user.id, editionIds],
    queryFn: () => fetchOwnedEditionIds(editionIds),
    enabled: !!session && editionIds.length > 0,
  })
  const owned = ownedQuery.data

  return (
    <StorePageRoot>
      <StorePageContent>
        <StoreHeader>
          <Typography variant="h3" component={Link} to="/" sx={{ color: 'primary.main', textDecoration: 'none' }}>
            Tem esse?
          </Typography>
          {session ? (
            <Button component={Link} to="/" color="inherit">
              Minha coleção
            </Button>
          ) : (
            <Button component={Link} to={`/login?voltar=/loja/${slug}`} color="inherit">
              Entrar
            </Button>
          )}
        </StoreHeader>

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
              {arrivals?.map((arrival) => {
                const has = owned?.has(arrival.edition.id)
                return (
                  <EditionCard
                    key={arrival.id}
                    edition={arrival.edition}
                    detail={formatArrival(arrival.arrived_on, arrival.price)}
                    action={
                      <CardActions>
                        {has !== undefined && (
                          <Chip
                            size="small"
                            label={has ? 'Tenho' : 'Falta esse'}
                            color={has ? 'success' : 'warning'}
                            variant={has ? 'filled' : 'outlined'}
                          />
                        )}
                        <ReserveButton store={store} arrival={arrival} onCopied={() => setCopied(true)} />
                      </CardActions>
                    }
                  />
                )
              })}
            </EditionGrid>

            {!session && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 5 }}>
                O Tem esse? cataloga coleções de quadrinhos e responde, na hora da compra, se você já tem um gibi.
              </Typography>
            )}
          </>
        )}
      </StorePageContent>

      <Snackbar
        open={copied}
        autoHideDuration={4000}
        onClose={() => setCopied(false)}
        message="Mensagem copiada. É só colar no direct."
      />
    </StorePageRoot>
  )
}
