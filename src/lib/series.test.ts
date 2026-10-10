import { describe, expect, it } from 'vitest'
import {
  groupSeries,
  isSeriesPositionInputValid,
  parseSeriesPosition,
  seriesPosition,
  seriesProgress,
  seriesSummariesFromCollection,
  sortSeriesByTitle,
  summarizeSeries,
  titleWithinSeries,
} from './series'
import type { CollectionItem } from '../types/catalog'

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

describe('summarizeSeries', () => {
  const edition = (title: string, volume: string | null, owned: boolean, cover_url: string | null = null) => ({
    title,
    volume,
    series_position: null,
    owned,
    cover_url,
  })

  it('conta as posições, as edições e se você segue', () => {
    const summary = summarizeSeries({
      id: 'w1',
      title: 'Invencível',
      editions: [edition('Invencível 2', '2', true, 'b.jpg'), edition('Invencível 1', '1', false, 'a.jpg'), edition('Invencível 3', '3', false)],
    })
    expect(summary).toEqual({
      id: 'w1',
      title: 'Invencível',
      coverUrl: 'a.jpg',
      covered: 1,
      total: 3,
      editionCount: 3,
      following: true,
    })
  })

  it('a capa da primeira posição é a sua quando há mais de uma edição nela', () => {
    const summary = summarizeSeries({
      id: 'w1',
      title: 'X',
      editions: [edition('A capa dura', '1', false, 'dura.jpg'), edition('B banca', '1', true, 'banca.jpg')],
    })
    expect(summary.coverUrl).toBe('banca.jpg')
  })

  it('sem exemplar seu, não segue', () => {
    const summary = summarizeSeries({ id: 'w1', title: 'X', editions: [edition('X 1', '1', false)] })
    expect(summary.following).toBe(false)
    expect(summary.covered).toBe(0)
  })
})

describe('sortSeriesByTitle', () => {
  it('ordem alfabética sem separar acentos e caixa, sem mudar o array recebido', () => {
    const input = [{ title: 'Watchmen' }, { title: 'asterix' }, { title: 'Ásterix e Cleópatra' }, { title: 'Batman' }]
    expect(sortSeriesByTitle(input).map((series) => series.title)).toEqual([
      'asterix',
      'Ásterix e Cleópatra',
      'Batman',
      'Watchmen',
    ])
    expect(input[0]!.title).toBe('Watchmen')
  })
})

describe('seriesSummariesFromCollection', () => {
  const item = (overrides: Partial<CollectionItem>): CollectionItem => ({
    copy_id: 'c',
    edition_id: 'e',
    title: 'T',
    publisher: null,
    isbn13: null,
    volume: null,
    cover_url: null,
    status: 'collection',
    condition: null,
    acquired_at: null,
    ...overrides,
  })

  it('agrupa os seus exemplares por série, contando cada edição uma vez', () => {
    const summaries = seriesSummariesFromCollection([
      item({ copy_id: 'c1', edition_id: 'e1', volume: '1', work_id: 'w2', series_title: 'Saga' }),
      item({ copy_id: 'c2', edition_id: 'e1', volume: '1', work_id: 'w2', series_title: 'Saga' }),
      item({ copy_id: 'c3', edition_id: 'e2', volume: '3', work_id: 'w2', series_title: 'Saga' }),
      item({ copy_id: 'c4', edition_id: 'e3', work_id: 'w1', series_title: 'Akira', series_position: 1 }),
      item({ copy_id: 'c5', edition_id: 'e4', work_id: null }),
      // Cópia salva antes das séries: sem `work_id`.
      item({ copy_id: 'c6', edition_id: 'e5' }),
    ])
    expect(summaries.map(({ id, title, covered, total, editionCount, following }) => ({ id, title, covered, total, editionCount, following }))).toEqual([
      { id: 'w1', title: 'Akira', covered: 1, total: 1, editionCount: 1, following: true },
      { id: 'w2', title: 'Saga', covered: 2, total: 2, editionCount: 2, following: true },
    ])
  })
})
