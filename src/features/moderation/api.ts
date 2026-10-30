import { supabase } from '../../lib/supabase'
import { removeCoverImage, uploadCoverBlob } from '../register/api'
import type { Edition } from '../../types/catalog'
import type { EditionSummary } from '../admin/api'

export type ReportReason = 'capa' | 'dados' | 'outro'

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'capa', label: 'Capa imprópria ou errada' },
  { value: 'dados', label: 'Título, editora ou outro dado errado' },
  { value: 'outro', label: 'Outro motivo' },
]

export class DuplicateReportError extends Error {}

export async function reportEdition(editionId: string, reason: ReportReason, details: string): Promise<void> {
  const { error } = await supabase
    .from('edition_reports')
    .insert({ edition_id: editionId, reason, details: details.trim() || null })
  if (error) {
    if (error.code === '23505') throw new DuplicateReportError()
    throw error
  }
}

// Daqui para baixo, só o admin (as políticas das tabelas e do bucket covers-pending).

/** Campos da edição embutidos nas listas de revisão: os do cartão e os que o diálogo de edição do admin pede. */
const EDITION_COLUMNS =
  'id, title, publisher, isbn13, volume, format, year, cover_url, verified, created_at, created_by, work_id, series_position, work:works(title)'

type ModerationEdition = EditionSummary & Pick<Edition, 'created_by'>

type EditionRow = Omit<ModerationEdition, 'series_title'> & { work: { title: string } | null }

function toModerationEdition({ work, ...edition }: EditionRow): ModerationEdition {
  return { ...edition, series_title: work?.title ?? null }
}

export interface CoverSubmission {
  id: string
  path: string
  created_at: string
  /** URL assinada, válida por uma hora: o bucket da fila é privado. */
  previewUrl: string | null
  edition: ModerationEdition
}

export interface EditionReport {
  id: string
  reason: ReportReason
  details: string | null
  created_at: string
  edition: ModerationEdition
}

const PREVIEW_SECONDS = 60 * 60

export async function fetchCoverSubmissions(): Promise<CoverSubmission[]> {
  const { data, error } = await supabase
    .from('cover_submissions')
    .select(`id, path, created_at, edition:editions(${EDITION_COLUMNS})`)
    .order('created_at')
  if (error) throw error
  const rows = (data ?? []) as unknown as (Omit<CoverSubmission, 'previewUrl' | 'edition'> & { edition: EditionRow })[]
  if (rows.length === 0) return []

  const { data: signed, error: signError } = await supabase.storage
    .from('covers-pending')
    .createSignedUrls(
      rows.map((row) => row.path),
      PREVIEW_SECONDS,
    )
  if (signError) throw signError
  const urlByPath = new Map((signed ?? []).map((item) => [item.path, item.signedUrl]))

  return rows.map((row) => ({
    ...row,
    previewUrl: urlByPath.get(row.path) ?? null,
    edition: toModerationEdition(row.edition),
  }))
}

export async function fetchEditionReports(): Promise<EditionReport[]> {
  const { data, error } = await supabase
    .from('edition_reports')
    .select(`id, reason, details, created_at, edition:editions(${EDITION_COLUMNS})`)
    .order('created_at')
  if (error) throw error
  const rows = (data ?? []) as unknown as (Omit<EditionReport, 'edition'> & { edition: EditionRow })[]
  return rows.map((row) => ({ ...row, edition: toModerationEdition(row.edition) }))
}

/** Quantos itens esperam o admin (capas e denúncias), para o botão do painel. */
export async function fetchModerationCount(): Promise<number> {
  const counts = await Promise.all(
    ['cover_submissions', 'edition_reports'].map(async (table) => {
      const { count, error } = await supabase.from(table).select('id', { count: 'exact', head: true })
      if (error) throw error
      return count ?? 0
    }),
  )
  return counts.reduce((total, count) => total + count, 0)
}

/** Apaga a linha da fila. Bloqueado pela RLS, o delete não dá erro (0 linhas); por isso confere o retorno. */
async function deleteSubmission(id: string): Promise<void> {
  const { data, error } = await supabase.from('cover_submissions').delete().eq('id', id).select('id')
  if (error) throw error
  if (!data?.length) throw new Error('A capa não saiu da fila.')
}

async function removePendingFile(path: string): Promise<void> {
  const { data, error } = await supabase.storage.from('covers-pending').remove([path])
  if (error) throw error
  if (!data?.length) throw new Error(`O arquivo da fila (${path}) não foi apagado do Storage.`)
}

/**
 * Copia a capa da fila para o bucket público, grava na edição e tira da fila. A edição pode já ter capa
 * (enviada por outra pessoa e aprovada antes): a nova substitui e a antiga é apagada, como no admin.
 */
export async function approveCover(submission: CoverSubmission): Promise<void> {
  const { data: file, error: downloadError } = await supabase.storage.from('covers-pending').download(submission.path)
  if (downloadError) throw downloadError

  const { edition } = submission
  const coverUrl = await uploadCoverBlob(file, edition.isbn13 ?? edition.id)
  const { error } = await supabase.from('editions').update({ cover_url: coverUrl }).eq('id', edition.id)
  if (error) throw error

  // A capa já está na edição: daqui em diante, falhar só deixa arquivo sobrando.
  removeCoverImage(edition.cover_url).catch((err) => console.warn(err))
  await deleteSubmission(submission.id)
  removePendingFile(submission.path).catch((err) => console.warn(err))
}

/** Recusa: apaga o arquivo e depois a linha (se o arquivo falhar, a capa continua na fila para tentar de novo). */
export async function rejectCover(submission: CoverSubmission): Promise<void> {
  await removePendingFile(submission.path)
  await deleteSubmission(submission.id)
}

export async function resolveReport(id: string): Promise<void> {
  const { data, error } = await supabase.from('edition_reports').delete().eq('id', id).select('id')
  if (error) throw error
  if (!data?.length) throw new Error('A denúncia não foi resolvida.')
}

/** Tira a capa de uma edição (ex.: denúncia de capa imprópria) e apaga o arquivo do bucket público. */
export async function removeEditionCover(edition: Pick<Edition, 'id' | 'cover_url'>): Promise<void> {
  const { error } = await supabase.from('editions').update({ cover_url: null }).eq('id', edition.id)
  if (error) throw error
  await removeCoverImage(edition.cover_url)
}
