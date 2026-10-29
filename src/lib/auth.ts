/** Tamanho do código enviado por e-mail (Authentication → Providers → Email → Email OTP Length). */
export const OTP_LENGTH = 6

/** O mesmo mínimo configurado no Supabase (Minimum password length). */
export const MIN_PASSWORD_LENGTH = 8

const ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: 'E-mail ou senha incorretos.',
  email_not_confirmed: 'Confirme o e-mail antes de entrar.',
  over_email_send_rate_limit: 'Muitos e-mails enviados por enquanto. Espere um pouco e tente de novo.',
  over_request_rate_limit: 'Muitas tentativas seguidas. Espere um pouco e tente de novo.',
  otp_expired: 'Código incorreto ou vencido. Confira o último e-mail ou peça outro código.',
  same_password: 'A senha nova precisa ser diferente da antiga.',
  weak_password: `Senha fraca. Use pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`,
  user_already_exists: 'Esse e-mail já tem conta. Entre com a senha.',
  email_exists: 'Esse e-mail já tem conta. Entre com a senha.',
  email_address_invalid: 'E-mail inválido.',
  signup_disabled: 'Cadastros fechados no momento.',
}

/** Mensagem em português para um erro do Supabase Auth; código desconhecido mostra a mensagem original. */
export function authErrorMessage(error: { code?: string; message: string }): string {
  return (error.code && ERROR_MESSAGES[error.code]) || error.message
}

/** Só os dígitos do que foi digitado ou colado ("123 456" vira "123456"), no máximo `OTP_LENGTH`. */
export function normalizeOtp(input: string): string {
  return input.replace(/\D/g, '').slice(0, OTP_LENGTH)
}

/**
 * Para onde voltar depois de entrar (`?voltar=`). Só caminho interno: "//outro.site" seria outro
 * endereço.
 */
export function safeNextPath(back: string | null): string {
  return back?.startsWith('/') && !back.startsWith('//') ? back : '/'
}
