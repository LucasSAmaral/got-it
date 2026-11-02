import { describe, expect, it } from 'vitest'
import { CHANGELOG } from './changelog'

// Lida do package.json pelo vite.config.ts (o Vitest usa o mesmo `define`).
const version = __APP_VERSION__

describe('CHANGELOG', () => {
  // Subiu a versão sem escrever a novidade? Falha aqui, antes do push (skill publicar-versao). A entrada pode
  // ser escrita antes de o número subir (fica no topo, à frente do package.json), mas nunca faltar.
  it('tem a versão do package.json, e nada mais antigo no topo', () => {
    const versions = CHANGELOG.map((entry) => entry.version)
    expect(versions).toContain(version)
    expect(versions.indexOf(version)).toBeLessThanOrEqual(1)
  })

  it('tem versões únicas, da mais nova para a mais antiga', () => {
    const numbers = CHANGELOG.map((entry) => entry.version.split('.').map(Number))
    numbers.slice(1).forEach((current, index) => {
      const previous = numbers[index]!
      const diff = previous.map((part, i) => part - current[i]!).find((d) => d !== 0)
      expect(diff).toBeGreaterThan(0)
    })
  })

  it('toda versão tem data no formato do Postgres e pelo menos uma frase', () => {
    CHANGELOG.forEach((entry) => {
      expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(entry.items.length).toBeGreaterThan(0)
    })
  })
})
