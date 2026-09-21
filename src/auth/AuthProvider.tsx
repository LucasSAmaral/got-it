import { isAuthRetryableFetchError, type Session } from '@supabase/supabase-js'
import { createContext, useEffect, useState, type ReactNode } from 'react'
import { clearMirror, loadMirror } from '../lib/mirrorStore'
import { supabase } from '../lib/supabase'

interface AuthContextValue {
  session: Session | null
  loading: boolean
  /**
   * Sem sessão válida porque o servidor não respondeu (sem sinal), mas este aparelho já tem a coleção
   * salva: dá para consultá-la. Quando a rede volta, o supabase-js renova o token e `session` reaparece.
   */
  offlineAccess: boolean
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// Com o token vencido, getSession() tenta renová-lo pela rede e pode ficar pendurado por até ~30 s.
// Com sinal ruim (o navegador acha que está online) vale esperar um pouco; sem rede nenhuma, um token
// válido responde na hora (só lê o armazenamento local) e não há motivo para esperar mais.
const BOOT_TIMEOUT_MS = 3000
const OFFLINE_BOOT_TIMEOUT_MS = 400

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [offlineAccess, setOfflineAccess] = useState(false)

  useEffect(() => {
    let active = true

    async function boot() {
      const limit = navigator.onLine ? BOOT_TIMEOUT_MS : OFFLINE_BOOT_TIMEOUT_MS
      const timeout = new Promise<'timeout'>((resolve) => setTimeout(resolve, limit, 'timeout'))
      const result = await Promise.race([supabase.auth.getSession(), timeout])
      if (!active) return

      const serverUnreachable =
        result === 'timeout' || (!result.data.session && isAuthRetryableFetchError(result.error))

      if (serverUnreachable) {
        const mirror = await loadMirror()
        if (!active) return
        setOfflineAccess(mirror !== null)
      } else {
        setSession(result.data.session)
      }
      setLoading(false)
    }

    boot()

    // Só o boot decide quando `loading` termina: o INITIAL_SESSION chega antes dele e, sem rede, vem vazio.
    const { data: subscription } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession)
      if (newSession) setOfflineAccess(false)
      if (event === 'SIGNED_OUT') {
        setOfflineAccess(false)
        clearMirror()
      }
    })

    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  return <AuthContext.Provider value={{ session, loading, offlineAccess }}>{children}</AuthContext.Provider>
}
