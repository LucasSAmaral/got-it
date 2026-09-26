import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Alert, Box, IconButton, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { Fragment, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { formatDate, formatPrice, titleInitials } from '../../lib/format'
import { tokens } from '../../theme'
import { fetchCopyDetail } from './api'
import { CoverFrame, DetailList, SectionTitle } from './CopyDetailPage.styles'

type Detail = { label: string; value: string | null; mono?: boolean }

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
            {item.value ?? '—'}
          </Typography>
        </Fragment>
      ))}
    </DetailList>
  )
}

/** Detalhe de um exemplar da coleção: capa grande no topo e, abaixo, os dados da edição e do exemplar. */
export function CopyDetailPage() {
  const { copyId } = useParams<{ copyId: string }>()
  const navigate = useNavigate()
  const [coverFailed, setCoverFailed] = useState(false)

  const offline = !navigator.onLine
  const { data, isLoading, isError } = useQuery({
    queryKey: ['copy-detail', copyId],
    queryFn: () => fetchCopyDetail(copyId!),
    enabled: !offline,
    retry: false,
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
          <CoverFrame>
            {data.edition.cover_url && !coverFailed ? (
              <Box
                component="img"
                src={data.edition.cover_url}
                alt={`Capa de ${data.edition.title}`}
                onError={() => setCoverFailed(true)}
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <Typography variant="h1" color="text.secondary">
                {titleInitials(data.edition.title)}
              </Typography>
            )}
          </CoverFrame>

          <Stack spacing={0.5} sx={{ mt: 3 }}>
            <Typography variant="h2">{data.edition.title}</Typography>
            <Typography variant="body1" color="text.secondary">
              {[data.edition.publisher, data.edition.volume].filter(Boolean).join(' · ') || 'Editora não informada'}
            </Typography>
          </Stack>

          <SectionTitle variant="overline">Edição</SectionTitle>
          <Details
            items={[
              { label: 'Editora', value: data.edition.publisher },
              { label: 'Volume / nº', value: data.edition.volume },
              { label: 'Formato', value: data.edition.format },
              { label: 'Ano', value: data.edition.year ? String(data.edition.year) : null },
              { label: 'ISBN', value: data.edition.isbn13, mono: true },
            ]}
          />

          <SectionTitle variant="overline">Seu exemplar</SectionTitle>
          <Details
            items={[
              { label: 'Condição', value: data.condition },
              { label: 'Adquirido em', value: data.acquired_at ? formatDate(data.acquired_at) : null },
              { label: 'Preço pago', value: data.price_paid !== null ? formatPrice(data.price_paid) : null },
            ]}
          />
        </>
      )}
    </Box>
  )
}
