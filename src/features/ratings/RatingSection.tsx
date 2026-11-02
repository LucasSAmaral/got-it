import { Alert, Rating, Stack, Typography } from '@mui/material'
import { NarrationTitle } from '../../components/NarrationTitle'
import { tokens } from '../../theme'
import { SectionCard } from '../copy/DetailPage.styles'
import { RatingBadge } from './RatingBadge'
import { useEditionRatingStats, useMyRating, useSetMyRating } from './useRatings'

/**
 * Quadro "Avaliação" do detalhe do exemplar e da edição: a média de todo mundo (para decidir se vale a pena)
 * e "Sua nota", que salva ao tocar. Tocar de novo na estrela da nota atual tira a nota (o `Rating` do MUI
 * manda `null`). Avaliar marca o exemplar como lido (gatilho no banco).
 */
export function RatingSection({ editionId }: { editionId: string }) {
  const stats = useEditionRatingStats([editionId])
  const mine = useMyRating(editionId)
  const setRating = useSetMyRating(editionId)
  const editionStats = stats.data?.get(editionId)
  // Enquanto salva, mostra o valor novo (senão as estrelas voltariam até a resposta).
  const value = setRating.isPending ? setRating.variables : (mine.data ?? null)

  return (
    <SectionCard variant="outlined" sx={{ mt: 2 }}>
      <NarrationTitle sx={{ mb: 1.5 }}>Avaliação</NarrationTitle>
      {editionStats ? (
        <RatingBadge stats={editionStats} />
      ) : (
        !stats.isLoading &&
        !stats.isError && (
          <Typography variant="body2" color="text.secondary">
            Ninguém avaliou ainda.
          </Typography>
        )
      )}
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mt: 1.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Sua nota
        </Typography>
        <Rating
          name={`nota-${editionId}`}
          value={value}
          disabled={mine.isLoading || mine.isError || setRating.isPending}
          onChange={(_, stars) => setRating.mutate(stars)}
          getLabelText={(stars) => `${stars} estrela${stars === 1 ? '' : 's'}`}
          sx={{ color: tokens.color.gold }}
        />
      </Stack>
      {(setRating.isError || mine.isError) && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {setRating.isError
            ? 'Não deu para salvar a nota agora. Confira a conexão e tente de novo.'
            : 'Não deu para carregar a sua nota agora.'}
        </Alert>
      )}
    </SectionCard>
  )
}
