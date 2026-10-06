import { describe, expect, it } from 'vitest'
import { isSeriesPositionInputValid, parseSeriesPosition, seriesPosition } from './series'

describe('parseSeriesPosition', () => {
  it('aceita inteiro positivo, com espaços nas pontas', () => {
    expect(parseSeriesPosition('1')).toBe(1)
    expect(parseSeriesPosition(' 12 ')).toBe(12)
  })

  it('recusa vazio, zero, negativo, decimal e texto', () => {
    expect(parseSeriesPosition('')).toBeNull()
    expect(parseSeriesPosition('0')).toBeNull()
    expect(parseSeriesPosition('-1')).toBeNull()
    expect(parseSeriesPosition('1,5')).toBeNull()
    expect(parseSeriesPosition('um')).toBeNull()
    expect(parseSeriesPosition('99999999999')).toBeNull()
  })
})

describe('isSeriesPositionInputValid', () => {
  it('vazio é válido (o campo é opcional)', () => {
    expect(isSeriesPositionInputValid('')).toBe(true)
    expect(isSeriesPositionInputValid('3')).toBe(true)
    expect(isSeriesPositionInputValid('três')).toBe(false)
  })
})

describe('seriesPosition', () => {
  it('o nº na série manda quando preenchido', () => {
    expect(seriesPosition({ series_position: 1, volume: null })).toBe(1)
    expect(seriesPosition({ series_position: 1, volume: '7' })).toBe(1)
  })

  it('sem nº na série, usa o primeiro número do volume', () => {
    expect(seriesPosition({ series_position: null, volume: '6' })).toBe(6)
    expect(seriesPosition({ series_position: null, volume: 'Vol. 2' })).toBe(2)
    expect(seriesPosition({ series_position: null, volume: '10 de 12' })).toBe(10)
  })

  it('sem nenhum dos dois, não tem posição', () => {
    expect(seriesPosition({ series_position: null, volume: null })).toBeNull()
    expect(seriesPosition({ series_position: null, volume: 'Especial' })).toBeNull()
  })
})
