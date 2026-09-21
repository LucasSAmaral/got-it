import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env (veja .env.example).',
  )
}

const DATA_API_PATH = /\/(rest|storage)\/v1\//

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    // Sem sessão válida (token vencido que não conseguiu renovar), o supabase-js manda a própria chave
    // anônima como token. A RLS responde listas vazias, sem erro, e o app trataria isso como "não tenho
    // nada" e até sobrescreveria a cópia offline. Melhor falhar como se estivesse sem rede.
    fetch: (input, init) => {
      const url = input instanceof Request ? input.url : String(input)
      const authorization = new Headers(init?.headers).get('Authorization')
      if (DATA_API_PATH.test(url) && authorization === `Bearer ${supabaseAnonKey}`) {
        return Promise.reject(new TypeError('Sem sessão válida para consultar os dados.'))
      }
      return fetch(input, init)
    },
  },
})
