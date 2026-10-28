import { SpeechBalloon } from '../../components/SpeechBalloon'

/** "Tenho" / "Falta esse" nos cartões das chegadas (vitrine e Início), em balão de fala. */
export function OwnershipChip({ has }: { has: boolean }) {
  return <SpeechBalloon tone={has ? 'success' : 'warning'}>{has ? 'Tenho' : 'Falta esse'}</SpeechBalloon>
}
