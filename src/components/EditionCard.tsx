import { Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { tokens } from '../theme'
import type { Edition } from '../types/catalog'
import { CoverThumb } from './CoverThumb'
import { CardBody, CardFrame, CardLink, ClampedTitle, PublisherRow } from './EditionCard.styles'

type EditionCardProps = {
  edition: Pick<Edition, 'title' | 'publisher' | 'volume' | 'isbn13' | 'cover_url'>
  /** Botão no canto superior direito (ex.: excluir na coleção, editar no admin). */
  action?: ReactNode
  /** Rota aberta ao tocar na capa ou no texto. O `action` fica fora do link: botão dentro de link não é HTML válido. */
  to?: string
  /** Alternativa ao `to`: tocar na capa ou no texto abre algo na própria tela (ex.: as lojas no Início). */
  onClick?: () => void
  /** Linha extra embaixo do ISBN (ex.: "Chegou em 27/10 · R$ 39,90" nas chegadas da loja). */
  detail?: ReactNode
  /** Selo à direita, na linha da editora (ex.: "Lido" na coleção), sem tirar largura do título. */
  badge?: ReactNode
}

/** Cartão de uma edição: capa, título, editora · volume e ISBN. Usado na coleção, no painel de admin e nas chegadas da loja. */
export function EditionCard({ edition, action, to, onClick, detail, badge }: EditionCardProps) {
  const content = (
    <>
      <CoverThumb coverUrl={edition.cover_url} title={edition.title} />
      <Stack spacing={0.25} sx={{ minWidth: 0, flex: 1 }}>
        {/* Celular: uma linha com reticências. Tela larga: até duas linhas, porque o título é o que identifica a edição. */}
        <ClampedTitle variant="h4">{edition.title}</ClampedTitle>
        <PublisherRow>
          {/* Com selo, a editora encolhe com reticências e o selo fica inteiro à direita. */}
          <Typography variant="body2" color="text.secondary" noWrap sx={{ minWidth: 0 }}>
            {[edition.publisher, edition.volume].filter(Boolean).join(' · ') || 'Editora não informada'}
          </Typography>
          {badge}
        </PublisherRow>
        {edition.isbn13 && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontFamily: tokens.font.mono, mt: 0.25 }}
          >
            {edition.isbn13}
          </Typography>
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

      {action}
    </CardFrame>
  )
}
