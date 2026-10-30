/** Quantas capas de um colaborador estão em cada situação (vem da função `cover_contributors`). */
export interface ContributorCounts {
  approved: number
  rejected: number
  pending: number
  published: number
}

const LABELS: [keyof ContributorCounts, string, string][] = [
  ['approved', 'aprovada', 'aprovadas'],
  ['rejected', 'recusada', 'recusadas'],
  ['pending', 'na fila', 'na fila'],
  ['published', 'direta', 'diretas'],
]

/** "12 aprovadas · 1 recusada · 3 diretas", sem as situações que são zero. */
export function contributorStats(counts: ContributorCounts): string {
  return (
    LABELS.filter(([key]) => counts[key] > 0)
      .map(([key, one, many]) => `${counts[key]} ${counts[key] === 1 ? one : many}`)
      .join(' · ') || 'Nenhuma capa ainda'
  )
}
