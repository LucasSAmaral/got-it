import { describe, expect, it } from 'vitest'
import { describeScan, interpretBarcode } from './barcode'

describe('interpretBarcode', () => {
  it('aceita ISBN-13 lido da capa', () => {
    expect(interpretBarcode('9788535914849')).toEqual({
      kind: 'isbn',
      code: '9788535914849',
      prefix: 'isbn-brasil',
    })
  })

  it('reconhece ISBN brasileiro com prefixo 978-65', () => {
    expect(interpretBarcode('9786555124194')).toEqual({
      kind: 'isbn',
      code: '9786555124194',
      prefix: 'isbn-brasil',
    })
  })

  it('descarta o suplemento de preço que vem depois do ISBN', () => {
    // 13 dígitos + add-on de 5 (EAN-5) e de 2 (EAN-2)
    expect(interpretBarcode('978853591484951299').code).toBe('9788535914849')
    expect(interpretBarcode('978853591484901').code).toBe('9788535914849')
  })

  it('ignora hífens e espaços da leitura', () => {
    expect(interpretBarcode('978-85-359-1484-9').code).toBe('9788535914849')
  })

  it('aceita código de periódico de banca como EAN, não como ISBN', () => {
    expect(interpretBarcode('9771234567003')).toEqual({
      kind: 'ean',
      code: '9771234567003',
      prefix: 'periodico',
    })
  })

  it('aceita EAN brasileiro de gibi sem ISBN', () => {
    expect(interpretBarcode('7891234567895')).toEqual({
      kind: 'ean',
      code: '7891234567895',
      prefix: 'ean-brasil',
    })
  })

  it('recusa código com dígito verificador errado', () => {
    const result = interpretBarcode('9788535914840')
    expect(result.kind).toBe('invalido')
    if (result.kind === 'invalido') {
      expect(result.reason).toMatch(/incompleta/)
    }
  })

  it('recusa código curto demais para ser de um gibi', () => {
    expect(interpretBarcode('12345678').kind).toBe('invalido')
  })

  it('recusa leitura com letras', () => {
    expect(interpretBarcode('ABC1234567890').kind).toBe('invalido')
  })
})

describe('describeScan', () => {
  it('nomeia cada tipo de código aceito', () => {
    expect(describeScan({ kind: 'isbn', code: '9786555124194', prefix: 'isbn-brasil' })).toBe('ISBN brasileiro')
    expect(describeScan({ kind: 'isbn', code: '9780306406157', prefix: 'isbn' })).toBe('ISBN')
    expect(describeScan({ kind: 'ean', code: '9771234567003', prefix: 'periodico' })).toBe(
      'Código de periódico (banca)',
    )
    expect(describeScan({ kind: 'ean', code: '7891234567895', prefix: 'ean-brasil' })).toBe(
      'Código EAN brasileiro',
    )
  })
})
