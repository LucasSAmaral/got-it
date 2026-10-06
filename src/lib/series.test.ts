import { describe, expect, it } from 'vitest'
import {
  groupSeries,
  isSeriesPositionInputValid,
  parseSeriesPosition,
  seriesPosition,
  seriesProgress,
  titleWithinSeries,
} from './series'

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

describe('groupSeries', () => {
  const edition = (title: string, volume: string | null, series_position: number | null, owned: boolean) => ({
    title,
    volume,
    series_position,
    owned,
  })

  // O caso do Lucas: tem o "O Início" (nº 1) e a capa dura do vol. 2 em diante; o vol. 1 da capa dura existe no catálogo.
  const homemAranha2099 = [
    edition('Homem-Aranha 2099 vol. 3', '3', null, false),
    edition('Homem-Aranha 2099 vol. 1', '1', null, false),
    edition('Homem-Aranha 2099: O Início', null, 1, true),
    edition('Homem-Aranha 2099 vol. 2', '2', null, true),
    edition('Homem-Aranha 2099 Especial', 'Especial', null, false),
  ]

  it('agrupa pela posição, em ordem, com as sem posição no fim', () => {
    expect(groupSeries(homemAranha2099).map((slot) => slot.position)).toEqual([1, 2, 3, null])
  })

  it('numa posição coberta, a outra edição não aparece como "não tenho"', () => {
    const [first] = groupSeries(homemAranha2099)
    expect(first!.covered).toBe(true)
    expect(first!.items.map((item) => [item.edition.title, item.status])).toEqual([
      ['Homem-Aranha 2099: O Início', 'owned'],
      ['Homem-Aranha 2099 vol. 1', 'other_edition'],
    ])
  })

  it('posição sem nenhuma edição sua é "não tenho"', () => {
    const third = groupSeries(homemAranha2099)[2]!
    expect(third.covered).toBe(false)
    expect(third.items.map((item) => item.status)).toEqual(['missing'])
  })

  it('conta só as posições numeradas', () => {
    expect(seriesProgress(groupSeries(homemAranha2099))).toEqual({ covered: 2, total: 3 })
  })

  it('série vazia', () => {
    expect(groupSeries([])).toEqual([])
    expect(seriesProgress([])).toEqual({ covered: 0, total: 0 })
  })

  it('não muda o array recebido', () => {
    const input = [...homemAranha2099]
    groupSeries(input)
    expect(input).toEqual(homemAranha2099)
  })
})

describe('titleWithinSeries', () => {
  it('tira o nome da série e a pontuação que o separa', () => {
    expect(titleWithinSeries('Homem-Aranha 2099: O Início', 'Homem-Aranha 2099')).toBe('O Início')
    expect(titleWithinSeries('Homem-Aranha 2099 vol. 2', 'Homem-Aranha 2099')).toBe('vol. 2')
    expect(titleWithinSeries('Absolute Batman - 6', 'Absolute Batman')).toBe('6')
    expect(titleWithinSeries('homem-aranha 2099 Especial', 'Homem-Aranha 2099')).toBe('Especial')
  })

  it('mantém o título quando ele não começa pela série, ou quando não sobraria nada', () => {
    expect(titleWithinSeries('Spider-Man 2099 Omnibus', 'Homem-Aranha 2099')).toBe('Spider-Man 2099 Omnibus')
    expect(titleWithinSeries('Homem-Aranha 2099', 'Homem-Aranha 2099')).toBe('Homem-Aranha 2099')
    expect(titleWithinSeries('Watchmen', '')).toBe('Watchmen')
  })

  it('não corta no meio de uma palavra', () => {
    expect(titleWithinSeries('Batmania', 'Batman')).toBe('Batmania')
    expect(titleWithinSeries('Invencível 10', 'Invencível 1')).toBe('Invencível 10')
  })
})
