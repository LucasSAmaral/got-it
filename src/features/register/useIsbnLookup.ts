import { useQuery } from '@tanstack/react-query'
import { fetchIsbnLookup } from './api'

/**
 * Registro do ISBN na BrasilAPI (base da CBL). Uma consulta por código na sessão: sem repetir, sem nova
 * tentativa (a BrasilAPI pede para não fazer requisições em laço) e nem pergunta sem rede. `NewEditionFields`
 * e a página em volta usam a mesma chave, então é um pedido só. Passe `null` quando a edição já está no
 * catálogo: aí não há o que preencher.
 */
export function useIsbnLookup(isbn13: string | null) {
  return useQuery({
    queryKey: ['isbn-lookup', isbn13],
    queryFn: () => fetchIsbnLookup(isbn13!),
    enabled: isbn13 !== null && navigator.onLine,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  })
}

/** O formulário veio preenchido (o aviso aparece e o texto de cima pede para conferir). */
export const isPrefilled = (lookup: ReturnType<typeof useIsbnLookup>) => Boolean(lookup.data?.title?.trim())
