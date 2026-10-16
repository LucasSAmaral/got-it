/**
 * Caminho do arquivo no bucket a partir da URL pública da capa, ou `null` se a URL não for desse
 * bucket (ex.: capa externa colada à mão no banco). `publicPrefix` é a URL pública do bucket
 * terminada em `/` (`.../storage/v1/object/public/covers/`).
 */
export function coverPathFromUrl(url: string | null, publicPrefix: string): string | null {
  if (!url?.startsWith(publicPrefix)) return null
  const path = decodeURIComponent(url.slice(publicPrefix.length).split(/[?#]/)[0])
  return path || null
}
