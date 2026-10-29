import { Alert, Button, Stack, TextField } from '@mui/material'
import { useState, type FormEvent } from 'react'
import { Link as RouterLink, Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { authErrorMessage, MIN_PASSWORD_LENGTH, safeNextPath } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { AuthPage } from './AuthPage'
import { AuthFormCard } from './AuthPage.styles'
import { VerifyCodeForm } from './VerifyCodeForm'

/**
 * Criar conta em dois passos: e-mail e senha, depois o código que chega por e-mail ("Confirm email"
 * está ligado no Supabase). Acertar o código já entra no app.
 */
export function SignUpPage() {
  const { session, loading } = useAuth()
  const [step, setStep] = useState<'form' | 'code'>('form')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [searchParams] = useSearchParams()
  const back = searchParams.get('voltar')
  const next = safeNextPath(back)
  const loginPath = back ? `/login?voltar=${encodeURIComponent(back)}` : '/login'

  if (!loading && session) {
    return <Navigate to={next} replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setStatus('sending')
    setErrorMessage('')

    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setStatus('error')
      setErrorMessage(authErrorMessage(error))
      return
    }
    // E-mail já cadastrado e confirmado: o Supabase responde como se desse certo (para não revelar
    // quem tem conta), mas sem identidades e sem mandar e-mail. Melhor dizer do que esperar um
    // código que nunca chega.
    if (data.user?.identities?.length === 0) {
      setStatus('error')
      setErrorMessage(authErrorMessage({ code: 'user_already_exists', message: '' }))
      return
    }
    setStatus('idle')
    setStep('code')
  }

  const passwordTooShort = password.length > 0 && password.length < MIN_PASSWORD_LENGTH

  return (
    <AuthPage>
      {step === 'code' ? (
        <VerifyCodeForm
          email={email}
          type="signup"
          onResend={() => supabase.auth.resend({ type: 'signup', email })}
          onBack={() => setStep('form')}
        />
      ) : (
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
            <TextField
              id="password"
              label="Senha"
              type="password"
              autoComplete="new-password"
              required
              fullWidth
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={status === 'sending'}
              error={passwordTooShort}
              helperText={`Pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`}
            />
            {status === 'error' && <Alert severity="error">{errorMessage}</Alert>}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={status === 'sending' || password.length < MIN_PASSWORD_LENGTH}
            >
              {status === 'sending' ? 'Criando…' : 'Criar conta'}
            </Button>
            <Button component={RouterLink} to={loginPath} size="small" color="inherit">
              Já tenho conta. Entrar
            </Button>
          </Stack>
        </AuthFormCard>
      )}
    </AuthPage>
  )
}
