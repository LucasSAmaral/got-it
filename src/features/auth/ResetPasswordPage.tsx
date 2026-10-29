import { Alert, Button, Stack, TextField, Typography } from '@mui/material'
import { useState, type FormEvent } from 'react'
import { Link as RouterLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { authErrorMessage, MIN_PASSWORD_LENGTH, safeNextPath } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { AuthPage } from './AuthPage'
import { AuthFormCard } from './AuthPage.styles'
import { NewPasswordField } from './NewPasswordField'
import { VerifyCodeForm } from './VerifyCodeForm'

type Step = 'email' | 'code' | 'password'

/**
 * Esqueci a senha, em três passos: e-mail, código que chega por e-mail e senha nova. Acertar o código
 * já cria a sessão, por isso esta tela, ao contrário do login, não redireciona quem tem sessão: só
 * sai depois de gravar a senha nova.
 */
export function ResetPasswordPage() {
  const location = useLocation()
  const navigate = useNavigate()
  // O login passa o e-mail já digitado, para não pedir de novo.
  const initialEmail = (location.state as { email?: string } | null)?.email ?? ''
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [searchParams] = useSearchParams()
  const back = searchParams.get('voltar')
  const next = safeNextPath(back)
  const loginPath = back ? `/login?voltar=${encodeURIComponent(back)}` : '/login'

  // Sem `redirectTo`: o e-mail mostra o código, que se digita aqui.
  const sendCode = () => supabase.auth.resetPasswordForEmail(email)

  async function handleSendCode(event: FormEvent) {
    event.preventDefault()
    setStatus('sending')
    setErrorMessage('')

    // E-mail sem conta também responde sem erro (o Supabase não revela quem tem conta); a pessoa só
    // não recebe código.
    const { error } = await sendCode()
    if (error) {
      setStatus('error')
      setErrorMessage(authErrorMessage(error))
      return
    }
    setStatus('idle')
    setStep('code')
  }

  async function handleSavePassword(event: FormEvent) {
    event.preventDefault()
    setStatus('sending')
    setErrorMessage('')

    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setStatus('error')
      setErrorMessage(authErrorMessage(error))
      return
    }
    navigate(next, { replace: true })
  }

  if (step === 'code') {
    return (
      <AuthPage>
        <VerifyCodeForm
          email={email}
          type="recovery"
          onResend={sendCode}
          onBack={() => setStep('email')}
          onVerified={() => setStep('password')}
        />
      </AuthPage>
    )
  }

  if (step === 'password') {
    return (
      <AuthPage>
        <AuthFormCard component="form" onSubmit={handleSavePassword}>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Código confirmado. Escolha a senha nova.
            </Typography>
            <NewPasswordField
              label="Senha nova"
              value={password}
              onChange={setPassword}
              disabled={status === 'sending'}
            />
            {status === 'error' && <Alert severity="error">{errorMessage}</Alert>}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={status === 'sending' || password.length < MIN_PASSWORD_LENGTH}
            >
              {status === 'sending' ? 'Salvando…' : 'Salvar senha nova'}
            </Button>
          </Stack>
        </AuthFormCard>
      </AuthPage>
    )
  }

  return (
    <AuthPage>
      <AuthFormCard component="form" onSubmit={handleSendCode}>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Vamos mandar um código para o seu e-mail. Com ele você escolhe uma senha nova.
          </Typography>
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
          {status === 'error' && <Alert severity="error">{errorMessage}</Alert>}
          <Button type="submit" variant="contained" fullWidth disabled={status === 'sending'}>
            {status === 'sending' ? 'Enviando…' : 'Enviar código'}
          </Button>
          <Button component={RouterLink} to={loginPath} size="small" color="inherit">
            Lembrei a senha. Entrar
          </Button>
        </Stack>
      </AuthFormCard>
    </AuthPage>
  )
}
