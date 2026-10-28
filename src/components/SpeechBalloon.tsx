import { styled } from '@mui/material'
import { tokens } from '../theme'

type Tone = 'success' | 'warning' | 'neutral'

const TONES: Record<Tone, { background: string; color: string }> = {
  success: { background: tokens.color.success, color: '#ffffff' },
  warning: { background: tokens.color.caption, color: tokens.color.ink },
  neutral: { background: '#ffffff', color: tokens.color.ink },
}

const Balloon = styled('span', { shouldForwardProp: (prop) => prop !== 'tone' })<{ tone: Tone }>(({ tone }) => ({
  position: 'relative',
  display: 'inline-block',
  alignSelf: 'flex-start',
  // Espaço para o rabicho, que fica para fora embaixo.
  marginBottom: 6,
  padding: '1px 10px',
  borderRadius: tokens.radius.pill,
  border: tokens.panel.border,
  backgroundColor: TONES[tone].background,
  color: TONES[tone].color,
  fontFamily: tokens.font.display,
  fontWeight: 700,
  fontSize: 13,
  lineHeight: '20px',
  whiteSpace: 'nowrap',
  // Rabicho: quadrado girado com contorno só embaixo e à direita, metade escondida sob o balão.
  '&::after': {
    content: '""',
    position: 'absolute',
    left: 12,
    bottom: -6,
    width: 9,
    height: 9,
    backgroundColor: TONES[tone].background,
    borderRight: tokens.panel.border,
    borderBottom: tokens.panel.border,
    transform: 'rotate(45deg)',
  },
}))

/** Selo em balão de fala ("Tenho", "Falta esse", "Outra edição"), no lugar do Chip nos cartões. */
export function SpeechBalloon({ tone, children }: { tone: Tone; children: string }) {
  return <Balloon tone={tone}>{children}</Balloon>
}
