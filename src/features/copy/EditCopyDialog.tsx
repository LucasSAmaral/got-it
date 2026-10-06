import CloseIcon from '@mui/icons-material/Close'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { isPriceInputValid } from '../../lib/format'
import { CONDITIONS } from '../register/constants'
import { PriceField } from '../register/PriceField'
import { copyFormFromDetail, updateCopy, type CopyDetail } from './api'

type EditCopyDialogProps = {
  copy: CopyDetail
  onClose: () => void
}

/**
 * Edita condição, data e preço do exemplar (os mesmos campos do cadastro). Montado só enquanto está aberto,
 * então o formulário nasce dos dados atuais sem precisar de efeito para resetar.
 */
export function EditCopyDialog({ copy, onClose }: EditCopyDialogProps) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(() => copyFormFromDetail(copy))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await updateCopy(copy.id, form)
      // A lista também traz condição e data, e é ela que atualiza a cópia offline.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['copy-detail', copy.id] }),
        queryClient.invalidateQueries({ queryKey: ['collection'] }),
      ])
      onClose()
    } catch {
      setError('Não deu para salvar agora. Confira a conexão e tente de novo.')
      setSaving(false)
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Editar exemplar
        <IconButton aria-label="Fechar" onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent>
          <Stack spacing={2}>
            {/* Um campo por linha: no diálogo do celular, duas colunas cortam a data. */}
            <TextField
              select
              label="Condição"
              fullWidth
              value={form.condition}
              onChange={(event) => setForm({ ...form, condition: event.target.value })}
            >
              <MenuItem value="">
                <em>Não informada</em>
              </MenuItem>
              {CONDITIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Adquirido em"
              type="date"
              fullWidth
              value={form.acquiredAt}
              onChange={(event) => setForm({ ...form, acquiredAt: event.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <PriceField value={form.pricePaid} onChange={(pricePaid) => setForm({ ...form, pricePaid })} />

            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button color="inherit" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={saving || !isPriceInputValid(form.pricePaid)}>
            {saving ? 'Salvando…' : 'Salvar'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
