import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CloseIcon from '@mui/icons-material/Close'
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import { Alert, Box, Button, IconButton, InputAdornment, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { PageContent } from '../../layout/PageContent'
import { Sidebar } from '../../layout/Sidebar'
import { describeScan } from '../../lib/barcode'
import { isValidIsbn, normalizeIsbn, toIsbn13 } from '../../lib/isbn'
import { tokens } from '../../theme'
import { LazyScannerDialog } from '../scanner/LazyScannerDialog'
import { FORMATS } from './constants'
import {
  DuplicateIsbnError,
  addCopyToExistingEdition,
  createEditionAndCopy,
  fetchEditionByIsbn,
  fetchMyCopyCount,
  uploadCoverImage,
  type CopyFormInput,
  type NewEditionInput,
} from './api'
import { CoverPreview, FieldLabel, FieldRow, FoundChip, NotFoundChip } from './RegisterByIsbnPage.styles'

const CONDITIONS = ['Ótimo', 'Bom', 'Regular']

export function RegisterByIsbnPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [isbnInput, setIsbnInput] = useState(searchParams.get('isbn') ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [scannerOpen, setScannerOpen] = useState(false)
  const [scanLabel, setScanLabel] = useState('')

  const [copyForm, setCopyForm] = useState<CopyFormInput>({ condition: '', acquiredAt: '', pricePaid: '' })
  const [manualEdition, setManualEdition] = useState({ title: '', publisher: '', volume: '', format: '', year: '' })
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!coverFile) {
      setCoverPreview(null)
      return
    }
    const url = URL.createObjectURL(coverFile)
    setCoverPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [coverFile])

  const normalized = normalizeIsbn(isbnInput)
  const isbnIsValid = normalized.length > 0 && isValidIsbn(normalized)
  const isbn13 = useMemo(() => {
    if (!isbnIsValid) return null
    try {
      return toIsbn13(normalized)
    } catch {
      return null
    }
  }, [isbnIsValid, normalized])

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
      navigate('/')
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
      const coverUrl = coverFile ? await uploadCoverImage(coverFile, isbn13) : ''
      const newEdition: NewEditionInput = { isbn13, coverUrl, ...manualEdition }
      await createEditionAndCopy(newEdition, copyForm)
      navigate('/')
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

          <Stack spacing={0.75} sx={{ mb: 3 }}>
            <FieldLabel variant="caption">ISBN</FieldLabel>
            <TextField
              fullWidth
              placeholder="978…"
              value={isbnInput}
              onChange={(event) => {
                setIsbnInput(event.target.value)
                setScanLabel('')
              }}
              error={isbnInput.length > 0 && !isbnIsValid}
              helperText={
                isbnInput.length > 0 && !isbnIsValid ? 'ISBN inválido' : scanLabel ? `Lido pela câmera · ${scanLabel}` : ' '
              }
              slotProps={{
                htmlInput: { style: { fontFamily: tokens.font.mono } },
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton aria-label="Escanear código de barras" edge="end" onClick={() => setScannerOpen(true)}>
                        <PhotoCameraOutlinedIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Stack>

          <LazyScannerDialog
            open={scannerOpen}
            onClose={() => setScannerOpen(false)}
            onDetected={(scan) => {
              setIsbnInput(scan.code)
              setScanLabel(describeScan(scan))
              setScannerOpen(false)
            }}
          />

          {isbn13 && editionQuery.isLoading && <LoadingSpinner size={24} sx={{ py: 3 }} />}

          {isbn13 && editionQuery.isError && (
            <Alert severity="error">Não deu para consultar o catálogo agora.</Alert>
          )}

          {isbn13 && editionQuery.isSuccess && edition && (
            <Box component="form" onSubmit={handleSubmitExisting}>
              <Stack spacing={2}>
                <FoundChip label="Encontrado no catálogo" size="small" />

                <Stack spacing={0.25}>
                  <Typography variant="h4">{edition.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {[edition.publisher, edition.format].filter(Boolean).join(' · ') || 'Sem editora informada'}
                  </Typography>
                </Stack>

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

                <TextField
                  label="Preço pago"
                  placeholder="R$ 0,00"
                  value={copyForm.pricePaid}
                  onChange={(event) => setCopyForm({ ...copyForm, pricePaid: event.target.value })}
                />

                {submitError && <Alert severity="error">{submitError}</Alert>}

                <Button type="submit" variant="contained" disabled={submitting}>
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

                <TextField
                  label="Título"
                  required
                  fullWidth
                  placeholder="Ex.: Watchmen"
                  value={manualEdition.title}
                  onChange={(event) => setManualEdition({ ...manualEdition, title: event.target.value })}
                />

                <FieldRow direction="row">
                  <TextField
                    label="Editora"
                    fullWidth
                    placeholder="Ex.: Panini"
                    value={manualEdition.publisher}
                    onChange={(event) => setManualEdition({ ...manualEdition, publisher: event.target.value })}
                  />
                  <TextField
                    label="Volume / nº"
                    fullWidth
                    placeholder="Ex.: 1"
                    value={manualEdition.volume}
                    onChange={(event) => setManualEdition({ ...manualEdition, volume: event.target.value })}
                  />
                </FieldRow>

                <FieldRow direction="row">
                  <TextField
                    select
                    label="Formato"
                    fullWidth
                    value={manualEdition.format}
                    onChange={(event) => setManualEdition({ ...manualEdition, format: event.target.value })}
                  >
                    {FORMATS.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label="Ano"
                    fullWidth
                    placeholder="Ex.: 2024"
                    value={manualEdition.year}
                    onChange={(event) => setManualEdition({ ...manualEdition, year: event.target.value })}
                  />
                </FieldRow>

                <Stack spacing={0.75}>
                  <FieldLabel variant="caption">Foto da capa (opcional)</FieldLabel>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(event) => setCoverFile(event.target.files?.[0] ?? null)}
                  />
                  {coverPreview ? (
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                      <CoverPreview component="img" src={coverPreview} alt="Prévia da capa" />
                      <Button
                        type="button"
                        size="small"
                        color="inherit"
                        startIcon={<CloseIcon fontSize="small" />}
                        onClick={() => {
                          setCoverFile(null)
                          if (fileInputRef.current) fileInputRef.current.value = ''
                        }}
                      >
                        Remover
                      </Button>
                    </Stack>
                  ) : (
                    <Button
                      type="button"
                      variant="outlined"
                      color="inherit"
                      startIcon={<AddPhotoAlternateOutlinedIcon />}
                      onClick={() => fileInputRef.current?.click()}
                      sx={{ alignSelf: 'flex-start' }}
                    >
                      Adicionar foto da capa
                    </Button>
                  )}
                </Stack>

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

                <TextField
                  label="Preço pago"
                  placeholder="R$ 0,00"
                  value={copyForm.pricePaid}
                  onChange={(event) => setCopyForm({ ...copyForm, pricePaid: event.target.value })}
                />

                {submitError && <Alert severity="error">{submitError}</Alert>}

                <Button type="submit" variant="contained" disabled={submitting || !manualEdition.title}>
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
