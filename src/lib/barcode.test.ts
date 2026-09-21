import { describe, expect, it } from 'vitest'
import { createScanConfirmer, describeScan, interpretBarcode } from './barcode'

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

describe('createScanConfirmer', () => {
  const A = '9788535914849'
  const B = '9786555124194'

  it('não aceita na primeira leitura e aceita na segunda igual', () => {
    const confirm = createScanConfirmer(2)
    expect(confirm(A, 0)).toBe(false)
    expect(confirm(A, 200)).toBe(true)
  })

  it('descarta um código errado lido uma única vez no meio das leituras certas', () => {
    const confirm = createScanConfirmer(2)
    expect(confirm(B, 0)).toBe(false) // reflexo: código válido, mas errado
    expect(confirm(A, 200)).toBe(false) // volta ao certo: recomeça a contagem
    expect(confirm(A, 400)).toBe(true)
  })

  it('alternar entre dois códigos nunca confirma nenhum', () => {
    const confirm = createScanConfirmer(2)
    const results = [A, B, A, B, A, B].map((code, i) => confirm(code, i * 200))
    expect(results.every((confirmed) => !confirmed)).toBe(true)
  })

  it('não conta frames sem leitura: só as leituras, dentro do intervalo máximo', () => {
    const confirm = createScanConfirmer(2, 2000)
    expect(confirm(A, 0)).toBe(false)
    expect(confirm(A, 1500)).toBe(true) // houve frames sem código no meio, e tudo bem
  })

  it('zera a contagem quando a leitura anterior ficou velha demais', () => {
    const confirm = createScanConfirmer(2, 2000)
    expect(confirm(A, 0)).toBe(false)
    expect(confirm(A, 5000)).toBe(false)
    expect(confirm(A, 5300)).toBe(true)
  })

  it('respeita um número maior de confirmações', () => {
    const confirm = createScanConfirmer(3)
    expect([0, 200, 400].map((t) => confirm(A, t))).toEqual([false, false, true])
  })

  it('com 1 confirmação aceita na hora', () => {
    expect(createScanConfirmer(1)(A, 0)).toBe(true)
  })

  it('mantém confirmado se o mesmo código continuar sendo lido', () => {
    const confirm = createScanConfirmer(2)
    confirm(A, 0)
    expect(confirm(A, 200)).toBe(true)
    expect(confirm(A, 400)).toBe(true)
  })
})
