import { describe, expect, it } from 'vitest'
import { formatDate, formatPrice, isPriceInputValid, parsePrice, titleInitials } from './format'

describe('titleInitials', () => {
  it('pega a inicial das duas primeiras palavras, em maiúscula', () => {
    expect(titleInitials('absolute Batman 6')).toBe('AB')
  })

  it('ignora espaços repetidos e o travessão', () => {
    expect(titleInitials('  Watchmen  —  Edição Definitiva')).toBe('WE')
  })

  it('título de uma palavra tem uma inicial', () => {
    expect(titleInitials('Watchmen')).toBe('W')
  })
})

describe('formatDate', () => {
  it('converte a data do Postgres para dd/mm/aaaa sem mudar o dia pelo fuso', () => {
    expect(formatDate('2026-03-05')).toBe('05/03/2026')
    expect(formatDate('2026-01-01')).toBe('01/01/2026')
  })
})

describe('formatPrice', () => {
  // O Intl separa "R$" do número com espaço não separável (U+00A0).
  it('formata em reais com vírgula decimal', () => {
    expect(formatPrice(49.9)).toBe('R$ 49,90')
    expect(formatPrice(1234.5)).toBe('R$ 1.234,50')
  })
})

describe('parsePrice', () => {
  it('aceita o formato brasileiro, com ou sem R$', () => {
    expect(parsePrice('39,90')).toBe(39.9)
    expect(parsePrice('R$ 39,90')).toBe(39.9)
    expect(parsePrice('R$\u00a039,90')).toBe(39.9)
    expect(parsePrice('r$39,9')).toBe(39.9)
    expect(parsePrice(' 39 ')).toBe(39)
    expect(parsePrice('1.234,50')).toBe(1234.5)
    expect(parsePrice('0,50')).toBe(0.5)
  })

  it('aceita ponto decimal e reconhece ponto de milhar sem vírgula', () => {
    expect(parsePrice('39.90')).toBe(39.9)
    expect(parsePrice('39.9')).toBe(39.9)
    expect(parsePrice('1.500')).toBe(1500)
    expect(parsePrice('1.234.567')).toBe(1234567)
  })

  it('recusa o que não é preço', () => {
    expect(parsePrice('')).toBeNull()
    expect(parsePrice('R$')).toBeNull()
    expect(parsePrice('abc')).toBeNull()
    expect(parsePrice('-10')).toBeNull()
    expect(parsePrice('39,999')).toBeNull()
    expect(parsePrice('39,90,1')).toBeNull()
    expect(parsePrice('1,234.50')).toBeNull()
    expect(parsePrice('100000000')).toBeNull()
  })

  it('volta ao mesmo número a partir do texto que o formulário de edição preenche', () => {
    expect(parsePrice((25.9).toFixed(2).replace('.', ','))).toBe(25.9)
  })
})

describe('isPriceInputValid', () => {
  it('aceita vazio (preço é opcional) e preço válido; recusa o resto', () => {
    expect(isPriceInputValid('')).toBe(true)
    expect(isPriceInputValid('  ')).toBe(true)
    expect(isPriceInputValid('R$ 39,90')).toBe(true)
    expect(isPriceInputValid('R$')).toBe(false)
    expect(isPriceInputValid('39,999')).toBe(false)
  })
})
