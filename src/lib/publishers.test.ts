import { describe, expect, it } from 'vitest'
import { rankPublishers } from './publishers'

describe('rankPublishers', () => {
  it('ordena as do catálogo pela quantidade de edições', () => {
    expect(rankPublishers(['Eaglemoss', 'Panini', 'Panini', 'Mythos', 'Panini', 'Mythos'], [])).toEqual([
      'Panini',
      'Mythos',
      'Eaglemoss',
    ])
  })

  it('desempata em ordem alfabética', () => {
    expect(rankPublishers(['Veneta', 'Devir'], [])).toEqual(['Devir', 'Veneta'])
  })

  it('junta maiúsculas e minúsculas, mantendo a primeira grafia do catálogo', () => {
    expect(rankPublishers(['Panini', 'panini', ' PANINI ', 'JBC'], [])).toEqual(['Panini', 'JBC'])
  })

  it('ignora editora vazia ou nula', () => {
    expect(rankPublishers([null, '', '   ', 'Panini'], [])).toEqual(['Panini'])
  })

  it('acrescenta as comuns que faltam, depois das do catálogo e em ordem alfabética', () => {
    expect(rankPublishers(['Panini'], ['NewPOP', 'panini', 'JBC'])).toEqual(['Panini', 'JBC', 'NewPOP'])
  })

  it('sem catálogo, devolve só as comuns', () => {
    expect(rankPublishers([], ['Mythos', 'Devir'])).toEqual(['Devir', 'Mythos'])
  })
})
