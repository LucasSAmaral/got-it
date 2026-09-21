import { classifyIsbnPrefix, isValidIsbn13, normalizeIsbn, type IsbnPrefixType } from './isbn'

export type ScanResult =
  /** Código de livro: 978/979, com dígito verificador válido. Serve como isbn13. */
  | { kind: 'isbn'; code: string; prefix: IsbnPrefixType }
  /** EAN-13 válido que não é ISBN (periódico de banca, EAN Brasil). Dá para catalogar assim mesmo. */
  | { kind: 'ean'; code: string; prefix: IsbnPrefixType }
  | { kind: 'invalido'; code: string; reason: string }

/** Leitura que dá para usar como código da edição. */
export type AcceptedScan = Extract<ScanResult, { kind: 'isbn' | 'ean' }>

/**
 * Códigos de livro costumam vir com um suplemento de 2 ou 5 dígitos (preço, edição).
 * O que identifica a edição são os 13 primeiros.
 */
function stripAddOn(digits: string): string {
  if (digits.length === 15 || digits.length === 18) return digits.slice(0, 13)
  return digits
}

/** Interpreta o que a câmera leu e decide se dá para usar como código da edição. */
export function interpretBarcode(raw: string): ScanResult {
  const code = stripAddOn(normalizeIsbn(raw))

  if (!/^[0-9]+$/.test(code)) {
    return { kind: 'invalido', code, reason: 'Esse código não parece o de um gibi.' }
  }
  if (code.length !== 13) {
    return { kind: 'invalido', code, reason: 'Esse código não parece o de um gibi.' }
  }
  if (!isValidIsbn13(code)) {
    return { kind: 'invalido', code, reason: 'A leitura saiu incompleta. Tenta de novo.' }
  }

  const prefix = classifyIsbnPrefix(code)
  if (prefix === 'isbn' || prefix === 'isbn-brasil') {
    return { kind: 'isbn', code, prefix }
  }
  return { kind: 'ean', code, prefix }
}

/** Rótulo curto para mostrar na tela o que a câmera leu. */
export function describeScan(result: AcceptedScan): string {
  switch (result.prefix) {
    case 'isbn-brasil':
      return 'ISBN brasileiro'
    case 'isbn':
      return 'ISBN'
    case 'periodico':
      return 'Código de periódico (banca)'
    case 'ean-brasil':
      return 'Código EAN brasileiro'
    default:
      return 'Código lido'
  }
}

/**
 * Reflexo e curvatura do plástico às vezes produzem um código errado que passa no dígito verificador.
 * Um erro assim raramente se repete, então só aceitamos um código lido `required` vezes seguidas,
 * sem outro código no meio e com no máximo `maxGapMs` entre uma leitura e a próxima.
 * Frames sem leitura não contam: não zeram nem somam.
 */
export function createScanConfirmer(required = 2, maxGapMs = 2000) {
  let lastCode = ''
  let count = 0
  let lastReadAt = 0

  return (code: string, now = Date.now()): boolean => {
    if (code === lastCode && now - lastReadAt <= maxGapMs) {
      count += 1
    } else {
      lastCode = code
      count = 1
    }
    lastReadAt = now
    return count >= required
  }
}
