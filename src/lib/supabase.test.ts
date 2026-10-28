import { describe, expect, it } from 'vitest'
import { isAnonymousDataRequest } from './supabase'

const BASE = 'https://projeto.supabase.co'
const ANON = 'chave-anonima'

describe('isAnonymousDataRequest', () => {
  it('recusa pedido a dados com a chave anônima como token', () => {
    expect(isAnonymousDataRequest(`${BASE}/rest/v1/copies?select=*`, `Bearer ${ANON}`, ANON)).toBe(true)
    expect(isAnonymousDataRequest(`${BASE}/rest/v1/rpc/search_my_collection`, `Bearer ${ANON}`, ANON)).toBe(true)
    expect(isAnonymousDataRequest(`${BASE}/storage/v1/object/covers/x.jpg`, `Bearer ${ANON}`, ANON)).toBe(true)
  })

  it('deixa passar as tabelas públicas da vitrine', () => {
    expect(isAnonymousDataRequest(`${BASE}/rest/v1/stores?slug=eq.lazarus`, `Bearer ${ANON}`, ANON)).toBe(false)
    expect(isAnonymousDataRequest(`${BASE}/rest/v1/store_arrivals?select=*`, `Bearer ${ANON}`, ANON)).toBe(false)
    expect(isAnonymousDataRequest(`${BASE}/rest/v1/stores`, `Bearer ${ANON}`, ANON)).toBe(false)
  })

  it('não confunde outra tabela com nome parecido com as públicas', () => {
    expect(isAnonymousDataRequest(`${BASE}/rest/v1/stores_secret`, `Bearer ${ANON}`, ANON)).toBe(true)
    expect(isAnonymousDataRequest(`${BASE}/rest/v1/editions?id=eq.stores`, `Bearer ${ANON}`, ANON)).toBe(true)
  })

  it('deixa passar pedidos com sessão e os de autenticação', () => {
    expect(isAnonymousDataRequest(`${BASE}/rest/v1/copies`, 'Bearer token-da-sessao', ANON)).toBe(false)
    expect(isAnonymousDataRequest(`${BASE}/auth/v1/token`, `Bearer ${ANON}`, ANON)).toBe(false)
  })
})
