import { describe, expect, it } from 'vitest'
import type { CollectionItem } from '../types/catalog'
import { searchLocal, wordSimilarity } from './localSearch'

// Os valores esperados vieram de um Postgres 16 com pg_trgm, aplicando as migrações do projeto
// (search_my_collection). Se essa função mudar no servidor, gere os valores de novo.

const ITEMS: CollectionItem[] = [
  ['Watchmen', 'Panini', '9786555121001'],
  ['Batman: Ano Um', 'Panini', '9786555121002'],
  ['Batman: Ano Dois', 'Panini', '9786555121003'],
  ['Dragon Ball Super 8', 'Panini', '9786555121008'],
  ['The Sandman: Prelúdios e Noturnos', 'Vertigo', '9786555121009'],
  ['Homem-Aranha: Azul', 'Panini', '9786555121012'],
  ['Liga da Justiça: Origem', 'Panini', '9786555121013'],
  ['One Piece 100', 'Panini', '9786555121014'],
  ['One Piece 101', 'Panini', '9786555121015'],
  ['Persépolis', 'Quadrinhos na Cia.', '9788535909999'],
  ['Maus', 'Companhia das Letras', '9788535914849'],
  ['Naruto Vol. 1', 'Panini', '9788542600010'],
  ['Naruto Vol. 2', 'Panini', '9788542600011'],
  ['Coringa', 'Devir', '9788575321016'],
  ['X-Men Vol. 1', 'Panini', '9788583682004'],
  ['Turma da Mônica Jovem 12', 'Panini', '9788583682005'],
  ['Turma da Monica 45', 'Mauricio de Sousa Editora', '9788583682006'],
  ['Dragon Ball Z 42', 'JBC', '9788583682007'],
  ['Akira Vol. 3', 'JBC', '9788583682017'],
  ['HQ Especial 2024', null, null],
]
  .map(([title, publisher, isbn13], index) => ({
    copy_id: `copy-${index}`,
    edition_id: `edition-${index}`,
    title: title as string,
    publisher: publisher as string | null,
    isbn13: isbn13 as string | null,
    volume: null,
    cover_url: null,
    status: 'collection',
    condition: null,
    acquired_at: null,
  }))

const SIMILARITY: [string, string, number][] = [
  ['watchmen', 'Watchmen', 1],
  ['watchmn', 'Watchmen', 0.75],
  ['bat', 'Batman: Ano Um', 0.75],
  ['ano um', 'Batman: Ano Um', 1],
  ['x', 'X-Men Vol. 1', 1],
  ['xmen', 'X-Men Vol. 1', 0.4],
  ['monica', 'Turma da Mônica Jovem 12', 0.42857143],
  ['mônica', 'Turma da Mônica Jovem 12', 1],
  ['turma da monica', 'Turma da Monica 45', 1],
  ['pani', 'Panini', 0.8],
  ['drgon bal', 'Dragon Ball Z 42', 0.53846157],
  ['42', 'Dragon Ball Z 42', 1],
  ['sandman', 'The Sandman: Prelúdios e Noturnos', 1],
  ['preludios', 'The Sandman: Prelúdios e Noturnos', 0.53846157],
  ['aranha', 'Homem-Aranha: Azul', 1],
  ['homem aranha', 'Homem-Aranha: Azul', 1],
  ['liga justica', 'Liga da Justiça: Origem', 0.625],
  ['onepiece', 'One Piece 100', 0.5833333],
  ['batman!!', 'Batman', 1],
  ['BATMAN', 'batman', 1],
  ['ção', 'Ação', 0.5],
  ['a b c', 'A B C', 1],
  ['o', 'Coringa', 0],
  ['zzzzzz', 'Maus', 0],
  ['1984', '1984', 1],
]

