import { Alert, Button, Stack, TextField, Typography } from '@mui/material'
import type { AuthError, EmailOtpType } from '@supabase/supabase-js'
import { useState, type FormEvent } from 'react'
import { authErrorMessage, normalizeOtp, OTP_LENGTH } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { AuthFormCard } from './AuthPage.styles'

interface VerifyCodeFormProps {
  email: string
  /** Tipo do código no Supabase: `signup` (criar conta), `recovery` (senha nova), `email` (entrar sem senha). */
  type: EmailOtpType
  /** Pede outro e-mail com código; cada fluxo usa uma chamada diferente do Supabase. */
  onResend: () => Promise<{ error: AuthError | null }>
  /** Volta para trocar o e-mail digitado. */
  onBack: () => void
  /** Chamado quando o código confere (a sessão já existe nesse momento). */
  onVerified?: () => void
}

/**
 * Digitar o código de 6 dígitos que chegou por e-mail. Código em vez de link porque, no iPhone, o
 * link abre no Safari, que tem armazenamento separado do PWA instalado: a sessão nunca chegaria ao
 * app. Acertar o código já cria a sessão (o `AuthProvider` recebe o `SIGNED_IN`); quem usa este
 * formulário decide o que mostrar depois.
 */
export function VerifyCodeForm({ email, type, onResend, onBack, onVerified }: VerifyCodeFormProps) {
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<'idle' | 'verifying' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setStatus('verifying')
    setErrorMessage('')

    const { error } = await supabase.auth.verifyOtp({ email, token: code, type })
    if (error) {
      setStatus('error')
      setErrorMessage(authErrorMessage(error))
      return
    }
    setStatus('idle')
    onVerified?.()
  }

  async function handleResend() {
    setResendStatus('sending')
    setStatus('idle')
    setErrorMessage('')

    const { error } = await onResend()
    if (error) {
      setResendStatus('idle')
      setStatus('error')
      setErrorMessage(authErrorMessage(error))
      return
    }
    setCode('')
    setResendStatus('sent')
  }

  const busy = status === 'verifying' || resendStatus === 'sending'

  return (
    <AuthFormCard component="form" onSubmit={handleSubmit}>
      <Stack spacing={2}>
        <Typography variant="body2" color="text.secondary">
          Mandamos um código de {OTP_LENGTH} dígitos para <strong>{email}</strong>. Se não aparecer,
          confira o spam.
        </Typography>
        <TextField
          id="code"
          label="Código"
          required
          fullWidth
          autoFocus
          value={code}
          onChange={(event) => setCode(normalizeOtp(event.target.value))}
          disabled={busy}
          // Sem `maxLength`: o navegador cortaria o que foi colado antes da limpeza ("123 456" tem 7
          // caracteres e viraria "12345"). Quem limita é o `normalizeOtp`.
          slotProps={{ htmlInput: { inputMode: 'numeric', autoComplete: 'one-time-code' } }}
        />
        {resendStatus === 'sent' && status !== 'error' && (
          <Alert severity="success">Código novo enviado. Use o do último e-mail.</Alert>
        )}
        {status === 'error' && <Alert severity="error">{errorMessage}</Alert>}
        <Button type="submit" variant="contained" fullWidth disabled={busy || code.length !== OTP_LENGTH}>
          {status === 'verifying' ? 'Conferindo…' : 'Confirmar'}
        </Button>
        <Button type="button" size="small" color="inherit" onClick={handleResend} disabled={busy}>
          {resendStatus === 'sending' ? 'Enviando…' : 'Mandar outro código'}
        </Button>
        <Button type="button" size="small" color="inherit" onClick={onBack} disabled={busy}>
          Trocar o e-mail
        </Button>
      </Stack>
    </AuthFormCard>
  )
}
