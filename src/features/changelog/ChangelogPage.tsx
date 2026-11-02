import { Stack, Typography } from '@mui/material'
import { NarrationTitle } from '../../components/NarrationTitle'
import { CHANGELOG } from '../../lib/changelog'
import { formatDate } from '../../lib/format'
import { PrivacyPageStack } from '../account/PrivacyPage.styles'

/**
 * "Novidades": o que mudou em cada versão, para quem usa o app (abre ao tocar na versão, no `MadeBy`).
 * Pública e sem consulta: o texto vem do código (`src/lib/changelog.ts`), então abre sem conta e sem sinal.
 */
export function ChangelogPage() {
  return (
    <PrivacyPageStack spacing={4}>
      <Stack spacing={1}>
        <Typography variant="h2">Novidades</Typography>
        <Typography variant="body2" color="text.secondary">
          O que mudou em cada versão do app. Você está usando a v{__APP_VERSION__}.
        </Typography>
      </Stack>

      {CHANGELOG.map((entry) => (
        <Stack key={entry.version} spacing={1.5} component="section">
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            {/* A caixa de narração deixa tudo em maiúsculas; "V1.3.0" não é como se escreve versão. */}
            <NarrationTitle component="h3" sx={{ textTransform: 'none' }}>
              v{entry.version}
            </NarrationTitle>
            <Typography variant="body2" color="text.secondary">
              {formatDate(entry.date)}
            </Typography>
          </Stack>
          <Typography component="ul" sx={{ m: 0, pl: 3 }}>
            {entry.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </Typography>
        </Stack>
      ))}
    </PrivacyPageStack>
  )
}
