import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env (veja .env.example).',
  )
}

const DATA_API_PATH = /\/(rest|storage)\/v1\//
// Tabelas que qualquer um lê, com ou sem login (vitrine da loja, `/loja/:slug`): sem sessão elas devolvem
// o mesmo que com sessão, então a chave anônima não gera a lista vazia enganosa da regra abaixo. As
// edições vêm embutidas no pedido de `store_arrivals`, não num pedido próprio a `editions`.
const PUBLIC_DATA_PATH = /\/rest\/v1\/(stores|store_arrivals)(\?|$)/

/**
 * Sem sessão válida (token vencido que não conseguiu renovar), o supabase-js manda a própria chave anônima
 * como token. A RLS responde listas vazias, sem erro, e o app trataria isso como "não tenho nada" e até
 * sobrescreveria a cópia offline. Esses pedidos a dados são recusados, como se estivesse sem rede, menos
 * os das tabelas públicas da vitrine.
 */
export function isAnonymousDataRequest(url: string, authorization: string | null, anonKey: string): boolean {
  return DATA_API_PATH.test(url) && !PUBLIC_DATA_PATH.test(url) && authorization === `Bearer ${anonKey}`
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: (input, init) => {
      const url = input instanceof Request ? input.url : String(input)
      const authorization = new Headers(init?.headers).get('Authorization')
      if (isAnonymousDataRequest(url, authorization, supabaseAnonKey)) {
        return Promise.reject(new TypeError('Sem sessão válida para consultar os dados.'))
      }
      return fetch(input, init)
    },
  },
})
