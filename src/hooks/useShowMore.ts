import { useEffect, useState } from 'react'

/** 30 fecha a grade com 1, 2 ou 3 colunas. */
export const SHOW_MORE_STEP = 30

/**
 * Exibe uma lista longa aos poucos: começa com `SHOW_MORE_STEP` itens e mostra mais quando o elemento
 * sentinela (posto depois da lista) chega perto da tela. Os dados continuam inteiros; só o render é parcial.
 * Mudar `resetKey` (ex.: o termo de busca) volta ao primeiro bloco.
 */
export function useShowMore(total: number, resetKey: string) {
  const [shown, setShown] = useState({ key: resetKey, count: SHOW_MORE_STEP })
  // Reset no próprio render quando a chave muda (padrão do React para "estado derivado de prop"), sem
  // setState num efeito. Trocar o estado, e não só ignorá-lo, evita que o contador antigo volte junto
  // quando a chave anterior volta (ex.: limpar a busca).
  if (shown.key !== resetKey) setShown({ key: resetKey, count: SHOW_MORE_STEP })
  const count = shown.key === resetKey ? shown.count : SHOW_MORE_STEP
  // Ref por estado: o sentinela só existe enquanto há mais itens, e o efeito precisa saber quando ele aparece.
  const [sentinel, setSentinel] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (!sentinel) return
    // Recriado a cada bloco (`count` nas dependências): o observer novo avisa na hora se o sentinela ainda
    // está perto da tela (tela alta), o que um observer antigo não faria, já que nada "entrou" de novo.
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown({ key: resetKey, count: count + SHOW_MORE_STEP })
        }
      },
      { rootMargin: '800px 0px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [sentinel, resetKey, count])

  return { visibleCount: count, hasMore: count < total, sentinelRef: setSentinel }
}
