import { describe, expect, it } from 'vitest'
import { coverPathFromUrl } from './covers'

const PREFIX = 'https://abc.supabase.co/storage/v1/object/public/covers/'

describe('coverPathFromUrl', () => {
  it('extrai o caminho do arquivo da URL pública', () => {
    expect(coverPathFromUrl(`${PREFIX}9786555123456-1760000000000.jpg`, PREFIX)).toBe(
      '9786555123456-1760000000000.jpg',
    )
  })

  it('ignora query string e decodifica o caminho', () => {
    expect(coverPathFromUrl(`${PREFIX}capa%20nova.jpg?t=1`, PREFIX)).toBe('capa nova.jpg')
  })

  it('devolve null para URL de outro lugar, vazia ou sem arquivo', () => {
    expect(coverPathFromUrl('https://exemplo.com/capa.jpg', PREFIX)).toBeNull()
    expect(coverPathFromUrl('https://abc.supabase.co/storage/v1/object/public/outro/capa.jpg', PREFIX)).toBeNull()
    expect(coverPathFromUrl(null, PREFIX)).toBeNull()
    expect(coverPathFromUrl(PREFIX, PREFIX)).toBeNull()
  })
})
