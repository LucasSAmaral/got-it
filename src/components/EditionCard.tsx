import { Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { tokens } from '../theme'
import type { Edition } from '../types/catalog'
import { CoverThumb } from './CoverThumb'
import {
  BadgeRow,
  CardBody,
  CardFrame,
  CardLink,
  ClampedTitle,
  CORNER_ACTION_SPACE,
  CornerAction,
} from './EditionCard.styles'

type EditionCardProps = {
  edition: Pick<Edition, 'title' | 'publisher' | 'volume' | 'isbn13' | 'cover_url'>
  /** Botão no canto superior direito (ex.: excluir na coleção, editar no admin). */
  action?: ReactNode
  /**
   * `column` (padrão): a ação é uma coluna à direita, da altura do cartão (ex.: selo e "Adicionar" na série).
   * `corner`: só o canto de cima, e o texto de baixo vai até a borda (ex.: lixeira e "Lido" na coleção).
   */
  actionPlacement?: 'column' | 'corner'
  /** Rota aberta ao tocar na capa ou no texto. O `action` fica fora do link: botão dentro de link não é HTML válido. */
  to?: string
  /** Alternativa ao `to`: tocar na capa ou no texto abre algo na própria tela (ex.: as lojas no Início). */
  onClick?: () => void
  /** Linha extra embaixo do ISBN (ex.: "Chegou em 27/10 · R$ 39,90" nas chegadas da loja). */
  detail?: ReactNode
  /** Selo no canto de baixo, na linha do ISBN (ex.: "Lido" na coleção), sem tirar largura do título nem da editora. */
  badge?: ReactNode
}

/** Cartão de uma edição: capa, título, editora · volume e ISBN. Usado na coleção, no painel de admin e nas chegadas da loja. */
export function EditionCard({ edition, action, actionPlacement = 'column', to, onClick, detail, badge }: EditionCardProps) {
  const corner = actionPlacement === 'corner' && !!action
  const content = (
    <>
      <CoverThumb coverUrl={edition.cover_url} title={edition.title} />
      <Stack spacing={0.25} sx={{ minWidth: 0, flex: 1 }}>
        {/* Celular: uma linha com reticências. Tela larga: até duas linhas, porque o título é o que identifica a edição. */}
        <ClampedTitle variant="h4" sx={{ pr: corner ? CORNER_ACTION_SPACE : 0 }}>
          {edition.title}
        </ClampedTitle>
        <Typography variant="body2" color="text.secondary" noWrap>
          {[edition.publisher, edition.volume].filter(Boolean).join(' · ') || 'Editora não informada'}
        </Typography>
        {(edition.isbn13 || badge) && (
          <BadgeRow sx={{ mt: 0.25 }}>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ fontFamily: tokens.font.mono, minWidth: 0 }}>
              {edition.isbn13}
            </Typography>
            {badge}
          </BadgeRow>
        )}
        {/* Quebra em vez de cortar: aqui costuma estar o preço, que não pode sumir nas reticências. */}
        {detail && (
          <Typography variant="body2" color="text.secondary">
            {detail}
          </Typography>
        )}
      </Stack>
    </>
  )

  return (
    <CardFrame variant="outlined">
      {to ? (
        <CardLink component={Link} to={to}>
          {content}
        </CardLink>
      ) : onClick ? (
        <CardLink onClick={onClick}>{content}</CardLink>
      ) : (
        <CardBody>{content}</CardBody>
      )}

      {corner ? <CornerAction>{action}</CornerAction> : action}
    </CardFrame>
  )
}
