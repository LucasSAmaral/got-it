export type IsbnPrefixType =
  | 'isbn'
  | 'isbn-brasil'
  | 'periodico'
  | 'ean-brasil'
  | 'desconhecido'

/** Remove hífens e espaços, deixando só dígitos (e o X do ISBN-10). */
export function normalizeIsbn(input: string): string {
  return input.replace(/[\s-]/g, '').toUpperCase()
}

export function isValidIsbn10(isbn: string): boolean {
  const value = normalizeIsbn(isbn)
  if (!/^[0-9]{9}[0-9X]$/.test(value)) return false

  const sum = Array.from(value).reduce(
    (total, char, i) => total + (char === 'X' ? 10 : Number(char)) * (10 - i),
    0,
  )
  return sum % 11 === 0
}

/** Dígito verificador do ISBN-13 para os 12 primeiros dígitos de `core` (pesos alternados 1 e 3). */
function isbn13CheckDigit(core: string): number {
  const sum = Array.from(core.slice(0, 12)).reduce(
    (total, digit, i) => total + Number(digit) * (i % 2 === 0 ? 1 : 3),
    0,
  )
  return (10 - (sum % 10)) % 10
}

export function isValidIsbn13(isbn: string): boolean {
  const value = normalizeIsbn(isbn)
  if (!/^[0-9]{13}$/.test(value)) return false

  return isbn13CheckDigit(value) === Number(value[12])
}

export function isValidIsbn(isbn: string): boolean {
  const value = normalizeIsbn(isbn)
  if (value.length === 10) return isValidIsbn10(value)
  if (value.length === 13) return isValidIsbn13(value)
  return false
}

/** Converte um ISBN-10 válido para ISBN-13 (prefixo 978 + novo dígito verificador). */
export function convertIsbn10ToIsbn13(isbn10: string): string {
  const value = normalizeIsbn(isbn10)
  if (!isValidIsbn10(value)) {
    throw new Error(`ISBN-10 inválido: ${isbn10}`)
  }

  const core = `978${value.slice(0, 9)}`
  return `${core}${isbn13CheckDigit(core)}`
}

/** Normaliza e garante ISBN-13, convertendo a partir de ISBN-10 quando necessário. */
export function toIsbn13(isbn: string): string {
  const value = normalizeIsbn(isbn)
  if (value.length === 13 && isValidIsbn13(value)) return value
  if (value.length === 10 && isValidIsbn10(value)) return convertIsbn10ToIsbn13(value)
  throw new Error(`ISBN inválido: ${isbn}`)
}

/** Classifica o prefixo de um código de 13 dígitos (não exige que o dígito verificador seja válido). */
export function classifyIsbnPrefix(isbn13: string): IsbnPrefixType {
  const value = normalizeIsbn(isbn13)
  if (value.startsWith('97865') || value.startsWith('97885')) return 'isbn-brasil'
  if (value.startsWith('978') || value.startsWith('979')) return 'isbn'
  if (value.startsWith('977')) return 'periodico'
  if (value.startsWith('789') || value.startsWith('790')) return 'ean-brasil'
  return 'desconhecido'
}
