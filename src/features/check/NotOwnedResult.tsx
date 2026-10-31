import { Box, Button, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { EditionCard } from '../../components/EditionCard'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { SpeechBalloon } from '../../components/SpeechBalloon'
import { isbn13FromInput } from '../../lib/isbn'
import { fetchEditionByIsbn } from '../register/api'
import { EmptyStateCard } from './CheckPage.styles'

type NotOwnedResultProps = {
  /** O que foi digitado ou lido. */
  term: string
  /** A resposta veio da cópia offline: sem rede, não dá para consultar o catálogo. */
  offline: boolean
}

/**
 * "Ainda não tem". Se o termo é um ISBN e a edição existe no catálogo, mostra o cartão dela com a capa, para
 * não parecer que o app não conhece o gibi; senão, o convite para cadastrar. A resposta "ainda não tem" vem da
 * coleção e aparece na hora: o catálogo só complementa, e erro nele cai no cartão de cadastrar.
 */
export function NotOwnedResult({ term, offline }: NotOwnedResultProps) {
  const navigate = useNavigate()
  const isbn13 = isbn13FromInput(term)
  // Mesma chave do cadastro: ao tocar em "Adicionar", a edição já está em cache e o formulário abre preenchido.
  const editionQuery = useQuery({
    queryKey: ['edition-by-isbn', isbn13],
    queryFn: () => fetchEditionByIsbn(isbn13!),
    enabled: isbn13 !== null && !offline,
    retry: false,
  })
  const registerPath = isbn13 ? `/cadastro?isbn=${isbn13}` : '/cadastro'

  const edition = editionQuery.data
  if (editionQuery.isLoading || edition) {
    return (
      <Stack spacing={1.5}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
          Ainda não tem
        </Typography>
        {edition ? (
          <>
            {/* O selo, e não só o rótulo, porque o cartão é igual ao de "Você já tem". No alto, como o da página da série. */}
            <EditionCard
              edition={edition}
              action={
                <Box sx={{ alignSelf: 'flex-start' }}>
                  <SpeechBalloon tone="warning">Não tem</SpeechBalloon>
                </Box>
              }
            />
            <Button variant="contained" onClick={() => navigate(registerPath)}>
              Adicionar à minha coleção
            </Button>
          </>
        ) : (
          <LoadingSpinner size={24} sx={{ py: 2 }} />
        )}
      </Stack>
    )
  }

  return (
    <EmptyStateCard spacing={1.5}>
      <Typography variant="body2" sx={{ fontWeight: 700 }} color="text.secondary">
        Ainda não tem
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {editionQuery.isSuccess
          ? `Não encontramos "${term}" na sua coleção nem no catálogo.`
          : `Não encontramos "${term}" na sua coleção.`}
      </Typography>
      <Button variant="contained" onClick={() => navigate(registerPath)}>
        Cadastrar esta edição
      </Button>
    </EmptyStateCard>
  )
}
