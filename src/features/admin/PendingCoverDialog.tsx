import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { LargeCover } from '../../components/LargeCover'
import { contributorStats } from '../../lib/contributors'
import { formatTimestampDate } from '../../lib/format'
import { tokens } from '../../theme'
import { approveCover, rejectCover, type Contributor, type CoverSubmission } from '../moderation/api'

type PendingCoverDialogProps = {
  submission: CoverSubmission
  /** Quem enviou, com o histórico; vazio se a conta foi apagada (ou a lista ainda não carregou). */
  contributor?: Contributor
  onClose: () => void
}

/** Capa da fila em tamanho grande, com aprovar (entra no catálogo) ou recusar (apaga). */
export function PendingCoverDialog({ submission, contributor, onClose }: PendingCoverDialogProps) {
  const queryClient = useQueryClient()
  const { edition } = submission

  const decide = useMutation({
    mutationFn: (approve: boolean) => (approve ? approveCover(submission) : rejectCover(submission)),
    onSuccess: (_, approve) => {
      queryClient.invalidateQueries({ queryKey: ['moderation'] })
      if (approve) queryClient.invalidateQueries({ queryKey: ['admin-editions'] })
      onClose()
    },
  })

  return (
    <Dialog open onClose={decide.isPending ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>Revisar capa</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <LargeCover coverUrl={submission.previewUrl} title={edition.title} maxWidth={240} />
          <Stack spacing={0.25}>
            <Typography variant="h4">{edition.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {[edition.publisher, edition.volume].filter(Boolean).join(' · ') || 'Editora não informada'}
            </Typography>
            {edition.isbn13 && (
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: tokens.font.mono }}>
                {edition.isbn13}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary">
              Enviada em {formatTimestampDate(submission.created_at)}
              {contributor && ` por ${contributor.email ?? 'conta sem e-mail'}`}
            </Typography>
            {contributor && (
              <Typography variant="body2" color="text.secondary">
                Histórico: {contributorStats(contributor)}
              </Typography>
            )}
          </Stack>
          {edition.cover_url && <Alert severity="info">A edição já tem capa. Aprovar troca pela nova.</Alert>}
          {decide.isError && (
            <Alert severity="error">
              {decide.error instanceof Error ? decide.error.message : 'Não deu para salvar. Tenta de novo.'}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose} disabled={decide.isPending}>
          Depois
        </Button>
        <Button color="error" onClick={() => decide.mutate(false)} disabled={decide.isPending}>
          Recusar
        </Button>
        <Button variant="contained" onClick={() => decide.mutate(true)} disabled={decide.isPending}>
          Aprovar
        </Button>
      </DialogActions>
    </Dialog>
  )
}
