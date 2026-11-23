import { describe, expect, it } from 'vitest'
import { fillEmpty, isLookupableIsbn, matchPublisher, prefillFromLookup, tidyTitle, volumeFromTitle } from './isbnLookup'

describe('isLookupableIsbn', () => {
  it('só ISBN (978/979), não EAN de banca', () => {
    expect(isLookupableIsbn('9786525944463')).toBe(true)
    expect(isLookupableIsbn('9791234567896')).toBe(true)
    expect(isLookupableIsbn('7897653519576')).toBe(false)
    expect(isLookupableIsbn('9771234567003')).toBe(false)
  })
})

describe('tidyTitle', () => {
  it('título todo em maiúsculas ganha caixa de título, com as palavras curtas em minúsculas', () => {
    expect(tidyTitle('ABSOLUTE BATMAN 03')).toBe('Absolute Batman 03')
    expect(tidyTitle('COLECAO CLASSICA MARVEL: NOVA FASE VOL.31')).toBe('Colecao Classica Marvel: Nova Fase Vol.31')
    expect(tidyTitle('A SAGA DO LANTERNA VERDE')).toBe('A Saga do Lanterna Verde')
  })

  it('título com minúsculas fica como veio (só tira espaço sobrando)', () => {
    expect(tidyTitle('  A saga do Homem-Aranha  vol. 9 ')).toBe('A saga do Homem-Aranha vol. 9')
  })
})

describe('volumeFromTitle', () => {
  it.each([
    ['A saga do Homem-Aranha vol. 9', '9'],
    ['Ultimate Homem-Aranha (2025) Vol.04', '4'],
    ['Absolute Lanterna Verde N.05', '5'],
    ['Absolute Superman 01', '1'],
    ['Poder Absoluto Vol.02', '2'],
    ['Saga nº 12', '12'],
    ['Invencível #3', '3'],
  ])('%s → %s', (title, volume) => {
    expect(volumeFromTitle(title)).toBe(volume)
  })

  it('sem número no fim, ou ano de 4 dígitos, fica vazio', () => {
    expect(volumeFromTitle('Frieren e a jornada para o além')).toBe('')
    expect(volumeFromTitle('Batman 1989')).toBe('')
    expect(volumeFromTitle('Batman: Neve - A origem do Senhor Frio')).toBe('')
  })
})

describe('matchPublisher', () => {
  const known = ['Panini', 'Eaglemoss', 'Pipoca & Nanquim']

  it('usa a grafia do catálogo quando o nome começa pela editora conhecida', () => {
    expect(matchPublisher('Panini Comics', known)).toBe('Panini')
    expect(matchPublisher('Eaglemoss Collections', known)).toBe('Eaglemoss')
    expect(matchPublisher('PANINI', known)).toBe('Panini')
  })

  it('de/para pelo nome inteiro, sem diferenciar caixa (razão social na CBL)', () => {
    const aliases = { 'editora planeta deagostini do brasil ltda': 'Eaglemoss' }
    expect(matchPublisher('EDITORA PLANETA DEAGOSTINI DO BRASIL LTDA', known, aliases)).toBe('Eaglemoss')
    expect(matchPublisher('Editora Planeta DeAgostini  do Brasil Ltda', known, aliases)).toBe('Eaglemoss')
    expect(matchPublisher('Editora Planeta', known, aliases)).toBe('Editora Planeta')
  })

  it('não confunde começo de palavra e mantém a desconhecida', () => {
    expect(matchPublisher('Paninis Editora', known)).toBe('Paninis Editora')
    expect(matchPublisher(' Editora Nova ', known)).toBe('Editora Nova')
  })
})

describe('prefillFromLookup', () => {
  it('título arrumado, editora do catálogo, volume do título e ano', () => {
    expect(
      prefillFromLookup({ title: 'ABSOLUTE CACADOR DE MARTE 02', publisher: 'Panini Comics', year: 2025 }, ['Panini']),
    ).toEqual({ title: 'Absolute Cacador de Marte 02', publisher: 'Panini', volume: '2', year: '2025' })
  })

  it('título sem o nome da história e editora pelo de/para', () => {
    expect(
      prefillFromLookup(
        { title: 'DC Books Batman - Volume 52', publisher: 'EDITORA PLANETA DEAGOSTINI DO BRASIL LTDA', year: null },
        ['Eaglemoss'],
        { 'editora planeta deagostini do brasil ltda': 'Eaglemoss' },
      ),
    ).toEqual({ title: 'DC Books Batman - Volume 52', publisher: 'Eaglemoss', volume: '52', year: '' })
  })

  it('campos ausentes ou ano estranho viram vazio', () => {
    expect(prefillFromLookup({ title: null, publisher: null, year: 0 }, [])).toEqual({
      title: '',
      publisher: '',
      volume: '',
      year: '',
    })
  })
})

describe('fillEmpty', () => {
  const prefill = { title: 'Absolute Batman 03', publisher: 'Panini', volume: '3', year: '2025' }

  it('preenche os vazios e não toca no que a pessoa digitou nem nos outros campos', () => {
    const form = { title: '', publisher: 'Outra', volume: ' ', year: '', series: 'Absolute Batman' }
    expect(fillEmpty(form, prefill)).toEqual({
      title: 'Absolute Batman 03',
      publisher: 'Outra',
      volume: '3',
      year: '2025',
      series: 'Absolute Batman',
    })
  })

  it('prefill vazio não muda nada (mesmo objeto)', () => {
    const form = { title: '', publisher: '', volume: '', year: '' }
    expect(fillEmpty(form, { title: '', publisher: '', volume: '', year: '' })).toBe(form)
  })
})
