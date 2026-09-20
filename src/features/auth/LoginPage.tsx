import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material'
import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { supabase } from '../../lib/supabase'

export function LoginPage() {
  const { session, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  if (!loading && session) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setStatus('sending')
    setErrorMessage('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })

    if (error) {
      setStatus('error')
      setErrorMessage(error.message)
      return
    }

    setStatus('sent')
  }

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        px: 3,
        gap: 4,
      }}
    >
      <Stack spacing={1}>
        <Typography variant="h1" color="text.primary">
          Got it?
        </Typography>
        <Typography variant="body2" color="text.secondary">
          sua coleção de HQs, sempre à mão
        </Typography>
      </Stack>

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ bgcolor: 'background.paper', borderRadius: 3, p: 3, boxShadow: 1 }}
      >
        <Stack spacing={2}>
          <TextField
            id="email"
            label="E-mail"
            type="email"
            autoComplete="email"
            required
            fullWidth
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={status === 'sending' || status === 'sent'}
          />
          <Typography variant="caption" color="text.secondary">
            Vamos te mandar um link de acesso por e-mail. Sem senha.
          </Typography>
          {status === 'sent' && (
            <Alert severity="success">Link enviado. Confira sua caixa de entrada.</Alert>
          )}
          {status === 'error' && <Alert severity="error">{errorMessage}</Alert>}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={status === 'sending' || status === 'sent'}
          >
            {status === 'sending' ? 'Enviando…' : 'Enviar link de acesso'}
          </Button>
        </Stack>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
        Ao continuar, você concorda em guardar sua coleção nesta conta.
      </Typography>
    </Box>
  )
}
