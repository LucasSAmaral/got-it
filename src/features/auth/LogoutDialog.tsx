import { Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'
import { useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import { supabase } from '../../lib/supabase'

/**
 * Confirma a saída. Sair apaga a cópia offline (ver `SIGNED_OUT` no AuthProvider), então sem conexão o
 * botão fica desligado: não daria para entrar de novo nem consultar a coleção, justamente na loja.
 */
export function LogoutDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { offlineAccess } = useAuth()
  const [status, setStatus] = useState<'idle' | 'pending' | 'error'>('idle')
  const offline = offlineAccess || !navigator.onLine

  function close() {
    setStatus('idle')
    onClose()
  }

  async function handleLogout() {
    setStatus('pending')
    // Deu certo: o SIGNED_OUT limpa a cópia e o RequireAuth leva para o login, então não há o que fazer aqui.
    const { error } = await supabase.auth.signOut()
    if (error) setStatus('error')
  }

  return (
    <Dialog open={open} onClose={close}>
      <DialogTitle>Sair do Tem esse?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          A cópia da coleção salva neste aparelho será apagada. Para consultar sem sinal de novo, entre com internet
          e abra o app uma vez.
        </DialogContentText>
        {offline && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Sem conexão agora. Conecte-se para sair.
          </Alert>
        )}
        {status === 'error' && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Não deu para sair agora. Confira a conexão e tente de novo.
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={close} color="inherit">
          Cancelar
        </Button>
        <Button color="error" disabled={offline || status === 'pending'} onClick={handleLogout}>
          {status === 'pending' ? 'Saindo…' : 'Sair'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
