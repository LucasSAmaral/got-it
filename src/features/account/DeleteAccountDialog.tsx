import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material'
import { useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import { deleteMyAccount } from './api'

/** Palavra a digitar para liberar o botão: apagar a conta não tem volta. */
const CONFIRMATION_WORD = 'apagar'

/**
 * Confirma a exclusão da conta. Montado só enquanto está aberto, então a confirmação digitada começa
 * vazia a cada vez. Sem conexão o botão fica desligado, como no Sair.
 */
export function DeleteAccountDialog({ onClose, onDeleted }: { onClose: () => void; onDeleted: () => void }) {
  const { session, offlineAccess } = useAuth()
  const [confirmation, setConfirmation] = useState('')
  const [status, setStatus] = useState<'idle' | 'pending' | 'error'>('idle')
  const offline = offlineAccess || !navigator.onLine
  const confirmed = confirmation.trim().toLowerCase() === CONFIRMATION_WORD

  async function handleDelete() {
    setStatus('pending')
    try {
      await deleteMyAccount()
      onDeleted()
    } catch {
      setStatus('error')
    }
  }

  return (
    <Dialog open onClose={status === 'pending' ? undefined : onClose}>
      <DialogTitle>Apagar sua conta</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <DialogContentText>
            Sua conta ({session?.user.email}) e sua coleção serão apagadas para sempre, em todos os aparelhos. As
            edições e capas que você cadastrou continuam no catálogo, sem o seu nome.
          </DialogContentText>
          <TextField
            label={`Digite "${CONFIRMATION_WORD}" para confirmar`}
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            disabled={status === 'pending'}
            autoComplete="off"
            fullWidth
          />
          {offline && <Alert severity="warning">Sem conexão agora. Conecte-se para apagar a conta.</Alert>}
          {status === 'error' && (
            <Alert severity="error">Não deu para apagar agora. Confira a conexão e tente de novo.</Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={status === 'pending'}>
          Cancelar
        </Button>
        <Button color="error" disabled={offline || !confirmed || status === 'pending'} onClick={handleDelete}>
          {status === 'pending' ? 'Apagando…' : 'Apagar conta'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
