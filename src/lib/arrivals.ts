import { formatArrival } from './format'

interface ArrivalLike {
  arrived_on: string
  price: number | null
  edition: { id: string }
  store: { id: string; name: string }
}

export interface EditionArrivals<A extends ArrivalLike> {
  edition: A['edition']
  /** Uma por loja, a mais recente. */
  arrivals: A[]
}

/**
 * Junta as chegadas de várias lojas por edição, para o mesmo gibi aparecer uma vez só no Início. Espera a
 * lista já em ordem (mais recentes primeiro): a ordem das edições e das lojas dentro de cada uma é a da
 * primeira chegada. Reposição na mesma loja dentro da janela conta uma vez, pela mais recente.
 */
export function groupArrivalsByEdition<A extends ArrivalLike>(arrivals: A[]): EditionArrivals<A>[] {
  const editionIds = [...new Set(arrivals.map((arrival) => arrival.edition.id))]
  return editionIds.map((editionId) => {
    const ofEdition = arrivals.filter((arrival) => arrival.edition.id === editionId)
    return {
      edition: ofEdition[0].edition,
      arrivals: ofEdition.filter(
        (arrival, index) => ofEdition.findIndex((other) => other.store.id === arrival.store.id) === index,
      ),
    }
  })
}

const storeList = new Intl.ListFormat('pt-BR', { type: 'conjunction' })

/**
 * Linha do cartão no Início: "Chegou na Lazarus em 27/10 · R$ 39,90" com uma loja; "Chegou na Lazarus e
 * na Comix" com mais (data e preço de cada uma ficam na lista que abre ao tocar).
 */
export function arrivalsSummary(arrivals: ArrivalLike[]): string {
  if (arrivals.length === 1) {
    const [arrival] = arrivals
    return formatArrival(arrival.arrived_on, arrival.price).replace('Chegou em', `Chegou na ${arrival.store.name} em`)
  }
  return `Chegou ${storeList.format(arrivals.map((arrival) => `na ${arrival.store.name}`))}`
}
