import { describe, expect, it } from 'vitest'
import {
  formatArrival,
  formatDate,
  formatTimestampDate,
  formatPrice,
  isoDateDaysBefore,
  isPriceInputValid,
  parsePrice,
  titleInitials,
  toIsoDate,
} from './format'

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

describe('formatTimestampDate', () => {
  it('usa o dia do fuso do aparelho, não o de UTC', () => {
    // 23h40 de 29/10 no fuso do aparelho; em Brasília, o texto em UTC já é dia 30.
    expect(formatTimestampDate(new Date(2026, 9, 29, 23, 40).toISOString())).toBe('29/10/2026')
    expect(formatTimestampDate(new Date(2026, 9, 30, 0, 10).toISOString())).toBe('30/10/2026')
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

describe('toIsoDate', () => {
  it('usa o dia local, não o de UTC', () => {
    // 23h do dia 5 no fuso do aparelho continua sendo o dia 5, qualquer que seja o fuso.
    expect(toIsoDate(new Date(2026, 2, 5, 23, 30))).toBe('2026-03-05')
    expect(toIsoDate(new Date(2026, 2, 5, 0, 5))).toBe('2026-03-05')
  })
})

describe('isoDateDaysBefore', () => {
  it('volta os dias atravessando mês e ano', () => {
    expect(isoDateDaysBefore(new Date(2026, 9, 27, 22, 0), 30)).toBe('2026-09-27')
    expect(isoDateDaysBefore(new Date(2026, 0, 10), 30)).toBe('2025-12-11')
    expect(isoDateDaysBefore(new Date(2026, 2, 1), 1)).toBe('2026-02-28')
  })
})

describe('formatArrival', () => {
  it('mostra dia e mês da chegada, e o preço quando há', () => {
    expect(formatArrival('2026-10-05', null)).toBe('Chegou em 05/10')
    expect(formatArrival('2026-10-05', 39.9)).toMatch(/^Chegou em 05\/10 · R\$\s39,90$/)
  })
})
