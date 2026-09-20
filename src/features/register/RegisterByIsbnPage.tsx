import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { isValidIsbn, normalizeIsbn, toIsbn13 } from '../../lib/isbn'
import { tokens } from '../../theme'
import {
  DuplicateIsbnError,
  addCopyToExistingEdition,
  createEditionAndCopy,
  fetchEditionByIsbn,
  fetchMyCopyCount,
  type CopyFormInput,
  type NewEditionInput,
} from './api'

const CONDITIONS = ['Ótimo', 'Bom', 'Regular']

export function RegisterByIsbnPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [isbnInput, setIsbnInput] = useState(searchParams.get('isbn') ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const [copyForm, setCopyForm] = useState<CopyFormInput>({ condition: '', acquiredAt: '', pricePaid: '' })
  const [manualEdition, setManualEdition] = useState({ title: '', publisher: '', volume: '', format: '', year: '' })

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
    const newEdition: NewEditionInput = { isbn13, ...manualEdition }
    try {
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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', p: 2.5, borderBottom: 1, borderColor: 'divider' }}>
        <IconButton aria-label="Voltar" onClick={() => navigate(-1)} edge="start">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h3">Cadastrar edição</Typography>
      </Stack>

      <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5 }}>
        <Stack spacing={0.75} sx={{ mb: 3 }}>
          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            ISBN
          </Typography>
          <TextField
            fullWidth
            placeholder="978…"
            value={isbnInput}
            onChange={(event) => setIsbnInput(event.target.value)}
            error={isbnInput.length > 0 && !isbnIsValid}
            helperText={isbnInput.length > 0 && !isbnIsValid ? 'ISBN inválido' : ' '}
            slotProps={{ htmlInput: { style: { fontFamily: tokens.font.mono } } }}
          />
        </Stack>

        {isbn13 && editionQuery.isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {isbn13 && editionQuery.isError && (
          <Alert severity="error">Não deu para consultar o catálogo agora.</Alert>
        )}

        {isbn13 && editionQuery.isSuccess && edition && (
          <Box component="form" onSubmit={handleSubmitExisting}>
            <Stack spacing={2}>
              <Chip label="Encontrado no catálogo" size="small" sx={{ alignSelf: 'flex-start', bgcolor: 'rgba(163,118,15,0.12)', color: tokens.color.gold, fontWeight: 600, textTransform: 'uppercase', fontSize: 10 }} />

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

              <Stack direction="row" sx={{ display: 'flex', gap: 2 }}>
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
              </Stack>

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
              <Chip
                label="Não encontramos no catálogo"
                size="small"
                variant="outlined"
                sx={{ alignSelf: 'flex-start', fontWeight: 600, textTransform: 'uppercase', fontSize: 10 }}
              />
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

              <Stack direction="row" sx={{ display: 'flex', gap: 2 }}>
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
              </Stack>

              <Stack direction="row" sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Formato"
                  fullWidth
                  placeholder="Ex.: Banca"
                  value={manualEdition.format}
                  onChange={(event) => setManualEdition({ ...manualEdition, format: event.target.value })}
                />
                <TextField
                  label="Ano"
                  fullWidth
                  placeholder="Ex.: 2024"
                  value={manualEdition.year}
                  onChange={(event) => setManualEdition({ ...manualEdition, year: event.target.value })}
                />
              </Stack>

              <Typography variant="h4" sx={{ mt: 1 }}>
                Seu exemplar
              </Typography>

              <Stack direction="row" sx={{ display: 'flex', gap: 2 }}>
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
              </Stack>

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
    </Box>
  )
}
