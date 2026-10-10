import { describe, expect, it } from 'vitest'
import { paginate, parsePage } from './pagination'

const range = (n: number) => Array.from({ length: n }, (_, i) => i + 1)

describe('parsePage', () => {
  it('lê o número da página', () => {
    expect(parsePage('3')).toBe(3)
  })

  it('ausente, zero, negativo, fracionário ou texto vira 1', () => {
    expect([null, '', '0', '-2', '1.5', 'abc'].map(parsePage)).toEqual([1, 1, 1, 1, 1, 1])
  })
})

describe('paginate', () => {
  it('corta a página pedida', () => {
    expect(paginate(range(40), 2, 15)).toEqual({ pageItems: range(30).slice(15), page: 2, pageCount: 3 })
  })

  it('a última página pode vir incompleta', () => {
    expect(paginate(range(40), 3, 15).pageItems).toEqual([31, 32, 33, 34, 35, 36, 37, 38, 39, 40])
  })

  it('página além do fim mostra a última', () => {
    expect(paginate(range(16), 5, 15)).toMatchObject({ pageItems: [16], page: 2, pageCount: 2 })
  })

  it('lista vazia tem uma página, vazia', () => {
    expect(paginate([], 1, 15)).toEqual({ pageItems: [], page: 1, pageCount: 1 })
  })

  it('exatamente uma página cheia não cria a segunda', () => {
    expect(paginate(range(15), 1, 15).pageCount).toBe(1)
  })
})
