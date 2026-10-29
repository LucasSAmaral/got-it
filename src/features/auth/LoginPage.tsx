import { Alert, Button, Stack, TextField, Typography } from '@mui/material'
import { useState, type FormEvent } from 'react'
import { Link as RouterLink, Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { authErrorMessage, safeNextPath } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { AuthPage } from './AuthPage'
import { AuthFormCard } from './AuthPage.styles'

type Mode = 'senha' | 'link'

export function LoginPage() {
  const { session, loading } = useAuth()
  const [mode, setMode] = useState<Mode>('senha')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  // Volta para onde a pessoa estava (ex.: a vitrine da loja).
  const [searchParams] = useSearchParams()
  const back = searchParams.get('voltar')
  const next = safeNextPath(back)
  const signUpPath = back ? `/criar-conta?voltar=${encodeURIComponent(back)}` : '/criar-conta'

  if (!loading && session) {
    return <Navigate to={next} replace />
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
      setErrorMessage(authErrorMessage(error))
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
    <AuthPage>
      <AuthFormCard component="form" onSubmit={handleSubmit}>
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
          <Button component={RouterLink} to={signUpPath} size="small" color="inherit">
            Não tem conta? Criar conta
          </Button>
        </Stack>
      </AuthFormCard>
    </AuthPage>
  )
}
