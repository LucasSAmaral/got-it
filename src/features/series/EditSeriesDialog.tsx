import CloseIcon from '@mui/icons-material/Close'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormHelperText,
  IconButton,
  Stack,
  Switch,
  TextField,
} from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { isSeriesPositionInputValid, parseSeriesPosition } from '../../lib/series'
import { DuplicateSeriesTitleError, updateSeries, type Series } from './api'

type EditSeriesDialogProps = {
  workId: string
  series: Series
  onClose: () => void
}

/**
 * Só o admin: corrige o nome da série, diz quantos números ela tem ao todo e se terminou. Montado só
 * enquanto está aberto, então o formulário nasce dos dados atuais sem efeito para resetar.
 */
export function EditSeriesDialog({ workId, series, onClose }: EditSeriesDialogProps) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState(series.title)
  const [totalVolumes, setTotalVolumes] = useState(series.totalVolumes?.toString() ?? '')
  const [completed, setCompleted] = useState(series.completed)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // O total segue a mesma regra do "Nº na série": inteiro positivo, ou vazio (não se sabe).
  const totalValid = isSeriesPositionInputValid(totalVolumes)
  const canSave = title.trim() !== '' && totalValid && !saving

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!canSave) return
    setSaving(true)
    setError('')
    try {
      await updateSeries(workId, { title, totalVolumes: parseSeriesPosition(totalVolumes), completed })
      // O nome da série também aparece na coleção (e na cópia offline), no detalhe e nas sugestões do cadastro.
      await Promise.all(
        [['series', workId], ['series-list'], ['series-titles'], ['collection'], ['copy-detail'], ['edition-detail']].map(
          (queryKey) => queryClient.invalidateQueries({ queryKey }),
        ),
      )
      onClose()
    } catch (caught) {
      setError(
        caught instanceof DuplicateSeriesTitleError
          ? 'Já existe outra série com esse nome.'
          : 'Não deu para salvar agora. Confira a conexão e tente de novo.',
      )
      setSaving(false)
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Editar série
        <IconButton aria-label="Fechar" onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent>
          <Stack spacing={2}>
            <TextField
              label="Nome da série"
              fullWidth
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              error={title.trim() === ''}
            />
            <TextField
              label="Total de números"
              fullWidth
              value={totalVolumes}
              onChange={(event) => setTotalVolumes(event.target.value)}
              error={!totalValid}
              helperText={totalValid ? 'Quantos números a série tem ao todo. Vazio: ainda não se sabe.' : 'Use um número inteiro maior que zero.'}
              slotProps={{ htmlInput: { inputMode: 'numeric' } }}
            />
            <Box>
              <FormControlLabel
                control={<Switch checked={completed} onChange={(event) => setCompleted(event.target.checked)} />}
                label="Série completa"
              />
              <FormHelperText sx={{ mt: 0 }}>Não terá mais lançamentos.</FormHelperText>
            </Box>

            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button color="inherit" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={!canSave}>
            {saving ? 'Salvando…' : 'Salvar'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
