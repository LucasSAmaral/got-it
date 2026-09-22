import CloseIcon from '@mui/icons-material/Close'
import { Alert, Box, Button, CircularProgress, Dialog, IconButton, Stack, Typography } from '@mui/material'
import type { AcceptedScan } from '../../lib/barcode'
import { CenteredOverlay, ScanFrame, ScanHelperText, TopBar } from './ScannerDialog.styles'
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

        <TopBar direction="row">
          <Typography sx={{ color: '#fff', fontWeight: 600, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
            Escanear código
          </Typography>
          <IconButton aria-label="Fechar" onClick={onClose} sx={{ color: '#fff' }}>
            <CloseIcon />
          </IconButton>
        </TopBar>

        {status === 'iniciando' && (
          <CenteredOverlay spacing={2} sx={{ color: '#fff' }}>
            <CircularProgress color="inherit" size={28} />
            <Typography variant="body2">Ligando a câmera…</Typography>
          </CenteredOverlay>
        )}

        {status === 'lendo' && (
          <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <ScanFrame />
            <ScanHelperText variant="body2">Aponte para o código de barras da capa</ScanHelperText>
          </Box>
        )}

        {status !== 'erro' && warning && (
          <Alert severity="warning" sx={{ position: 'absolute', bottom: 24, left: 16, right: 16 }}>
            {warning}
          </Alert>
        )}

        {status === 'erro' && (
          <CenteredOverlay spacing={2} sx={{ px: 4 }}>
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
          </CenteredOverlay>
        )}
      </Box>
    </Dialog>
  )
}
