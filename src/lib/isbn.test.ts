import { describe, expect, it } from 'vitest'
import {
  classifyIsbnPrefix,
  convertIsbn10ToIsbn13,
  isValidIsbn,
  isValidIsbn10,
  isValidIsbn13,
  normalizeIsbn,
  toIsbn13,
} from './isbn'

describe('normalizeIsbn', () => {
  it('remove hífens e espaços', () => {
    expect(normalizeIsbn('978-85-359-1484-9')).toBe('9788535914849')
    expect(normalizeIsbn('0 306 40615 2')).toBe('0306406152')
  })

  it('deixa o X do ISBN-10 maiúsculo', () => {
    expect(normalizeIsbn('0-8044-2957-x')).toBe('080442957X')
  })
})

describe('isValidIsbn10', () => {
  it('aceita ISBN-10 válido', () => {
    expect(isValidIsbn10('0306406152')).toBe(true)
    expect(isValidIsbn10('0-306-40615-2')).toBe(true)
  })

  it('aceita ISBN-10 válido terminado em X', () => {
    expect(isValidIsbn10('080442957X')).toBe(true)
  })

  it('rejeita dígito verificador incorreto', () => {
    expect(isValidIsbn10('0306406151')).toBe(false)
  })

  it('rejeita formato inválido', () => {
    expect(isValidIsbn10('12345')).toBe(false)
  })
})

describe('isValidIsbn13', () => {
  it('aceita ISBN-13 válido', () => {
    expect(isValidIsbn13('9780306406157')).toBe(true)
    expect(isValidIsbn13('978-85-359-1484-9')).toBe(true)
  })

  it('rejeita dígito verificador incorreto', () => {
    expect(isValidIsbn13('9780306406158')).toBe(false)
  })

  it('rejeita formato inválido', () => {
    expect(isValidIsbn13('123')).toBe(false)
  })
})

describe('isValidIsbn', () => {
  it('valida tanto ISBN-10 quanto ISBN-13', () => {
    expect(isValidIsbn('0306406152')).toBe(true)
    expect(isValidIsbn('9780306406157')).toBe(true)
  })

  it('rejeita tamanho que não é 10 nem 13', () => {
    expect(isValidIsbn('123456789012')).toBe(false)
  })
})

describe('convertIsbn10ToIsbn13', () => {
  it('converte corretamente, incluindo o novo dígito verificador', () => {
    expect(convertIsbn10ToIsbn13('0306406152')).toBe('9780306406157')
  })

  it('lança erro para ISBN-10 inválido', () => {
    expect(() => convertIsbn10ToIsbn13('0306406151')).toThrow()
  })
})

describe('toIsbn13', () => {
  it('mantém um ISBN-13 já válido', () => {
    expect(toIsbn13('978-0-306-40615-7')).toBe('9780306406157')
  })

  it('converte um ISBN-10 válido', () => {
    expect(toIsbn13('0-306-40615-2')).toBe('9780306406157')
  })

  it('lança erro para entrada inválida', () => {
    expect(() => toIsbn13('não é isbn')).toThrow()
  })
})

describe('classifyIsbnPrefix', () => {
  it('classifica 978/979 como ISBN comum', () => {
    expect(classifyIsbnPrefix('9780306406157')).toBe('isbn')
    expect(classifyIsbnPrefix('9790000000000')).toBe('isbn')
  })

  it('classifica 97865 e 97885 como ISBN Brasil', () => {
    expect(classifyIsbnPrefix('9788535914849')).toBe('isbn-brasil')
    expect(classifyIsbnPrefix('9786500000016')).toBe('isbn-brasil')
  })

  it('classifica 977 como periódico', () => {
    expect(classifyIsbnPrefix('9770000000000')).toBe('periodico')
  })

  it('classifica 789/790 como EAN Brasil', () => {
    expect(classifyIsbnPrefix('7890000000000')).toBe('ean-brasil')
    expect(classifyIsbnPrefix('7900000000000')).toBe('ean-brasil')
  })

  it('classifica outros prefixos como desconhecido', () => {
    expect(classifyIsbnPrefix('1234567890123')).toBe('desconhecido')
  })
})
