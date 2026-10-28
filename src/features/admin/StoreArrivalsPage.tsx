import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Alert, Box, Button, IconButton, Stack, TextField, Typography } from '@mui/material'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { EditionGrid } from '../../components/EditionGrid'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { formatDate, isPriceInputValid, toIsoDate } from '../../lib/format'
import { isbn13FromInput } from '../../lib/isbn'
import { createEdition, DuplicateIsbnError, fetchEditionByIsbn, uploadCoverImage } from '../register/api'
import { IsbnField } from '../register/IsbnField'
import { EMPTY_EDITION_FORM, isNewEditionFormValid } from '../register/editionForm'
import { NewEditionFields } from '../register/NewEditionFields'
import { PriceField } from '../register/PriceField'
import { FieldRow, FoundChip, NotFoundChip } from '../register/RegisterByIsbnPage.styles'
import {
  ARRIVAL_WINDOW_DAYS,
  createArrival,
  DuplicateArrivalError,
  fetchRecentArrivals,
  fetchStore,
  type ArrivalFormInput,
} from '../store/api'
import { isAdmin } from './admin'
import { StoreArrivalCard } from './StoreArrivalCard'

/**
 * Registro das chegadas de uma loja (versão 1 da vitrine: quem cadastra é o admin). Escaneia o ISBN; se a
 * edição não está no catálogo, cria só a edição, sem exemplar na coleção de quem registra. Depois de salvar,
 * o campo volta vazio para o próximo do lote, mantendo a data.
 */
