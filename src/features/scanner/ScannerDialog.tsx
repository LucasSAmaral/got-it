import CloseIcon from '@mui/icons-material/Close'
import { Alert, Box, Button, CircularProgress, Dialog, IconButton, Stack, Typography } from '@mui/material'
import type { AcceptedScan } from '../../lib/barcode'
import { tokens } from '../../theme'
import { useBarcodeScanner } from './useBarcodeScanner'

type ScannerDialogProps = {
  open: boolean
  onClose: () => void
  onDetected: (result: AcceptedScan) => void
}

/** Câmera em tela cheia para ler o código de barras da capa. */
export function ScannerDialog({ open, onClose, onDetected }: ScannerDialogProps) {
  const { videoContainerRef, status, errorMessage, warning, retry } = useBarcodeScanner(open, onDetected)

  return (
    <Dialog fullScreen open={open} onClose={onClose} slotProps={{ paper: { sx: { bgcolor: '#000' } } }}>
      <Box sx={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
        <Box ref={videoContainerRef} sx={{ width: '100%', height: '100%', display: status === 'erro' ? 'none' : 'block' }} />

        <Stack
          direction="row"
          sx={{ position: 'absolute', top: 0, left: 0, right: 0, p: 2, alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Typography sx={{ color: '#fff', fontWeight: 600, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
            Escanear código
          </Typography>
          <IconButton aria-label="Fechar" onClick={onClose} sx={{ color: '#fff' }}>
            <CloseIcon />
          </IconButton>
        </Stack>

        {status === 'iniciando' && (
          <Stack
            spacing={2}
            sx={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', color: '#fff' }}
          >
            <CircularProgress color="inherit" size={28} />
            <Typography variant="body2">Ligando a câmera…</Typography>
          </Stack>
        )}

        {status === 'lendo' && (
          <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '78%',
                aspectRatio: '1.6',
                border: 2,
                borderColor: 'rgba(255,255,255,0.9)',
                borderRadius: `${tokens.radius.md}px`,
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
              }}
            />
            <Typography
              variant="body2"
              sx={{
                position: 'absolute',
                bottom: 96,
                left: 0,
                right: 0,
                textAlign: 'center',
                color: '#fff',
                textShadow: '0 1px 4px rgba(0,0,0,0.8)',
              }}
            >
              Aponte para o código de barras da capa
            </Typography>
          </Box>
        )}

        {status !== 'erro' && warning && (
          <Alert severity="warning" sx={{ position: 'absolute', bottom: 24, left: 16, right: 16 }}>
            {warning}
          </Alert>
        )}

        {status === 'erro' && (
          <Stack spacing={2} sx={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', px: 4 }}>
            <Alert severity="error" sx={{ width: '100%' }}>
              {errorMessage}
            </Alert>
            <Stack direction="row" spacing={1.5}>
              <Button variant="contained" onClick={retry}>
                Tentar de novo
              </Button>
              <Button variant="outlined" sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.6)' }} onClick={onClose}>
                Digitar o código
              </Button>
            </Stack>
          </Stack>
        )}
      </Box>
    </Dialog>
  )
}
