import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material'
import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { supabase } from '../../lib/supabase'
import { LoginPageBox } from './LoginPage.styles'

type Mode = 'senha' | 'link'

const ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: 'E-mail ou senha incorretos.',
  email_not_confirmed: 'Confirme o e-mail antes de entrar.',
  over_email_send_rate_limit: 'Muitos e-mails enviados por enquanto. Espere um pouco ou entre com a senha.',
}

export function LoginPage() {
  const { session, loading } = useAuth()
  const [mode, setMode] = useState<Mode>('senha')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  if (!loading && session) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setStatus('sending')
    setErrorMessage('')

    const { error } =
      mode === 'senha'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })

    if (error) {
      setStatus('error')
      setErrorMessage((error.code && ERROR_MESSAGES[error.code]) || error.message)
      return
    }

    setStatus(mode === 'link' ? 'sent' : 'idle')
  }

  function switchMode() {
    setMode(mode === 'senha' ? 'link' : 'senha')
    setStatus('idle')
    setErrorMessage('')
  }

  return (
    <LoginPageBox>
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
          {mode === 'senha' ? (
            <TextField
              id="password"
              label="Senha"
              type="password"
              autoComplete="current-password"
              required
              fullWidth
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={status === 'sending'}
            />
          ) : (
            <Typography variant="caption" color="text.secondary">
              Vamos te mandar um link de acesso por e-mail. Sem senha.
            </Typography>
          )}
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
            {mode === 'senha'
              ? status === 'sending'
                ? 'Entrando…'
                : 'Entrar'
              : status === 'sending'
                ? 'Enviando…'
                : 'Enviar link de acesso'}
          </Button>
          <Button type="button" size="small" color="inherit" onClick={switchMode}>
            {mode === 'senha' ? 'Prefiro receber um link por e-mail' : 'Entrar com senha'}
          </Button>
        </Stack>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
        Ao continuar, você concorda em guardar sua coleção nesta conta.
      </Typography>
    </LoginPageBox>
  )
}