/** [busca, resultados na ordem do servidor como [título, similaridade, ISBN exato]] */
const SEARCHES: [string, [string, number, boolean][]][] = [
  ['watchmen', [['Watchmen', 1, false]]],
  ['watchmn', [['Watchmen', 0.75, false]]],
  ['batman', [['Batman: Ano Um', 1, false], ['Batman: Ano Dois', 1, false], ['Dragon Ball Z 42', 0.2857143, false], ['Dragon Ball Super 8', 0.2857143, false], ['The Sandman: Prelúdios e Noturnos', 0.2857143, false]]],
  ['ano um', [['Batman: Ano Um', 1, false], ['Batman: Ano Dois', 0.5714286, false]]],
  ['x men', [['X-Men Vol. 1', 1, false], ['Watchmen', 0.33333334, false]]],
  ['monica', [['Turma da Monica 45', 1, false], ['Turma da Mônica Jovem 12', 0.42857143, false]]],
  ['mônica', [['Turma da Mônica Jovem 12', 1, false], ['Turma da Monica 45', 0.42857143, false]]],
  ['pani', [['Watchmen', 0.8, false], ['Batman: Ano Um', 0.8, false], ['Batman: Ano Dois', 0.8, false], ['X-Men Vol. 1', 0.8, false], ['Turma da Mônica Jovem 12', 0.8, false], ['Dragon Ball Super 8', 0.8, false], ['Naruto Vol. 1', 0.8, false], ['Naruto Vol. 2', 0.8, false], ['Homem-Aranha: Azul', 0.8, false], ['Liga da Justiça: Origem', 0.8, false], ['One Piece 100', 0.8, false], ['One Piece 101', 0.8, false]]],
  ['dragon ball', [['Dragon Ball Z 42', 1, false], ['Dragon Ball Super 8', 1, false]]],
  ['drgon bal', [['Dragon Ball Z 42', 0.53846157, false], ['Dragon Ball Super 8', 0.53846157, false]]],
  ['42', [['Dragon Ball Z 42', 1, false], ['Turma da Monica 45', 0.33333334, false]]],
  ['978', [['Watchmen', 0, false], ['Batman: Ano Um', 0, false], ['Batman: Ano Dois', 0, false], ['X-Men Vol. 1', 0, false], ['Turma da Mônica Jovem 12', 0, false], ['Turma da Monica 45', 0, false], ['Dragon Ball Z 42', 0, false], ['Dragon Ball Super 8', 0, false], ['The Sandman: Prelúdios e Noturnos', 0, false], ['Naruto Vol. 1', 0, false], ['Naruto Vol. 2', 0, false], ['Homem-Aranha: Azul', 0, false], ['Liga da Justiça: Origem', 0, false], ['One Piece 100', 0, false], ['One Piece 101', 0, false], ['Coringa', 0, false], ['Akira Vol. 3', 0, false], ['Maus', 0, false], ['Persépolis', 0, false]]],
  ['97865', [['Watchmen', 0, false], ['Batman: Ano Um', 0, false], ['Batman: Ano Dois', 0, false], ['Dragon Ball Super 8', 0, false], ['The Sandman: Prelúdios e Noturnos', 0, false], ['Homem-Aranha: Azul', 0, false], ['Liga da Justiça: Origem', 0, false], ['One Piece 100', 0, false], ['One Piece 101', 0, false]]],
  ['9788535914849', [['Maus', 0, true]]],
  ['978-65-5512-1001', [['Watchmen', 0, true]]],
  ['sandman', [['The Sandman: Prelúdios e Noturnos', 1, false]]],
  ['preludios', [['The Sandman: Prelúdios e Noturnos', 0.53846157, false]]],
  ['homem aranha', [['Homem-Aranha: Azul', 1, false]]],
  ['aranha', [['Homem-Aranha: Azul', 1, false]]],
  ['liga justica', [['Liga da Justiça: Origem', 0.625, false]]],
  ['one piece', [['One Piece 100', 1, false], ['One Piece 101', 1, false]]],
  ['jbc', [['Dragon Ball Z 42', 1, false], ['Akira Vol. 3', 1, false]]],
  ['zzzzzz', []],
  ['o', [['Liga da Justiça: Origem', 0.5, false], ['One Piece 100', 0.5, false], ['One Piece 101', 0.5, false]]],
  ['ção', []],
  ['acao', []],
  ['hq', [['HQ Especial 2024', 1, false], ['Homem-Aranha: Azul', 0.33333334, false]]],
  ['2024', [['HQ Especial 2024', 1, false]]],
  ['BATMAN', [['Batman: Ano Um', 1, false], ['Batman: Ano Dois', 1, false], ['Dragon Ball Z 42', 0.2857143, false], ['Dragon Ball Super 8', 0.2857143, false], ['The Sandman: Prelúdios e Noturnos', 0.2857143, false]]],
  ['batman!!', [['Batman: Ano Um', 1, false], ['Batman: Ano Dois', 1, false], ['Dragon Ball Z 42', 0.2857143, false], ['Dragon Ball Super 8', 0.2857143, false], ['The Sandman: Prelúdios e Noturnos', 0.2857143, false]]],
]

describe('wordSimilarity', () => {
  it.each(SIMILARITY)('%j contra %j dá o mesmo valor do pg_trgm', (query, text, expected) => {
    expect(wordSimilarity(query, text)).toBeCloseTo(expected, 5)
  })
})

describe('searchLocal', () => {
  it.each(SEARCHES)('%j devolve o mesmo que search_my_collection', (term, expected) => {
    const local = searchLocal(ITEMS, term)

    // Mesmos resultados, sem depender da ordem entre empates (o Postgres não define uma).
    expect(local.map((item) => item.title).sort()).toEqual(expected.map(([title]) => title).sort())

    // Mesma ordem de prioridade: ISBN exato primeiro e depois similaridade decrescente.
    const digits = term.replace(/[^0-9]/g, '')
    const localKeys = local.map((item) => [
      digits !== '' && item.isbn13 === digits,
      Math.max(wordSimilarity(term, item.title), wordSimilarity(term, item.publisher ?? '')),
    ])
    expected.forEach(([, similarity, exact], index) => {
      expect(localKeys[index]![0]).toBe(exact)
      expect(localKeys[index]![1] as number).toBeCloseTo(similarity, 5)
    })
  })

  it('sem termo devolve a lista inteira, na mesma ordem', () => {
    expect(searchLocal(ITEMS, '')).toBe(ITEMS)
    expect(searchLocal(ITEMS, '   ')).toBe(ITEMS)
  })

  it('não altera a lista original', () => {
    const before = ITEMS.map((item) => item.title)
    searchLocal(ITEMS, 'batman')
    expect(ITEMS.map((item) => item.title)).toEqual(before)
  })
})
