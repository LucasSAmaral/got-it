import InstagramIcon from '@mui/icons-material/Instagram'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import { Button, Snackbar } from '@mui/material'
import { useState } from 'react'
import { instagramUrl, reservationMessage, whatsappUrl } from '../../lib/reservation'
import type { Store, StoreArrival } from './api'

/**
 * A vitrine não sabe o que esgotou, então a conversa começa perguntando. Texto visível curto para caber ao
 * lado da loja no diálogo; o leitor de tela ouve a frase completa (`LABEL`, no aria-label).
 */
const LABEL = 'Perguntar se ainda tem'
const SHORT_LABEL = 'Ainda tem?'

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
        {SHORT_LABEL}
      </Button>
    )
  }

  if (store.instagram) {
    return (
      <>
        <Button
          component="a"
          href={instagramUrl(store.instagram, message)}
          target="_blank"
          rel="noopener"
          aria-label={`${LABEL}, pelo Instagram da ${store.name}`}
          variant="contained"
          size="small"
          startIcon={<InstagramIcon />}
          // O ?text= do direct não é oficial: copia antes de abrir, para a pessoa colar se o texto não vier.
          onClick={() => navigator.clipboard?.writeText(message).then(() => setCopied(true), () => {})}
        >
          {SHORT_LABEL}
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
