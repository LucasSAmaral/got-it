const publisherKey = (name: string) => name.toLocaleLowerCase('pt-BR')

/**
 * Sugestões para o campo de editora: primeiro as que já estão no catálogo, da mais usada para a menos
 * usada, depois as comuns que ainda não apareceram, em ordem alfabética. Maiúsculas e minúsculas contam
 * como a mesma editora ("panini" e "Panini"); vale a grafia que aparece primeiro no catálogo.
 */
export function rankPublishers(catalog: readonly (string | null)[], common: readonly string[]): string[] {
  const names = catalog.map((name) => name?.trim() ?? '').filter((name) => name.length > 0)

  // Map mutado localmente: criar um Map novo a cada nome deixaria a contagem O(n²) sobre até 1000 edições.
  const counts = names.reduce((acc, name) => {
    const key = publisherKey(name)
    const seen = acc.get(key)
    return acc.set(key, { name: seen?.name ?? name, count: (seen?.count ?? 0) + 1 })
  }, new Map<string, { name: string; count: number }>())

  const byName = (a: string, b: string) => a.localeCompare(b, 'pt-BR')
  const fromCatalog = [...counts.values()]
    .toSorted((a, b) => b.count - a.count || byName(a.name, b.name))
    .map((entry) => entry.name)
  const missingCommon = common.filter((name) => !counts.has(publisherKey(name))).toSorted(byName)

  return [...fromCatalog, ...missingCommon]
}