export function StoreArrivalsPage() {
  const { slug = '' } = useParams()
  const { session } = useAuth()
  const queryClient = useQueryClient()

  const [isbnInput, setIsbnInput] = useState('')
  const [arrivalForm, setArrivalForm] = useState<ArrivalFormInput>({ arrivedOn: toIsoDate(new Date()), price: '' })
  const [editionForm, setEditionForm] = useState(EMPTY_EDITION_FORM)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [savedTitle, setSavedTitle] = useState('')

  const storeQuery = useQuery({ queryKey: ['store', slug], queryFn: () => fetchStore(slug) })
  const store = storeQuery.data

  const arrivalsQuery = useQuery({
    queryKey: ['store-arrivals', store?.id],
    queryFn: () => fetchRecentArrivals(store!.id),
    enabled: !!store,
  })

  const isbn13 = isbn13FromInput(isbnInput)
  const editionQuery = useQuery({
    queryKey: ['edition-by-isbn', isbn13],
    queryFn: () => fetchEditionByIsbn(isbn13!),
    enabled: isbn13 !== null,
  })
  const edition = editionQuery.data

  if (!isAdmin(session) || storeQuery.data === null) {
    return <Navigate to="/admin" replace />
  }

  function handleIsbnChange(value: string) {
    setIsbnInput(value)
    setSavedTitle('')
    setSubmitError('')
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!store || !isbn13 || edition === undefined) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const editionId =
        edition?.id ??
        (await createEdition({
          isbn13,
          coverUrl: coverFile ? await uploadCoverImage(coverFile, isbn13) : '',
          ...editionForm,
        }))
      await createArrival(store.id, editionId, arrivalForm)
      setSavedTitle(edition?.title ?? editionForm.title)
      setIsbnInput('')
      setArrivalForm({ ...arrivalForm, price: '' })
      setEditionForm(EMPTY_EDITION_FORM)
      setCoverFile(null)
      queryClient.invalidateQueries({ queryKey: ['store-arrivals', store.id] })
      if (!edition) queryClient.invalidateQueries({ queryKey: ['admin-editions'] })
    } catch (error) {
      if (error instanceof DuplicateArrivalError) {
        setSubmitError(`Essa edição já está registrada como chegada em ${formatDate(arrivalForm.arrivedOn)}.`)
      } else if (error instanceof DuplicateIsbnError) {
        setSubmitError('Essa edição acabou de ser cadastrada por outra pessoa — confira os dados abaixo.')
      } else {
        setSubmitError(error instanceof Error ? error.message : 'Não deu para salvar. Tenta de novo.')
      }
    } finally {
      // A edição pode ter sido criada mesmo com a chegada falhando; a nova consulta troca o formulário
      // manual pelo de edição encontrada.
      if (!edition) queryClient.invalidateQueries({ queryKey: ['edition-by-isbn', isbn13] })
      setSubmitting(false)
    }
  }

  const arrivalFields = (
    <>
      <FieldRow direction="row">
        <TextField
          label="Chegou em"
          type="date"
          required
          fullWidth
          value={arrivalForm.arrivedOn}
          onChange={(event) => setArrivalForm({ ...arrivalForm, arrivedOn: event.target.value })}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <PriceField
          label="Preço na loja"
          value={arrivalForm.price}
          onChange={(price) => setArrivalForm({ ...arrivalForm, price })}
        />
      </FieldRow>
      {submitError && <Alert severity="error">{submitError}</Alert>}
    </>
  )
  const arrivalFormValid = arrivalForm.arrivedOn !== '' && isPriceInputValid(arrivalForm.price)

  return (
    <Box sx={{ px: { xs: 2.5, md: 5 }, py: { xs: 4, md: 5 } }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 3 }}>
        <IconButton aria-label="Voltar" component={Link} to="/admin" edge="start" sx={{ display: { md: 'none' } }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h2">Chegadas{store ? ` na ${store.name}` : ''}</Typography>
      </Stack>

      {storeQuery.isLoading && <LoadingSpinner size={28} sx={{ py: 4 }} />}
      {storeQuery.isError && <Alert severity="error">Não deu para carregar a loja agora.</Alert>}

      {store && (
        <>
          <IsbnField value={isbnInput} onChange={handleIsbnChange} />

          {savedTitle && (
            <Alert severity="success" sx={{ mb: 3 }}>
              "{savedTitle}" registrada. Pode escanear a próxima.
            </Alert>
          )}

          {isbn13 && editionQuery.isLoading && <LoadingSpinner size={24} sx={{ py: 3 }} />}

          {isbn13 && editionQuery.isError && <Alert severity="error">Não deu para consultar o catálogo agora.</Alert>}

          {isbn13 && editionQuery.isSuccess && edition && (
            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <FoundChip label="Encontrado no catálogo" size="small" />
                <Stack spacing={0.25}>
                  <Typography variant="h4">{edition.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {[edition.publisher, edition.volume, edition.format].filter(Boolean).join(' · ') ||
                      'Sem editora informada'}
                  </Typography>
                </Stack>
                {arrivalFields}
                <Button type="submit" variant="contained" disabled={submitting || !arrivalFormValid}>
                  {submitting ? 'Salvando…' : 'Registrar chegada'}
                </Button>
              </Stack>
            </Box>
          )}

          {isbn13 && editionQuery.isSuccess && edition === null && (
            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <NotFoundChip label="Não encontramos no catálogo" size="small" variant="outlined" />
                <Typography variant="body2" color="text.secondary">
                  A edição entra no catálogo, sem exemplar na sua coleção.
                </Typography>
                <NewEditionFields
                  value={editionForm}
                  onChange={setEditionForm}
                  coverFile={coverFile}
                  onCoverFileChange={setCoverFile}
                />
                <Typography variant="h4" sx={{ mt: 1 }}>
                  Chegada
                </Typography>
                {arrivalFields}
                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitting || !isNewEditionFormValid(editionForm) || !arrivalFormValid}
                >
                  {submitting ? 'Salvando…' : 'Cadastrar edição e registrar chegada'}
                </Button>
              </Stack>
            </Box>
          )}

          <Typography variant="h4" sx={{ mt: 5, mb: 0.5 }}>
            Na vitrine
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Chegadas dos últimos {ARRIVAL_WINDOW_DAYS} dias. Depois disso saem sozinhas.
          </Typography>

          {arrivalsQuery.isLoading && <LoadingSpinner size={24} sx={{ py: 3 }} />}
          {arrivalsQuery.isError && <Alert severity="error">Não deu para carregar as chegadas agora.</Alert>}
          {arrivalsQuery.data?.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              Nenhuma chegada registrada.
            </Typography>
          )}

          <EditionGrid>
            {arrivalsQuery.data?.map((arrival) => (
              <StoreArrivalCard key={arrival.id} arrival={arrival} />
            ))}
          </EditionGrid>
        </>
      )}
    </Box>
  )
}
