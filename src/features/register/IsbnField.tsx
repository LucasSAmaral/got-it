import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined'
import { IconButton, InputAdornment, Stack, TextField } from '@mui/material'
import { useState } from 'react'
import { describeScan } from '../../lib/barcode'
import { isbn13FromInput } from '../../lib/isbn'
import { tokens } from '../../theme'
import { LazyScannerDialog } from '../scanner/LazyScannerDialog'
import { FieldLabel } from './RegisterByIsbnPage.styles'

type IsbnFieldProps = {
  value: string
  onChange: (value: string) => void
}

/** Campo de ISBN com o botão da câmera (scanner). Usado no cadastro e nas chegadas da loja (admin). */
export function IsbnField({ value, onChange }: IsbnFieldProps) {
  const [scannerOpen, setScannerOpen] = useState(false)
  // "Lido pela câmera" só vale enquanto o campo tem o código lido; digitar ou limpar já tira o aviso.
  const [scanned, setScanned] = useState<{ code: string; label: string } | null>(null)
  const invalid = value.length > 0 && isbn13FromInput(value) === null
  const scanLabel = scanned?.code === value ? scanned.label : ''

  return (
    <Stack spacing={0.75} sx={{ mb: 3 }}>
      <FieldLabel variant="caption">ISBN</FieldLabel>
      <TextField
        fullWidth
        placeholder="978…"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        error={invalid}
        helperText={invalid ? 'ISBN inválido' : scanLabel ? `Lido pela câmera · ${scanLabel}` : ' '}
        slotProps={{
          htmlInput: { style: { fontFamily: tokens.font.mono } },
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton aria-label="Escanear código de barras" edge="end" onClick={() => setScannerOpen(true)}>
                  <PhotoCameraOutlinedIcon />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />

      <LazyScannerDialog
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={(scan) => {
          setScanned({ code: scan.code, label: describeScan(scan) })
          onChange(scan.code)
          setScannerOpen(false)
        }}
      />
    </Stack>
  )
}
