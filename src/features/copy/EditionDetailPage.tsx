import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Alert, Box, IconButton, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { NarrationTitle } from '../../components/NarrationTitle'
import { AddToCollectionButton } from '../series/AddToCollectionButton'
import { WishToggleButton } from '../wishlist/WishToggleButton'
import { fetchEditionDetail } from './api'
import { SectionCard } from './DetailPage.styles'
import { EditionOverview } from './EditionOverview'

/**
 * Detalhe de uma edição do catálogo que a pessoa não tem (ex.: "Não tenho" na página da série): os mesmos
 * dados do detalhe do exemplar e, no lugar de "Seu exemplar", "Na sua coleção" com "Quero esse" e "Adicionar
 * à coleção". Se ela tem a edição, vai para o exemplar: lá estão os dados dela.
 */
export function EditionDetailPage() {
  const { editionId } = useParams<{ editionId: string }>()
  const navigate = useNavigate()

  const offline = !navigator.onLine
  const { data, isLoading, isError } = useQuery({
    queryKey: ['edition-detail', editionId],
    queryFn: () => fetchEditionDetail(editionId!),
    enabled: !offline,
    retry: false,
  })

  if (data && data.copies.length > 0) return <Navigate to={`/exemplar/${data.copies[0].id}`} replace />

  return (
    <Box sx={{ px: { xs: 2.5, md: 5 }, py: { xs: 4, md: 5 }, maxWidth: { md: 720 } }}>
      <IconButton aria-label="Voltar" onClick={() => navigate(-1)} edge="start" sx={{ display: { md: 'none' }, mb: 1 }}>
        <ArrowBackIcon />
      </IconButton>

      {isLoading && <LoadingSpinner size={28} sx={{ py: 4 }} />}

      {/* O catálogo não fica salvo no aparelho: só a coleção, a lista de desejos e o "Eu tenho?" funcionam sem sinal. */}
      {(offline || isError) && (
        <Alert severity="info">
          Não deu para abrir os detalhes agora. Sem conexão, a coleção, a lista de desejos e o "Eu tenho?" continuam
          funcionando.
        </Alert>
      )}

      {data === null && <Alert severity="warning">Essa edição não está mais no catálogo.</Alert>}

      {data && (
        <>
          <EditionOverview edition={data} />

          <SectionCard variant="outlined" sx={{ mt: 2 }}>
            <NarrationTitle sx={{ mb: 1.5 }}>Na sua coleção</NarrationTitle>
            <Typography variant="body2">Você não tem esta edição.</Typography>
            <Stack direction="row" sx={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
              <WishToggleButton editionId={data.id} />
              {/* Depois de adicionar, abre o exemplar novo para completar condição, data e preço. */}
              <AddToCollectionButton
                edition={data}
                onAdded={(copyId) => navigate(`/exemplar/${copyId}`, { replace: true })}
              />
            </Stack>
          </SectionCard>
        </>
      )}
    </Box>
  )
}
