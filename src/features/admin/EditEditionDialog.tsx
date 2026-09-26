import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined'
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
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { uploadCoverImage } from '../register/api'
import { FORMATS } from '../register/constants'
import { PublisherField } from '../register/PublisherField'
import { CoverPreview, FieldRow } from '../register/RegisterByIsbnPage.styles'
import { updateEdition, type EditionFormInput, type EditionSummary } from './api'

const EMPTY_FORM: EditionFormInput = { title: '', publisher: '', volume: '', format: '', year: '' }

function formFromEdition(edition: EditionSummary): EditionFormInput {
  return {
    title: edition.title,
    publisher: edition.publisher ?? '',
    volume: edition.volume ?? '',
    format: edition.format ?? '',
    year: edition.year ? String(edition.year) : '',
  }
}

type EditEditionDialogProps = {
  /** `null` fecha o diálogo. */
  edition: EditionSummary | null
  onClose: () => void
}

/** Edita título, editora, volume, formato, ano e capa de uma edição já existente no catálogo. */
export function EditEditionDialog({ edition, onClose }: EditEditionDialogProps) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<EditionFormInput>(EMPTY_FORM)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setForm(edition ? formFromEdition(edition) : EMPTY_FORM)
    setCoverFile(null)
    setError('')
  }, [edition])

  useEffect(() => {
    if (!coverFile) {
      setCoverPreview(null)
      return
    }
    const url = URL.createObjectURL(coverFile)
    setCoverPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [coverFile])

  if (!edition) return null

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!edition) return
    setSaving(true)
    setError('')
    try {
      const coverUrl = coverFile ? await uploadCoverImage(coverFile, edition.isbn13 ?? edition.id) : null
      await updateEdition(edition.id, form, coverUrl)
      await queryClient.invalidateQueries({ queryKey: ['admin-editions'] })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não deu para salvar. Tenta de novo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Editar edição
        <IconButton aria-label="Fechar" onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent>
          <Stack spacing={2}>
            <TextField
              label="Título"
              required
              fullWidth
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
            />

            <FieldRow direction="row">
              <PublisherField value={form.publisher} onChange={(publisher) => setForm({ ...form, publisher })} />
              <TextField
                label="Volume / nº"
                fullWidth
                value={form.volume}
                onChange={(event) => setForm({ ...form, volume: event.target.value })}
              />
            </FieldRow>

            <FieldRow direction="row">
              <TextField
                select
                label="Formato"
                fullWidth
                value={form.format}
                onChange={(event) => setForm({ ...form, format: event.target.value })}
              >
                {FORMATS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Ano"
                fullWidth
                value={form.year}
                onChange={(event) => setForm({ ...form, year: event.target.value })}
              />
            </FieldRow>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(event) => setCoverFile(event.target.files?.[0] ?? null)}
            />
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              {(coverPreview ?? edition.cover_url) && (
                <CoverPreview component="img" src={coverPreview ?? edition.cover_url!} alt="Capa" />
              )}
              <Button
                type="button"
                variant="outlined"
                color="inherit"
                startIcon={<AddPhotoAlternateOutlinedIcon />}
                onClick={() => fileInputRef.current?.click()}
              >
                Trocar capa
              </Button>
            </Stack>

            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button color="inherit" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
