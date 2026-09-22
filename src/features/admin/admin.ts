import type { Session } from '@supabase/supabase-js'

/**
 * Único usuário com acesso à área de administração do catálogo (edita qualquer edição,
 * não só as que criou). Fixo aqui de propósito — hoje o catálogo tem só o Lucas usando de
 * verdade; revisitar (papel de admin de verdade) quando houver mais gente de confiança.
 * O UUID não é segredo: sem uma sessão autenticada como esse usuário, tê-lo não dá acesso
 * a nada — o auth.uid() que o Postgres compara vem do JWT verificado pelo Supabase.
 */
const ADMIN_USER_ID = '1df84c70-a8b3-43b9-a528-cf50cac4946a'

export function isAdmin(session: Session | null): boolean {
  return session?.user.id === ADMIN_USER_ID
}
