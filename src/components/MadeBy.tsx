import { Link, Typography, type SxProps, type Theme } from '@mui/material'

export const AUTHOR_NAME = 'Lucas Amaral'
export const AUTHOR_URL = 'https://lucasamaral.dev.br/'

/**
 * "Feito por Lucas Amaral · v1.1.0", com link para o site dele e a versão do app (para saber, num relato de
 * problema, qual versão a pessoa tinha aberta). Discreto, no pé da navegação e das páginas sem
 * conta; fica longe do "Eu tenho?" e da coleção, que precisam de leitura rápida na loja. Abre em outra
 * aba: no PWA instalado, vai para o navegador e o app continua onde estava.
 */
export function MadeBy({ sx }: { sx?: SxProps<Theme> }) {
  return (
    // caption renderiza <span>; como <p>, aceita margem e ocupa a linha.
    <Typography variant="caption" component="p" color="text.secondary" sx={sx}>
      Feito por{' '}
      <Link href={AUTHOR_URL} target="_blank" rel="noopener" color="inherit">
        {AUTHOR_NAME}
      </Link>
      {` · v${__APP_VERSION__}`}
    </Typography>
  )
}
