import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import { Alert, Box, Button, IconButton, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { LargeCover } from '../../components/LargeCover'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { PageContent } from '../../layout/PageContent'
import { Sidebar } from '../../layout/Sidebar'
import { isPriceInputValid } from '../../lib/format'
import { isbn13FromInput } from '../../lib/isbn'
import { ReportEditionDialog } from '../moderation/ReportEditionDialog'
import { CONDITIONS } from './constants'
import {
  DuplicateIsbnError,
  addCopyToExistingEdition,
  createEditionAndCopy,
  fetchEditionByIsbn,
  fetchMyCopyCount,
  type CopyFormInput,
} from './api'
import { IsbnField } from './IsbnField'
import { EMPTY_EDITION_FORM, isNewEditionFormValid } from './editionForm'
import { NewEditionFields } from './NewEditionFields'
import { PriceField } from './PriceField'
import { FieldRow, FoundChip, NotFoundChip } from './RegisterByIsbnPage.styles'

export function RegisterByIsbnPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [isbnInput, setIsbnInput] = useState(searchParams.get('isbn') ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const [copyForm, setCopyForm] = useState<CopyFormInput>({ condition: '', acquiredAt: '', pricePaid: '' })
  const [manualEdition, setManualEdition] = useState(EMPTY_EDITION_FORM)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [reporting, setReporting] = useState(false)

  const isbn13 = isbn13FromInput(isbnInput)

  const editionQuery = useQuery({
    queryKey: ['edition-by-isbn', isbn13],
    queryFn: () => fetchEditionByIsbn(isbn13!),
    enabled: isbn13 !== null,
  })

  const edition = editionQuery.data

  const duplicateQuery = useQuery({
    queryKey: ['my-copy-count', edition?.id],
    queryFn: () => fetchMyCopyCount(edition!.id),
    enabled: !!edition,
  })

  async function handleSubmitExisting(event: FormEvent) {
    event.preventDefault()
    if (!edition) return
    setSubmitting(true)
    setSubmitError('')
    try {
      await addCopyToExistingEdition(edition.id, copyForm)
      navigate('/colecao')
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Não deu para salvar. Tenta de novo.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmitManual(event: FormEvent) {
    event.preventDefault()
    if (!isbn13) return
    setSubmitting(true)
    setSubmitError('')
    try {
      await createEditionAndCopy({ isbn13, ...manualEdition }, coverFile, copyForm)
      navigate('/colecao')
    } catch (error) {
      if (error instanceof DuplicateIsbnError) {
        setSubmitError('Essa edição acabou de ser cadastrada por outra pessoa — confira os dados abaixo.')
        await queryClient.invalidateQueries({ queryKey: ['edition-by-isbn', isbn13] })
      } else {
        setSubmitError(error instanceof Error ? error.message : 'Não deu para salvar. Tenta de novo.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      <Sidebar />
      <PageContent>
        <Box sx={{ px: { xs: 2.5, md: 5 }, py: { xs: 4, md: 5 } }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 3 }}>
            <IconButton aria-label="Voltar" onClick={() => navigate(-1)} edge="start" sx={{ display: { md: 'none' } }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h2">Cadastrar edição</Typography>
          </Stack>

          <IsbnField value={isbnInput} onChange={setIsbnInput} />

          {isbn13 && editionQuery.isLoading && <LoadingSpinner size={24} sx={{ py: 3 }} />}

          {isbn13 && editionQuery.isError && (
            <Alert severity="error">Não deu para consultar o catálogo agora.</Alert>
          )}

          {isbn13 && editionQuery.isSuccess && edition && (
            <Box component="form" onSubmit={handleSubmitExisting}>
              <Stack spacing={2}>
                <FoundChip label="Encontrado no catálogo" size="small" />

                {/* A capa ao lado: reconhecer o gibi pela capa é mais rápido que ler o título. */}
                <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
                  <Box sx={{ width: { xs: 96, md: 120 }, flexShrink: 0 }}>
                    <LargeCover coverUrl={edition.cover_url} title={edition.title} />
                  </Box>
                  <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                    <Typography variant="h4">{edition.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {[edition.publisher, edition.volume, edition.format].filter(Boolean).join(' · ') ||
                        'Sem editora informada'}
                    </Typography>
                    <Button
                      size="small"
                      color="inherit"
                      startIcon={<FlagOutlinedIcon fontSize="small" />}
                      onClick={() => setReporting(true)}
                      sx={{ alignSelf: 'flex-start', color: 'text.secondary', mt: 1 }}
                    >
                      Dados errados? Denunciar
                    </Button>
                  </Stack>
                </Stack>
                {reporting && (
                  <ReportEditionDialog editionId={edition.id} title={edition.title} onClose={() => setReporting(false)} />
                )}

                {duplicateQuery.data !== undefined && duplicateQuery.data > 0 && (
                  <Alert severity="warning" icon={<WarningAmberOutlinedIcon fontSize="small" />}>
                    Você já tem {duplicateQuery.data} exemplar{duplicateQuery.data === 1 ? '' : 'es'} desta edição. Tudo bem
                    ter mais de um — é só confirmar.
                  </Alert>
                )}

                <Typography variant="h4" sx={{ mt: 1 }}>
                  Seu exemplar
                </Typography>

                <FieldRow direction="row">
                  <TextField
                    select
                    label="Condição"
                    fullWidth
                    value={copyForm.condition}
                    onChange={(event) => setCopyForm({ ...copyForm, condition: event.target.value })}
                  >
                    {CONDITIONS.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label="Adquirido em"
                    type="date"
                    fullWidth
                    value={copyForm.acquiredAt}
                    onChange={(event) => setCopyForm({ ...copyForm, acquiredAt: event.target.value })}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </FieldRow>

                <PriceField value={copyForm.pricePaid} onChange={(pricePaid) => setCopyForm({ ...copyForm, pricePaid })} />

                {submitError && <Alert severity="error">{submitError}</Alert>}

                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitting || !isPriceInputValid(copyForm.pricePaid)}
                >
                  {submitting ? 'Salvando…' : 'Adicionar à minha coleção'}
                </Button>
              </Stack>
            </Box>
          )}

          {isbn13 && editionQuery.isSuccess && edition === null && (
            <Box component="form" onSubmit={handleSubmitManual}>
              <Stack spacing={2}>
                <NotFoundChip label="Não encontramos no catálogo" size="small" variant="outlined" />
                <Typography variant="body2" color="text.secondary">
                  Preencha os dados da edição — as próximas pessoas que escanearem esse ISBN recebem tudo pronto.
                </Typography>

                <NewEditionFields
                  value={manualEdition}
                  onChange={setManualEdition}
                  coverFile={coverFile}
                  onCoverFileChange={setCoverFile}
                />

                <Typography variant="h4" sx={{ mt: 1 }}>
                  Seu exemplar
                </Typography>

                <FieldRow direction="row">
                  <TextField
                    select
                    label="Condição"
                    fullWidth
                    value={copyForm.condition}
                    onChange={(event) => setCopyForm({ ...copyForm, condition: event.target.value })}
                  >
                    {CONDITIONS.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label="Adquirido em"
                    type="date"
                    fullWidth
                    value={copyForm.acquiredAt}
                    onChange={(event) => setCopyForm({ ...copyForm, acquiredAt: event.target.value })}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </FieldRow>

                <PriceField value={copyForm.pricePaid} onChange={(pricePaid) => setCopyForm({ ...copyForm, pricePaid })} />

                {submitError && <Alert severity="error">{submitError}</Alert>}

                <Button
                  type="submit"
                  variant="contained"
                  disabled={
                    submitting ||
                    !isNewEditionFormValid(manualEdition) ||
                    !isPriceInputValid(copyForm.pricePaid)
                  }
                >
                  {submitting ? 'Salvando…' : 'Cadastrar e adicionar à coleção'}
                </Button>
              </Stack>
            </Box>
          )}
        </Box>
      </PageContent>
    </Box>
  )
}
