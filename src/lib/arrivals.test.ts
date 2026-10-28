import { describe, expect, it } from 'vitest'
import { arrivalsSummary, groupArrivalsByEdition } from './arrivals'
import { formatPrice } from './format'

const lazarus = { id: 's1', name: 'Lazarus' }
const comix = { id: 's2', name: 'Comix' }
const batman = { id: 'e1' }
const spider = { id: 'e2' }

function arrival(id: string, edition: { id: string }, store: { id: string; name: string }, arrived_on: string, price: number | null = null) {
  return { id, edition, store, arrived_on, price }
}

describe('groupArrivalsByEdition', () => {
  it('junta a mesma edição de lojas diferentes, na ordem da primeira chegada', () => {
    const groups = groupArrivalsByEdition([
      arrival('a1', batman, comix, '2026-10-27'),
      arrival('a2', spider, lazarus, '2026-10-26'),
      arrival('a3', batman, lazarus, '2026-10-20'),
    ])
    expect(groups.map((group) => group.edition.id)).toEqual(['e1', 'e2'])
    expect(groups[0].arrivals.map((a) => a.id)).toEqual(['a1', 'a3'])
  })

  it('reposição na mesma loja conta uma vez, pela mais recente', () => {
    const [group] = groupArrivalsByEdition([
      arrival('a1', batman, lazarus, '2026-10-27'),
      arrival('a2', batman, lazarus, '2026-10-10'),
    ])
    expect(group.arrivals.map((a) => a.id)).toEqual(['a1'])
  })

  it('lista vazia não tem grupo', () => {
    expect(groupArrivalsByEdition([])).toEqual([])
  })
})

describe('arrivalsSummary', () => {
  it('uma loja: nome, data e preço', () => {
    expect(arrivalsSummary([arrival('a1', batman, lazarus, '2026-10-27', 39.9)])).toBe(
      `Chegou na Lazarus em 27/10 · ${formatPrice(39.9)}`,
    )
    expect(arrivalsSummary([arrival('a1', batman, lazarus, '2026-10-27')])).toBe('Chegou na Lazarus em 27/10')
  })

  it('várias lojas: só os nomes', () => {
    expect(
      arrivalsSummary([arrival('a1', batman, lazarus, '2026-10-27'), arrival('a2', batman, comix, '2026-10-20')]),
    ).toBe('Chegou na Lazarus e na Comix')
  })
})
