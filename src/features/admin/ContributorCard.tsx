import { Alert, Button, Card, Stack, Typography } from '@mui/material'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { SpeechBalloon } from '../../components/SpeechBalloon'
import { contributorStats } from '../../lib/contributors'
import { setTrusted, suggestTrust, type Contributor } from '../moderation/api'

/**
 * Um colaborador na revisão: e-mail, quantas capas foram aprovadas e recusadas, e o botão de promover a
 * "Usuário confiável" (capas entram direto) ou tirar a confiança. Advertir é por e-mail; bloquear, pelo
 * painel do Supabase.
 */
export function ContributorCard({ contributor }: { contributor: Contributor }) {
  const queryClient = useQueryClient()
  const toggle = useMutation({
    mutationFn: () => setTrusted(contributor.user_id, !contributor.trusted),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['moderation', 'contributors'] }),
  })

  return (
    <Card variant="outlined" sx={{ p: 1.5 }}>
      <Stack spacing={1}>
        <Typography variant="h4" noWrap>
          {contributor.email ?? 'Conta sem e-mail'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {contributorStats(contributor)}
        </Typography>
        {contributor.trusted && <SpeechBalloon tone="success">Usuário confiável</SpeechBalloon>}
        {suggestTrust(contributor) && <SpeechBalloon tone="warning">Pronto para confiável</SpeechBalloon>}
        {toggle.isError && <Alert severity="error">Não deu para salvar agora. Tenta de novo.</Alert>}
        <Button
          size="small"
          variant="outlined"
          color={contributor.trusted ? 'inherit' : 'primary'}
          onClick={() => toggle.mutate()}
          disabled={toggle.isPending}
          sx={{ alignSelf: 'flex-start' }}
        >
          {contributor.trusted ? 'Tirar confiança' : 'Tornar confiável'}
        </Button>
      </Stack>
    </Card>
  )
}
