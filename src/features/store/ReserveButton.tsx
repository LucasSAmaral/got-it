import InstagramIcon from '@mui/icons-material/Instagram'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import { Button, Snackbar } from '@mui/material'
import { useState } from 'react'
import { instagramUrl, reservationMessage, whatsappUrl } from '../../lib/reservation'
import type { Store, StoreArrival } from './api'

/** Texto do botão: a vitrine não sabe o que esgotou, então a conversa começa perguntando. */
const LABEL = 'Perguntar se ainda tem'

/**
 * Botão de reserva pelo canal que a loja tiver; nenhum quando ela ainda não informou contato. Usado no
 * diálogo das chegadas (vitrine da loja e Início).
 */
export function ReserveButton({ store, edition }: { store: Store; edition: StoreArrival['edition'] }) {
  const [copied, setCopied] = useState(false)
  const message = reservationMessage(edition, store.name)

  if (store.whatsapp) {
    return (
      <Button
        component="a"
        href={whatsappUrl(store.whatsapp, message)}
        target="_blank"
        rel="noopener"
        aria-label={`${LABEL}, pelo WhatsApp da ${store.name}`}
        variant="contained"
        color="success"
        size="small"
        startIcon={<WhatsAppIcon />}
      >
        {LABEL}
      </Button>
    )
  }

  if (store.instagram) {
    return (
      <>
        <Button
          component="a"
          href={instagramUrl(store.instagram)}
          target="_blank"
          rel="noopener"
          aria-label={`${LABEL}, pelo Instagram da ${store.name}`}
          variant="contained"
          size="small"
          startIcon={<InstagramIcon />}
          // O direct não aceita texto pronto: copia antes de abrir, para a pessoa só colar.
          onClick={() => navigator.clipboard?.writeText(message).then(() => setCopied(true), () => {})}
        >
          {LABEL}
        </Button>
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
