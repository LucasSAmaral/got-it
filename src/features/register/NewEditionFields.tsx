import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined'
import CloseIcon from '@mui/icons-material/Close'
import { Alert, Button, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import { SpeechBalloon } from '../../components/SpeechBalloon'
import { fillEmpty, prefillFromLookup } from '../../lib/isbnLookup'
import { isAdmin } from '../admin/admin'
import { canPublishCovers } from './api'
import { COMMON_PUBLISHERS, FORMATS, PUBLISHER_ALIASES } from './constants'
import type { NewEditionForm } from './editionForm'
import { PublisherField } from './PublisherField'
import { CoverPreview, FieldLabel, FieldRow } from './RegisterByIsbnPage.styles'
import { SeriesFields } from './SeriesFields'
import { SynopsisField } from './SynopsisField'
import { isPrefilled, useIsbnLookup } from './useIsbnLookup'

type NewEditionFieldsProps = {
  value: NewEditionForm
  onChange: (value: NewEditionForm) => void
  coverFile: File | null
  onCoverFileChange: (file: File | null) => void
  /** ISBN da edição: com ele, os campos vazios vêm preenchidos pela BrasilAPI (base da CBL), quando ela acha. */
  isbn13?: string | null
}

/**
 * Dados de uma edição que ainda não está no catálogo: título, editora, volume, série, formato, ano, sinopse e foto
 * da capa. Usado no cadastro manual e nas chegadas da loja (admin).
 */
export function NewEditionFields({ value, onChange, coverFile, onCoverFileChange, isbn13 = null }: NewEditionFieldsProps) {
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { session } = useAuth()
  // Só para o aviso e o selo; o envio pergunta de novo. Na dúvida (carregando ou erro), nenhum dos dois.
  const { data: trusted } = useQuery({
    queryKey: ['can-publish-covers', session?.user.id],
    queryFn: canPublishCovers,
    staleTime: Infinity,
  })
  const lookup = useIsbnLookup(isbn13)
    // Preenche uma vez por código; depois disso, o que a pessoa apagar ou mudar fica como ela deixou.
  const prefilledIsbnRef = useRef<string | null>(null)

  useEffect(() => {
    if (!isbn13 || !lookup.data || prefilledIsbnRef.current === isbn13) return
    prefilledIsbnRef.current = isbn13
    onChange(fillEmpty(value, prefillFromLookup(lookup.data, COMMON_PUBLISHERS, PUBLISHER_ALIASES)))
  }, [isbn13, lookup.data, value, onChange])

  useEffect(() => {
    if (!coverFile) {
      setCoverPreview(null)
      return
    }
    const url = URL.createObjectURL(coverFile)
    setCoverPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [coverFile])

  return (
    <>
      {lookup.isFetching && (
        <Typography variant="caption" color="text.secondary">
          Procurando os dados deste ISBN…
        </Typography>
      )}
      {isPrefilled(lookup) && (
        <Alert severity="warning" variant="outlined">
          Alguns campos vieram do registro do ISBN, que nem sempre bate com o gibi. Vale o que está na capa: se o
          título preenchido estiver parecido, pode manter; se não, escreva como está impresso.
        </Alert>
      )}

      <TextField
        label="Título"
        required
        fullWidth
        placeholder="Ex.: Watchmen"
        value={value.title}
        onChange={(event) => onChange({ ...value, title: event.target.value })}
      />

      <FieldRow direction="row">
        <PublisherField value={value.publisher} onChange={(publisher) => onChange({ ...value, publisher })} />
        <TextField
          label="Volume / nº"
          fullWidth
          placeholder="Ex.: 1"
          value={value.volume}
          onChange={(event) => onChange({ ...value, volume: event.target.value })}
          // Teclado numérico no celular, como o "Nº na série": no catálogo todo volume é só número (2026-11-22).
          // A coluna continua texto e o campo aceita colar texto; só o teclado muda.
          slotProps={{ htmlInput: { inputMode: 'numeric' } }}
        />
      </FieldRow>

      <SeriesFields
        series={value.series}
        position={value.seriesPosition}
        onSeriesChange={(series) => onChange({ ...value, series })}
        onPositionChange={(seriesPosition) => onChange({ ...value, seriesPosition })}
      />

      <FieldRow direction="row">
        <TextField
          select
          label="Formato"
          fullWidth
          value={value.format}
          onChange={(event) => onChange({ ...value, format: event.target.value })}
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
          placeholder="Ex.: 2024"
          value={value.year}
          onChange={(event) => onChange({ ...value, year: event.target.value })}
        />
      </FieldRow>

      <SynopsisField value={value.synopsis} onChange={(synopsis) => onChange({ ...value, synopsis })} />

      <Stack spacing={0.75}>
        <FieldLabel variant="caption">Foto da capa (opcional)</FieldLabel>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => onCoverFileChange(event.target.files?.[0] ?? null)}
        />
        {coverPreview ? (
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <CoverPreview component="img" src={coverPreview} alt="Prévia da capa" />
            <Button
              type="button"
              size="small"
              color="inherit"
              startIcon={<CloseIcon fontSize="small" />}
              onClick={() => {
                onCoverFileChange(null)
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
            >
              Remover
            </Button>
          </Stack>
        ) : (
          <Button
            type="button"
            variant="outlined"
            color="inherit"
            startIcon={<AddPhotoAlternateOutlinedIcon />}
            onClick={() => fileInputRef.current?.click()}
            sx={{ alignSelf: 'flex-start' }}
          >
            Adicionar foto da capa
          </Button>
        )}
        {trusted === false && (
          <Typography variant="caption" color="text.secondary">
            A capa aparece para as outras pessoas depois de revisada.
          </Typography>
        )}
        {/* O admin também é de confiança, mas o selo é para quem foi promovido pela revisão. */}
        {trusted && !isAdmin(session) && (
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <SpeechBalloon tone="success">Usuário confiável</SpeechBalloon>
            <Typography variant="caption" color="text.secondary">
              Suas capas entram direto no catálogo.
            </Typography>
          </Stack>
        )}
      </Stack>
    </>
  )
}
