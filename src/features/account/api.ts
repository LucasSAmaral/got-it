import { supabase } from '../../lib/supabase'

/**
 * Apaga a conta de quem está logado (função `delete_my_account`, que leva junto os exemplares e deixa no
 * catálogo, sem autor, o que a pessoa cadastrou). Depois sai só neste aparelho: no servidor a sessão já
 * não existe, e o `SIGNED_OUT` apaga a cópia offline e o cache das consultas.
 */
export async function deleteMyAccount(): Promise<void> {
  const { error } = await supabase.rpc('delete_my_account')
  if (error) throw error
  await supabase.auth.signOut({ scope: 'local' })
}
