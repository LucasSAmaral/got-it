import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { Alert, Box, FormControlLabel, IconButton, Stack, Switch } from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { NarrationTitle } from '../../components/NarrationTitle'
import { formatDate, formatPrice } from '../../lib/format'
import { fetchCopyDetail, updateCopyRead } from './api'
import { SectionCard } from './DetailPage.styles'
import { EditCopyDialog } from './EditCopyDialog'
import { Details, EditionOverview } from './EditionOverview'

/** Detalhe de um exemplar da coleção: capa grande no topo e, abaixo, os dados da edição e do exemplar. */
export function CopyDetailPage() {
  const { copyId } = useParams<{ copyId: string }>()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
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
          <EditionOverview edition={data.edition} />

          <Stack spacing={2} sx={{ mt: 2 }}>
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
        </>
      )}
    </Box>
  )
}
