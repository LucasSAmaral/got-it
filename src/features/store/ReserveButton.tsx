import InstagramIcon from '@mui/icons-material/Instagram'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import { IconButton, Snackbar } from '@mui/material'
import { useState } from 'react'
import { instagramUrl, reservationMessage, whatsappUrl } from '../../lib/reservation'
import type { Store, StoreArrival } from './api'

/**
 * Botão de reserva pelo canal que a loja tiver; nenhum quando ela ainda não informou contato. Usado na
 * vitrine da loja e na lista de lojas do Início.
 */
export function ReserveButton({ store, edition }: { store: Store; edition: StoreArrival['edition'] }) {
  const [copied, setCopied] = useState(false)
  const message = reservationMessage(edition, store.name)

  if (store.whatsapp) {
    return (
      <IconButton
        component="a"
        href={whatsappUrl(store.whatsapp, message)}
        target="_blank"
        rel="noopener"
        aria-label={`Reservar "${edition.title}" na ${store.name} pelo WhatsApp`}
        size="small"
        color="success"
      >
        <WhatsAppIcon fontSize="small" />
      </IconButton>
    )
  }

  if (store.instagram) {
    return (
      <>
        <IconButton
          component="a"
          href={instagramUrl(store.instagram)}
          target="_blank"
          rel="noopener"
          aria-label={`Reservar "${edition.title}" na ${store.name} pelo Instagram`}
          size="small"
          // O direct não aceita texto pronto: copia antes de abrir, para a pessoa só colar.
          onClick={() => navigator.clipboard?.writeText(message).then(() => setCopied(true), () => {})}
        >
          <InstagramIcon fontSize="small" />
        </IconButton>
        <Snackbar
          open={copied}
          autoHideDuration={4000}
          onClose={() => setCopied(false)}
          message="Mensagem copiada. É só colar no direct."
        />
      </>
    )
  }

  return null
}
