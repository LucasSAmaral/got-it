import { describe, expect, it } from 'vitest'
import type { CollectionItem } from '../types/catalog'
import {
  collectionEntries,
  collectionSeriesStats,
  filterByRead,
  parseOrder,
  parseReadFilter,
  sortCollection,
  withSeriesFrom,
} from './collectionView'

const item = (copy_id: string, title: string, extra: Partial<CollectionItem> = {}): CollectionItem => ({
  copy_id,
  edition_id: `e-${copy_id}`,
  title,
  publisher: 'Panini',
  isbn13: null,
  volume: null,
  cover_url: null,
  status: 'collection',
  condition: null,
  acquired_at: null,
  ...extra,
})

const titles = (items: CollectionItem[]) => items.map((each) => each.title)

describe('parseOrder e parseReadFilter', () => {
  it('aceitam os valores conhecidos e caem no padrão com o resto', () => {
    expect(parseOrder('az')).toBe('az')
    expect(parseOrder('serie')).toBe('serie')
    expect(parseOrder(null)).toBe('recentes')
    expect(parseOrder('qualquer')).toBe('recentes')
    expect(parseReadFilter('lidos')).toBe('lidos')
    expect(parseReadFilter('nao-lidos')).toBe('nao-lidos')
    expect(parseReadFilter(null)).toBe('todos')
    expect(parseReadFilter('x')).toBe('todos')
  })
})

describe('filterByRead', () => {
  const items = [item('1', 'Lido', { read: true }), item('2', 'Não lido', { read: false }), item('3', 'Cópia antiga')]

  it('todos devolve tudo', () => {
    expect(titles(filterByRead(items, 'todos'))).toEqual(['Lido', 'Não lido', 'Cópia antiga'])
  })

  it('sem `read` (cópia offline antiga) conta como não lido', () => {
    expect(titles(filterByRead(items, 'nao-lidos'))).toEqual(['Não lido', 'Cópia antiga'])
    expect(titles(filterByRead(items, 'lidos'))).toEqual(['Lido'])
  })
})

describe('sortCollection', () => {
  it('recentes mantém a ordem recebida, sem mudar o array', () => {
    const items = [item('1', 'B'), item('2', 'A')]
    const sorted = sortCollection(items, 'recentes')
    expect(titles(sorted)).toEqual(['B', 'A'])
    expect(sorted).not.toBe(items)
  })

  it('A–Z em português, sem separar acentos e caixa, com números em ordem natural', () => {
    const items = [
      item('1', 'Batman: Padrões Sombrios 10'),
      item('2', 'absolute Flash'),
      item('3', 'Batman: Padrões Sombrios 2'),
      item('4', 'Ásterix'),
      item('5', 'Berserk Vol 1'),
    ]
    expect(titles(sortCollection(items, 'az'))).toEqual([
      'absolute Flash',
      'Ásterix',
      'Batman: Padrões Sombrios 2',
      'Batman: Padrões Sombrios 10',
      'Berserk Vol 1',
    ])
    expect(titles(items)[0]).toBe('Batman: Padrões Sombrios 10')
  })

  it('série não reordena: os cartões saem de collectionEntries', () => {
    const items = [item('1', 'B'), item('2', 'A')]
    expect(titles(sortCollection(items, 'serie'))).toEqual(['B', 'A'])
  })
})

describe('collectionEntries', () => {
  it('um cartão por série e um por exemplar sem série, tudo em ordem alfabética', () => {
    const entries = collectionEntries([
      item('1', 'Saga do Lanterna Verde 2', { work_id: 'lv', series_title: 'A Saga do Lanterna Verde' }),
      item('2', 'Berserk Vol 1'),
      item('3', 'Saga do Lanterna Verde 1', { work_id: 'lv', series_title: 'A Saga do Lanterna Verde' }),
      item('4', 'Absolute Batman 2', { work_id: 'ab', series_title: 'Absolute Batman' }),
      item('5', 'Avulso', { work_id: null }),
    ])
    expect(entries.map((entry) => (entry.kind === 'series' ? `série ${entry.title}` : entry.item.title))).toEqual([
      'série A Saga do Lanterna Verde',
      'série Absolute Batman',
      'Avulso',
      'Berserk Vol 1',
    ])
  })

  it('lista vazia, nenhum cartão', () => {
    expect(collectionEntries([])).toEqual([])
  })
})

describe('collectionSeriesStats', () => {
  it('números que você tem, capa do primeiro e quantos leu', () => {
    const stats = collectionSeriesStats([
      item('2', 'LV 2', { work_id: 'lv', series_title: 'LV', volume: '2', read: false, cover_url: 'dois.jpg' }),
      item('1', 'LV 1', { work_id: 'lv', series_title: 'LV', volume: '1', read: true, cover_url: 'um.jpg' }),
      item('3', 'LV 3', { work_id: 'lv', series_title: 'LV', volume: '3' }),
    ])
    expect(stats).toMatchObject({ read: 1, unread: 2, summary: { id: 'lv', title: 'LV', covered: 3, coverUrl: 'um.jpg' } })
  })

  it('sem exemplar, null', () => {
    expect(collectionSeriesStats([])).toBeNull()
  })
})

describe('withSeriesFrom', () => {
  it('completa a série dos resultados da busca a partir da lista completa', () => {
    const full = [item('1', 'X', { work_id: 'w', series_title: 'W', series_position: 3 }), item('2', 'Y', { work_id: null })]
    const result = withSeriesFrom([item('1', 'X', { read: true }), item('9', 'Fora da lista')], full)
    expect(result[0]).toMatchObject({ work_id: 'w', series_title: 'W', series_position: 3, read: true })
    expect(result[1]).toEqual(item('9', 'Fora da lista'))
  })

  it('item que já tem série (busca offline, pela lista completa) fica como está', () => {
    const searched = item('1', 'X', { work_id: 'w', series_title: 'W' })
    expect(withSeriesFrom([searched], [item('1', 'X', { work_id: 'outra', series_title: 'Outra' })])[0]).toBe(searched)
  })
})
