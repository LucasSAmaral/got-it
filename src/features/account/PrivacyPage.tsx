import { Alert, Box, Button, Link, Stack, Typography } from '@mui/material'
import { useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { AUTHOR_NAME, AUTHOR_URL } from '../../components/MadeBy'
import { NarrationTitle } from '../../components/NarrationTitle'
import { DeleteAccountDialog } from './DeleteAccountDialog'
import { PrivacyPageStack } from './PrivacyPage.styles'

const CONTACT_EMAIL = 'lucassamaraldev@gmail.com'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Stack spacing={1.5} component="section">
      <NarrationTitle component="h3">{title}</NarrationTitle>
      {children}
    </Stack>
  )
}

/**
 * Política de privacidade (LGPD) e, para quem está logado, apagar a conta. Pública: o link aparece no
 * login e no cadastro, antes de a pessoa ter conta.
 */
export function PrivacyPage() {
  const { session } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [deleteOpen, setDeleteOpen] = useState(false)
  // Depois de apagar, a página troca de layout (sem sessão) e remonta; o aviso vem pelo state da navegação.
  const deleted = (location.state as { deleted?: boolean } | null)?.deleted === true

  return (
    <PrivacyPageStack spacing={4}>
      <Stack spacing={1}>
        <Typography variant="h2">Privacidade</Typography>
        <Typography variant="body2" color="text.secondary">
          Atualizada em 29/10/2026
        </Typography>
      </Stack>

      {deleted && <Alert severity="success">Sua conta e sua coleção foram apagadas.</Alert>}

      <Typography>
        O Tem esse? é um projeto independente, mantido por uma pessoa,{' '}
        <Link href={AUTHOR_URL} target="_blank" rel="noopener">
          {AUTHOR_NAME}
        </Link>
        , para catalogar coleções de quadrinhos. Hoje
        ele não tem anúncios nem ferramentas de rastreamento ou de análise de uso, e seus dados não são vendidos. Se
        algo disso mudar, esta página muda antes, com a data acima atualizada.
      </Typography>

      <Section title="O que guardamos">
        <Typography component="ul" sx={{ m: 0, pl: 3 }}>
          <li>Seu e-mail, para entrar e receber os códigos de acesso.</li>
          <li>Sua senha, guardada de forma cifrada: nem nós conseguimos lê-la.</li>
          <li>Sua coleção: os exemplares que você cadastra, com condição, data e preço pago, se informados.</li>
          <li>
            O que você acrescenta ao catálogo compartilhado (edições, séries e capas). Isso fica visível para
            todos os usuários, sem o seu nome.
          </li>
        </Typography>
      </Section>

      <Section title="Quem vê">
        <Typography>
          Sua coleção só aparece para você. O responsável pelo app tem acesso técnico ao banco de dados para
          mantê-lo funcionando e não usa os dados para outro fim.
        </Typography>
        <Typography>
          Ao tocar em "Perguntar se ainda tem", a conversa abre no WhatsApp ou no Instagram, direto com a loja. A
          compra é combinada entre você e a loja, fora do app.
        </Typography>
      </Section>

      <Section title="Onde ficam">
        <Typography>
          Os dados ficam no Supabase (banco de dados, login e capas); o site é hospedado pelo Netlify; os e-mails
          com código saem por uma conta do Gmail; as fontes do site vêm do Google Fonts. Esses serviços podem
          guardar dados fora do Brasil.
        </Typography>
        <Typography>
          Neste aparelho, o app guarda sua sessão e uma cópia da coleção para consultar sem internet. As duas são
          apagadas quando você sai.
        </Typography>
      </Section>

      <Section title="Seus direitos">
        <Typography>
          Você pode corrigir sua coleção pelo próprio app e apagar sua conta a qualquer momento (abaixo). Para
          pedir uma cópia dos seus dados ou tirar dúvidas, escreva para{' '}
          <Link href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</Link>.
        </Typography>
      </Section>

      {session && (
        <Section title="Apagar sua conta">
          <Typography>
            Apaga a conta e a coleção, em todos os aparelhos. Não tem volta. O que você acrescentou ao catálogo
            continua lá, sem o seu nome.
          </Typography>
          <Box>
            <Button variant="outlined" color="error" onClick={() => setDeleteOpen(true)}>
              Apagar minha conta
            </Button>
          </Box>
        </Section>
      )}

      {deleteOpen && (
        <DeleteAccountDialog
          onClose={() => setDeleteOpen(false)}
          onDeleted={() => navigate('/privacidade', { replace: true, state: { deleted: true } })}
        />
      )}
    </PrivacyPageStack>
  )
}
