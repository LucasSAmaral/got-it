import { Stack, styled, Typography } from '@mui/material'
import { tokens } from '../../theme'

/** Base para os três overlays em tela cheia (carregando, mira, erro): cobre o vídeo e centraliza o conteúdo. */
export const CenteredOverlay = styled(Stack)({
  position: 'absolute',
  inset: 0,
  alignItems: 'center',
  justifyContent: 'center',
})

/** Barra do topo com o título e o botão de fechar, sobre o vídeo. */
export const TopBar = styled(Stack)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  padding: theme.spacing(2),
  alignItems: 'center',
  justifyContent: 'space-between',
}))

/** Quadro de mira desenhado sobre o vídeo enquanto a câmera lê. */
export const ScanFrame = styled('div')({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '78%',
  aspectRatio: '1.6',
  border: '2px solid rgba(255,255,255,0.9)',
  borderRadius: `${tokens.radius.md}px`,
  boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
})

/** Texto de ajuda embaixo do quadro de mira. */
export const ScanHelperText = styled(Typography)({
  position: 'absolute',
  bottom: 96,
  left: 0,
  right: 0,
  textAlign: 'center',
  color: '#fff',
  textShadow: '0 1px 4px rgba(0,0,0,0.8)',
})
