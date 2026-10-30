import CheckIcon from '@mui/icons-material/Check'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import HideImageOutlinedIcon from '@mui/icons-material/HideImageOutlined'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Stack,
} from '@mui/material'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { EditionCard } from '../../components/EditionCard'
import { formatTimestampDate } from '../../lib/format'
import { REPORT_REASONS, removeEditionCover, resolveReport, type EditionReport } from '../moderation/api'

type ReportCardProps = {
  report: EditionReport
  onEdit: () => void
}

/**
 * Uma denúncia na revisão do admin: a edição, o motivo e as ações — editar os dados, tirar a capa e
 * resolver (tira a denúncia da lista; a edição continua).
 */
export function ReportCard({ report, onEdit }: ReportCardProps) {
  const queryClient = useQueryClient()
  const [confirmRemoveCover, setConfirmRemoveCover] = useState(false)
  const { edition } = report
  const reason = REPORT_REASONS.find((option) => option.value === report.reason)?.label ?? report.reason

  const resolve = useMutation({
    mutationFn: () => resolveReport(report.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['moderation'] }),
  })
  const removeCover = useMutation({
    mutationFn: () => removeEditionCover(edition),
    onSuccess: () => {
      setConfirmRemoveCover(false)
      queryClient.invalidateQueries({ queryKey: ['moderation'] })
      queryClient.invalidateQueries({ queryKey: ['admin-editions'] })
    },
  })

  return (
    <EditionCard
      edition={edition}
      detail={
        <>
          {reason} · {formatTimestampDate(report.created_at)}
          {report.details && <>: "{report.details}"</>}
          {resolve.isError && ' · Não deu para resolver agora.'}
        </>
      }
      action={
        <Stack sx={{ alignSelf: 'flex-start' }}>
          <IconButton aria-label={`Editar "${edition.title}"`} size="small" onClick={onEdit} sx={{ color: 'text.secondary' }}>
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
          {edition.cover_url && (
            <IconButton
              aria-label={`Tirar a capa de "${edition.title}"`}
              size="small"
              onClick={() => setConfirmRemoveCover(true)}
              sx={{ color: 'text.secondary' }}
            >
              <HideImageOutlinedIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton
            aria-label="Resolver denúncia"
            size="small"
            onClick={() => resolve.mutate()}
            disabled={resolve.isPending}
            sx={{ color: 'text.secondary' }}
          >
            <CheckIcon fontSize="small" />
          </IconButton>

          <Dialog open={confirmRemoveCover} onClose={() => setConfirmRemoveCover(false)}>
            <DialogTitle>Tirar a capa?</DialogTitle>
            <DialogContent>
              <DialogContentText>
                A capa de "{edition.title}" é apagada e todos passam a ver as iniciais do título. A denúncia continua
                na lista até você resolver.
              </DialogContentText>
              {removeCover.isError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {removeCover.error instanceof Error ? removeCover.error.message : 'Não deu para tirar a capa agora.'}
                </Alert>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setConfirmRemoveCover(false)} color="inherit">
                Cancelar
              </Button>
              <Button color="error" onClick={() => removeCover.mutate()} disabled={removeCover.isPending}>
                {removeCover.isPending ? 'Tirando…' : 'Tirar capa'}
              </Button>
            </DialogActions>
          </Dialog>
        </Stack>
      }
    />
  )
}
