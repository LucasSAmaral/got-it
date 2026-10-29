import { describe, expect, it } from 'vitest'
import { authErrorMessage, normalizeOtp, safeNextPath } from './auth'

describe('authErrorMessage', () => {
  it('traduz códigos conhecidos', () => {
    expect(authErrorMessage({ code: 'otp_expired', message: 'Token has expired or is invalid' })).toMatch(
      /Código incorreto ou vencido/,
    )
  })

  it('usa a mensagem original quando o código é desconhecido ou falta', () => {
    expect(authErrorMessage({ code: 'unexpected', message: 'Falhou' })).toBe('Falhou')
    expect(authErrorMessage({ message: 'Falhou' })).toBe('Falhou')
  })
})

describe('normalizeOtp', () => {
  it('fica só com os dígitos', () => {
    expect(normalizeOtp(' 123 456 ')).toBe('123456')
    expect(normalizeOtp('12-34a')).toBe('1234')
  })

  it('corta no tamanho do código', () => {
    expect(normalizeOtp('12345678')).toBe('123456')
  })
})

describe('safeNextPath', () => {
  it('aceita caminho interno', () => {
    expect(safeNextPath('/loja/lazarus')).toBe('/loja/lazarus')
  })

  it('recusa outro site e volta para o início', () => {
    expect(safeNextPath('//outro.site')).toBe('/')
    expect(safeNextPath('https://outro.site')).toBe('/')
    expect(safeNextPath(null)).toBe('/')
  })
})
