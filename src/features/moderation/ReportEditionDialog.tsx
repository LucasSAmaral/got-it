import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
} from '@mui/material'
import { useState } from 'react'
import { DuplicateReportError, REPORT_REASONS, reportEdition, type ReportReason } from './api'

const MAX_DETAILS = 500

type ReportEditionDialogProps = {
  editionId: string
  title: string
  onClose: () => void
}

/**
 * Denuncia uma edição do catálogo (capa ou dados), que cai na revisão do admin. Montado só enquanto está
 * aberto, então começa vazio a cada vez.
 */
export function ReportEditionDialog({ editionId, title, onClose }: ReportEditionDialogProps) {
  const [reason, setReason] = useState<ReportReason | ''>('')
  const [details, setDetails] = useState('')
  const [status, setStatus] = useState<'idle' | 'pending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')

  async function handleSend() {
    if (!reason) return
    setStatus('pending')
    try {
      await reportEdition(editionId, reason, details)
      setStatus('sent')
    } catch (err) {
      setError(
        err instanceof DuplicateReportError
          ? 'Você já denunciou esta edição. Ela está na fila de revisão.'
          : 'Não deu para enviar agora. Confira a conexão e tente de novo.',
      )
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <Dialog open onClose={onClose}>
        <DialogTitle>Denúncia enviada</DialogTitle>
        <DialogContent>
          <DialogContentText>Obrigado! Vamos revisar "{title}" e corrigir se for o caso.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Fechar</Button>
        </DialogActions>
      </Dialog>
    )
  }

  return (
    <Dialog open onClose={status === 'pending' ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>Denunciar edição</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <DialogContentText>O que tem de errado em "{title}"?</DialogContentText>
          <RadioGroup value={reason} onChange={(event) => setReason(event.target.value as ReportReason)}>
            {REPORT_REASONS.map((option) => (
              <FormControlLabel key={option.value} value={option.value} control={<Radio />} label={option.label} />
            ))}
          </RadioGroup>
          <TextField
            label="Detalhes (opcional)"
            multiline
            minRows={2}
            fullWidth
            value={details}
            onChange={(event) => setDetails(event.target.value.slice(0, MAX_DETAILS))}
            helperText={`${details.length}/${MAX_DETAILS}`}
          />
          {status === 'error' && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={status === 'pending'}>
          Cancelar
        </Button>
        <Button onClick={handleSend} disabled={!reason || status === 'pending'}>
          {status === 'pending' ? 'Enviando…' : 'Enviar denúncia'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
