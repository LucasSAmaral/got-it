import { describe, expect, it } from 'vitest'
import { fitWithin } from './image'

describe('fitWithin', () => {
  it('reduz foto de celular mantendo a proporção', () => {
    expect(fitWithin(4000, 3000, 800)).toEqual({ width: 800, height: 600 })
    expect(fitWithin(3000, 4000, 800)).toEqual({ width: 600, height: 800 })
  })

  it('não amplia imagem que já cabe', () => {
    expect(fitWithin(300, 400, 800)).toEqual({ width: 300, height: 400 })
    expect(fitWithin(800, 800, 800)).toEqual({ width: 800, height: 800 })
  })

  it('arredonda para pixels inteiros', () => {
    expect(fitWithin(3024, 4032, 800)).toEqual({ width: 600, height: 800 })
    expect(fitWithin(1001, 1499, 800)).toEqual({ width: 534, height: 800 })
  })

  it('nunca devolve dimensão zero, mesmo em proporção extrema', () => {
    expect(fitWithin(10000, 5, 800)).toEqual({ width: 800, height: 1 })
  })
})
