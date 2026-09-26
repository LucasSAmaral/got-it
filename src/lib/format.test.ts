import { describe, expect, it } from 'vitest'
import { formatDate, formatPrice, titleInitials } from './format'

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
