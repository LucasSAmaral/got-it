import { Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Stack, Typography } from '@mui/material'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { LargeCover } from '../../components/LargeCover'
import { formatTimestampDate } from '../../lib/format'
import { tokens } from '../../theme'
import { REPORT_REASONS, removeEditionCover, resolveReport, type EditionReport } from '../moderation/api'

type ReportDialogProps = {
  report: EditionReport
  onClose: () => void
  /** Abre o diálogo de edição; salvar lá tira a denúncia da lista. */
  onEdit: () => void
}

/**
 * Uma denúncia na revisão do admin: a edição, o motivo e o que fazer. Descartar tira da lista sem mudar
 * nada; tirar a capa ou editar os dados resolvem a denúncia. Tirar a capa pede confirmação, porque apaga o
 * arquivo.
 */
export function ReportDialog({ report, onClose, onEdit }: ReportDialogProps) {
  const queryClient = useQueryClient()
  const [confirmingRemoveCover, setConfirmingRemoveCover] = useState(false)
  const { edition } = report
  const reason = REPORT_REASONS.find((option) => option.value === report.reason)?.label ?? report.reason

  const act = useMutation({
    mutationFn: async (action: 'dismiss' | 'removeCover') => {
      if (action === 'removeCover') await removeEditionCover(edition)
      await resolveReport(report.id)
    },
    onSuccess: (_, action) => {
      queryClient.invalidateQueries({ queryKey: ['moderation'] })
      if (action === 'removeCover') queryClient.invalidateQueries({ queryKey: ['admin-editions'] })
      onClose()
    },
  })

  if (confirmingRemoveCover) {
    return (
      <Dialog open onClose={act.isPending ? undefined : onClose}>
        <DialogTitle>Tirar a capa?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            A capa de "{edition.title}" é apagada e todos passam a ver as iniciais do título. A denúncia sai da lista.
          </DialogContentText>
          {act.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {act.error instanceof Error ? act.error.message : 'Não deu para tirar a capa agora.'}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setConfirmingRemoveCover(false)} disabled={act.isPending}>
            Voltar
          </Button>
          <Button color="error" onClick={() => act.mutate('removeCover')} disabled={act.isPending}>
            {act.isPending ? 'Tirando…' : 'Tirar capa'}
          </Button>
        </DialogActions>
      </Dialog>
    )
  }

  return (
    <Dialog open onClose={act.isPending ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>Revisar denúncia</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <LargeCover coverUrl={edition.cover_url} title={edition.title} maxWidth={160} />
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
          </Stack>
          <Alert severity="warning" icon={false}>
            <strong>{reason}</strong> · {formatTimestampDate(report.created_at)}
            {report.details && <>: "{report.details}"</>}
          </Alert>
          <DialogContentText variant="body2">
            Descartar tira a denúncia da lista sem mudar nada. Editar os dados ou tirar a capa também tiram.
          </DialogContentText>
          {act.isError && (
            <Alert severity="error">
              {act.error instanceof Error ? act.error.message : 'Não deu para salvar. Tenta de novo.'}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      {/* Quebra em duas linhas no celular: são quatro botões. */}
      <DialogActions sx={{ flexWrap: 'wrap', gap: 1 }}>
        <Button color="inherit" onClick={onClose} disabled={act.isPending}>
          Depois
        </Button>
        <Button color="inherit" onClick={() => act.mutate('dismiss')} disabled={act.isPending}>
          Descartar denúncia
        </Button>
        {edition.cover_url && (
          <Button color="error" onClick={() => setConfirmingRemoveCover(true)} disabled={act.isPending}>
            Tirar capa
          </Button>
        )}
        <Button variant="contained" onClick={onEdit} disabled={act.isPending}>
          Editar dados
        </Button>
      </DialogActions>
    </Dialog>
  )
}
