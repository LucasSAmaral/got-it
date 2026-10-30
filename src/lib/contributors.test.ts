import { describe, expect, it } from 'vitest'
import { contributorStats } from './contributors'

describe('contributorStats', () => {
  it('junta as situações com contagem, no singular ou no plural', () => {
    expect(contributorStats({ approved: 12, rejected: 1, pending: 0, published: 3 })).toBe(
      '12 aprovadas · 1 recusada · 3 diretas',
    )
    expect(contributorStats({ approved: 1, rejected: 0, pending: 2, published: 0 })).toBe('1 aprovada · 2 na fila')
  })

  it('sem nenhuma capa', () => {
    expect(contributorStats({ approved: 0, rejected: 0, pending: 0, published: 0 })).toBe('Nenhuma capa ainda')
  })
})
