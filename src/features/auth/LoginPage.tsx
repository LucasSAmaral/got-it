import { Alert, Button, Stack, TextField, Typography } from '@mui/material'
import { useState, type FormEvent } from 'react'
import { Link as RouterLink, Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { authErrorMessage, safeNextPath } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { AuthPage } from './AuthPage'
import { AuthFormCard } from './AuthPage.styles'
import { VerifyCodeForm } from './VerifyCodeForm'

type Mode = 'senha' | 'codigo'

export function LoginPage() {
  const { session, loading } = useAuth()
  const [mode, setMode] = useState<Mode>('senha')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle')
  const [codeSent, setCodeSent] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  // Volta para onde a pessoa estava (ex.: a vitrine da loja).
  const [searchParams] = useSearchParams()
  const back = searchParams.get('voltar')
  const next = safeNextPath(back)
  const query = back ? `?voltar=${encodeURIComponent(back)}` : ''

  if (!loading && session) {
    return <Navigate to={next} replace />
  }

  // Sem senha: código por e-mail (ver `VerifyCodeForm`). `shouldCreateUser: false` porque conta nova
  // só nasce pelo "Criar conta", com senha; senão qualquer e-mail digitado aqui virava conta.
  const sendCode = () => supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } })

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setStatus('sending')
    setErrorMessage('')

    const { error } =
      mode === 'senha'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await sendCode()

    if (error) {
      setStatus('error')
      setErrorMessage(authErrorMessage(error))
      return
    }

    setStatus('idle')
    setCodeSent(mode === 'codigo')
  }

  function switchMode() {
    setMode(mode === 'senha' ? 'codigo' : 'senha')
    setStatus('idle')
    setErrorMessage('')
  }

  if (codeSent) {
    return (
      <AuthPage>
        <VerifyCodeForm email={email} type="email" onResend={sendCode} onBack={() => setCodeSent(false)} />
      </AuthPage>
    )
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
            disabled={status === 'sending'}
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
              Vamos te mandar um código de acesso por e-mail. Sem senha.
            </Typography>
          )}
          {status === 'error' && <Alert severity="error">{errorMessage}</Alert>}
          <Button type="submit" variant="contained" fullWidth disabled={status === 'sending'}>
            {mode === 'senha'
              ? status === 'sending'
                ? 'Entrando…'
                : 'Entrar'
              : status === 'sending'
                ? 'Enviando…'
                : 'Enviar código de acesso'}
          </Button>
          {mode === 'senha' && (
            <Button
              component={RouterLink}
              to={`/recuperar-senha${query}`}
              state={{ email }}
              size="small"
              color="inherit"
            >
              Esqueci a senha
            </Button>
          )}
          <Button type="button" size="small" color="inherit" onClick={switchMode}>
            {mode === 'senha' ? 'Prefiro receber um código por e-mail' : 'Entrar com senha'}
          </Button>
          <Button component={RouterLink} to={`/criar-conta${query}`} size="small" color="inherit">
            Não tem conta? Criar conta
          </Button>
        </Stack>
      </AuthFormCard>
    </AuthPage>
  )
}
