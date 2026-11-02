import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Alert, Box, Button, IconButton, Stack, Typography } from '@mui/material'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { EditionCard } from '../../components/EditionCard'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { PageContent } from '../../layout/PageContent'
import { Sidebar } from '../../layout/Sidebar'
import { isbn13FromInput } from '../../lib/isbn'
import { DuplicateIsbnError, createEditionWithCover, fetchEditionByIsbn, fetchMyCopyCount } from '../register/api'
import { EMPTY_EDITION_FORM, isNewEditionFormValid } from '../register/editionForm'
import { IsbnField } from '../register/IsbnField'
import { NewEditionFields } from '../register/NewEditionFields'
import { FoundChip, NotFoundChip } from '../register/RegisterByIsbnPage.styles'
import { addWish } from './api'
import { useWishlist, WISHLIST_KEY } from './useWishlist'

/**
 * Adicionar à lista de desejos pelo ISBN (digitado ou escaneado). Edição do catálogo entra com um toque; fora
 * do catálogo, o mesmo formulário de edição nova do cadastro, mas sem exemplar. Como o cadastro, fica fora do
 * `AppLayout` (formulário de tela inteira).
 */
export function AddWishPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [isbnInput, setIsbnInput] = useState(searchParams.get('isbn') ?? '')
  const [manualEdition, setManualEdition] = useState(EMPTY_EDITION_FORM)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const isbn13 = isbn13FromInput(isbnInput)

  // Mesma chave do cadastro e do "Eu tenho?": vindo de lá, a edição já está em cache.
  const editionQuery = useQuery({
    queryKey: ['edition-by-isbn', isbn13],
    queryFn: () => fetchEditionByIsbn(isbn13!),
    enabled: isbn13 !== null,
  })
  const edition = editionQuery.data

  const copyCountQuery = useQuery({
    queryKey: ['my-copy-count', edition?.id],
    queryFn: () => fetchMyCopyCount(edition!.id),
    enabled: !!edition,
  })
  const wishlist = useWishlist()
  const alreadyWished = !!edition && !!wishlist.data?.items.some((item) => item.edition_id === edition.id)

  async function finish(run: () => Promise<void>) {
    setSubmitting(true)
    setSubmitError('')
    try {
      await run()
      await queryClient.invalidateQueries({ queryKey: WISHLIST_KEY })
      navigate('/desejos')
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

  function handleSubmitExisting(event: FormEvent) {
    event.preventDefault()
    if (edition) finish(() => addWish(edition.id))
  }

  function handleSubmitManual(event: FormEvent) {
    event.preventDefault()
    if (isbn13) finish(async () => addWish(await createEditionWithCover({ isbn13, ...manualEdition }, coverFile)))
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
            <Typography variant="h2">Adicionar à lista de desejos</Typography>
          </Stack>

          <IsbnField value={isbnInput} onChange={setIsbnInput} />

          {isbn13 && editionQuery.isLoading && <LoadingSpinner size={24} sx={{ py: 3 }} />}

          {isbn13 && editionQuery.isError && <Alert severity="error">Não deu para consultar o catálogo agora.</Alert>}

          {isbn13 && editionQuery.isSuccess && edition && (
            <Box component="form" onSubmit={handleSubmitExisting}>
              <Stack spacing={2}>
                <FoundChip label="Encontrado no catálogo" size="small" />
                <EditionCard edition={edition} />

                {/* O app existe para não comprar repetido: avisa, mas deixa (pode querer um segundo exemplar). */}
                {copyCountQuery.data !== undefined && copyCountQuery.data > 0 && (
                  <Alert severity="warning">Você já tem esta edição na sua coleção.</Alert>
                )}

                {submitError && <Alert severity="error">{submitError}</Alert>}

                <Button type="submit" variant="contained" disabled={submitting || alreadyWished}>
                  {alreadyWished ? 'Já está na sua lista' : submitting ? 'Adicionando…' : 'Adicionar à lista de desejos'}
                </Button>
              </Stack>
            </Box>
          )}

          {isbn13 && editionQuery.isSuccess && edition === null && (
            <Box component="form" onSubmit={handleSubmitManual}>
              <Stack spacing={2}>
                <NotFoundChip label="Não encontramos no catálogo" size="small" variant="outlined" />
                <Typography variant="body2" color="text.secondary">
                  Preencha os dados da edição — ela entra no catálogo e as próximas pessoas que escanearem esse ISBN
                  recebem tudo pronto. Na sua coleção ela não entra.
                </Typography>

                <NewEditionFields
                  value={manualEdition}
                  onChange={setManualEdition}
                  coverFile={coverFile}
                  onCoverFileChange={setCoverFile}
                />

                {submitError && <Alert severity="error">{submitError}</Alert>}

                <Button type="submit" variant="contained" disabled={submitting || !isNewEditionFormValid(manualEdition)}>
                  {submitting ? 'Salvando…' : 'Cadastrar e adicionar à lista'}
                </Button>
              </Stack>
            </Box>
          )}
        </Box>
      </PageContent>
    </Box>
  )
}
