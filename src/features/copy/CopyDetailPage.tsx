import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined'
import { Alert, Box, Button, FormControlLabel, IconButton, Link, Stack, Switch, Typography } from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Fragment, useState } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import { LargeCover } from '../../components/LargeCover'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { formatDate, formatPrice } from '../../lib/format'
import { seriesPosition } from '../../lib/series'
import { tokens } from '../../theme'
import { fetchCopyDetail, updateCopyRead, type CopyDetail } from './api'
import { NarrationTitle } from '../../components/NarrationTitle'
import { DetailList, SectionCard } from './CopyDetailPage.styles'
import { EditCopyDialog } from './EditCopyDialog'
import { ReportEditionDialog } from '../moderation/ReportEditionDialog'

/** `to`: o valor vira link (ex.: a série abre a página dela). */
type Detail = { label: string; value: string | null; mono?: boolean; to?: string }

function Details({ items }: { items: Detail[] }) {
  return (
    <DetailList component="dl">
      {items.map((item) => (
        <Fragment key={item.label}>
          <Typography component="dt" variant="body2" color="text.secondary">
            {item.label}
          </Typography>
          <Typography
            component="dd"
            variant="body2"
            sx={{ fontWeight: 600, fontFamily: item.mono && item.value ? tokens.font.mono : undefined }}
          >
            {item.value && item.to ? (
              <Link component={RouterLink} to={item.to}>
                {item.value}
              </Link>
            ) : (
              (item.value ?? '—')
            )}
          </Typography>
        </Fragment>
      ))}
    </DetailList>
  )
}

/** "Homem-Aranha 2099 · nº 1"; o nº vem do "Nº na série" ou, sem ele, do volume. */
function seriesLabel(edition: CopyDetail['edition']): string | null {
  if (!edition.work) return null
  const position = seriesPosition(edition)
  return position === null ? edition.work.title : `${edition.work.title} · nº ${position}`
}

/** Detalhe de um exemplar da coleção: capa grande no topo e, abaixo, os dados da edição e do exemplar. */
export function CopyDetailPage() {
  const { copyId } = useParams<{ copyId: string }>()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [reporting, setReporting] = useState(false)
  const queryClient = useQueryClient()

  const offline = !navigator.onLine
  const { data, isLoading, isError } = useQuery({
    queryKey: ['copy-detail', copyId],
    queryFn: () => fetchCopyDetail(copyId!),
    enabled: !offline,
    retry: false,
  })

  const markRead = useMutation({
    mutationFn: (read: boolean) => updateCopyRead(copyId!, read),
    // A lista (e a cópia offline, que vem dela) e o "Eu tenho?" mostram o selo "Lido".
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['copy-detail', copyId] }),
        queryClient.invalidateQueries({ queryKey: ['collection'] }),
        queryClient.invalidateQueries({ queryKey: ['check'] }),
      ]),
  })

  return (
    <Box sx={{ px: { xs: 2.5, md: 5 }, py: { xs: 4, md: 5 }, maxWidth: { md: 720 } }}>
      <IconButton aria-label="Voltar" onClick={() => navigate(-1)} edge="start" sx={{ display: { md: 'none' }, mb: 1 }}>
        <ArrowBackIcon />
      </IconButton>

      {isLoading && <LoadingSpinner size={28} sx={{ py: 4 }} />}

      {/* Capa e detalhes não ficam salvos no aparelho: só a lista e o "Eu tenho?" funcionam sem sinal. */}
      {(offline || isError) && (
        <Alert severity="info">
          Não deu para abrir os detalhes agora. Sem conexão, a lista da coleção e o "Eu tenho?" continuam funcionando.
        </Alert>
      )}

      {data === null && <Alert severity="warning">Esse exemplar não está mais na sua coleção.</Alert>}

      {data && (
        <>
          <LargeCover coverUrl={data.edition.cover_url} title={data.edition.title} />
          {!data.edition.cover_url && data.edition.cover_submissions.length > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 1 }}>
              Capa enviada, em análise. Aparece aqui depois de revisada.
            </Typography>
          )}

          <Stack spacing={0.5} sx={{ mt: 3 }}>
            <Typography variant="h2">{data.edition.title}</Typography>
            <Typography variant="body1" color="text.secondary">
              {[data.edition.publisher, data.edition.volume].filter(Boolean).join(' · ') || 'Editora não informada'}
            </Typography>
          </Stack>

          <Stack spacing={2} sx={{ mt: 3 }}>
            <SectionCard variant="outlined">
              <NarrationTitle sx={{ mb: 1.5 }}>Edição</NarrationTitle>
              <Details
                items={[
                  {
                    label: 'Série',
                    value: seriesLabel(data.edition),
                    to: data.edition.work_id ? `/serie/${data.edition.work_id}` : undefined,
                  },
                  { label: 'Editora', value: data.edition.publisher },
                  { label: 'Volume / nº', value: data.edition.volume },
                  { label: 'Formato', value: data.edition.format },
                  { label: 'Ano', value: data.edition.year ? String(data.edition.year) : null },
                  { label: 'ISBN', value: data.edition.isbn13, mono: true },
                ]}
              />
              {/* O catálogo é compartilhado: capa ou dado errado de outra pessoa vai para a revisão do admin. */}
              <Button
                size="small"
                color="inherit"
                startIcon={<FlagOutlinedIcon fontSize="small" />}
                onClick={() => setReporting(true)}
                sx={{ mt: 1.5, color: 'text.secondary' }}
              >
                Denunciar capa ou dado errado
              </Button>
            </SectionCard>
            <SectionCard variant="outlined">
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <NarrationTitle sx={{ mb: 1.5 }}>Seu exemplar</NarrationTitle>
                <IconButton
                  aria-label="Editar exemplar"
                  size="small"
                  onClick={() => setEditing(true)}
                  sx={{ mt: -0.75, mr: -0.75, color: 'text.secondary' }}
                >
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
              </Stack>
              <Details
                items={[
                  { label: 'Condição', value: data.condition },
                  { label: 'Adquirido em', value: data.acquired_at ? formatDate(data.acquired_at) : null },
                  { label: 'Preço pago', value: data.price_paid !== null ? formatPrice(data.price_paid) : null },
                ]}
              />
              {/* Salva ao tocar. Enquanto salva, mostra o valor novo (senão o switch voltaria até a resposta). */}
              <FormControlLabel
                control={
                  <Switch
                    checked={markRead.isPending ? markRead.variables : data.read}
                    disabled={markRead.isPending}
                    onChange={(event) => markRead.mutate(event.target.checked)}
                  />
                }
                label="Lido"
                sx={{ mt: 1 }}
              />
              {markRead.isError && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  Não deu para salvar agora. Confira a conexão e tente de novo.
                </Alert>
              )}
            </SectionCard>
          </Stack>

          {editing && <EditCopyDialog copy={data} onClose={() => setEditing(false)} />}
          {reporting && (
            <ReportEditionDialog
              editionId={data.edition.id}
              title={data.edition.title}
              onClose={() => setReporting(false)}
            />
          )}
        </>
      )}
    </Box>
  )
}
