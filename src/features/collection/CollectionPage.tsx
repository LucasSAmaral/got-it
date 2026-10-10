import AddIcon from '@mui/icons-material/Add'
import LogoutIcon from '@mui/icons-material/Logout'
import { Alert, Box, IconButton, Stack, Typography, useMediaQuery, type Theme } from '@mui/material'
import { useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { EditionGrid } from '../../components/EditionGrid'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { SearchField } from '../../components/SearchField'
import { useShowMore } from '../../hooks/useShowMore'
import { paginate, parsePage } from '../../lib/pagination'
import { LogoutDialog } from '../auth/LogoutDialog'
import { CollectionItemCard } from './CollectionItemCard'
import { AddFab, CollectionPagination } from './CollectionPage.styles'
import { OfflineNotice } from './OfflineNotice'
import { useCollection } from './useCollection'

export function CollectionPage() {
  const [query, setQuery] = useState('')
  const { data, isLoading, isError } = useCollection(query)
  const items = data?.items
  const navigate = useNavigate()
  const [logoutOpen, setLogoutOpen] = useState(false)
  // A lista continua vindo inteira (é ela que alimenta a cópia offline); só o que aparece na tela é parcial.
  // Tela larga: páginas de 15, com a página na URL para continuar a mesma ao voltar do detalhe do exemplar.
  // Celular: mais itens ao rolar, que é o gesto natural ali. `noSsr` lê a largura já no primeiro render,
  // senão o desktop abriria um instante no modo celular.
  const isWide = useMediaQuery((theme: Theme) => theme.breakpoints.up('md'), { noSsr: true })
  const [searchParams, setSearchParams] = useSearchParams()
  const { pageItems, page, pageCount } = paginate(items ?? [], parsePage(searchParams.get('pagina')))
  const { visibleCount, hasMore, sentinelRef } = useShowMore(items?.length ?? 0, query.trim())
  const visibleItems = isWide ? pageItems : (items ?? []).slice(0, visibleCount)
  const topRef = useRef<HTMLDivElement>(null)

  const changePage = (newPage: number) => {
    setSearchParams(newPage === 1 ? {} : { pagina: String(newPage) })
    topRef.current?.scrollIntoView()
  }

  // Busca nova começa na primeira página.
  const changeQuery = (newQuery: string) => {
    setQuery(newQuery)
    if (searchParams.has('pagina')) setSearchParams({}, { replace: true })
  }

  return (
    <Box ref={topRef} sx={{ px: { xs: 2.5, md: 5 }, py: { xs: 4, md: 5 } }}>
      <Stack direction="row" sx={{ mb: 2.5, alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Stack spacing={0.5}>
          <Typography variant="h2">Sua coleção</Typography>
          <Typography variant="caption" color="text.secondary">
            {items ? `${items.length} exemplar${items.length === 1 ? '' : 'es'}` : ' '}
          </Typography>
        </Stack>
        {/* Celular: o Sair fica aqui, fora da navegação inferior, onde um toque sem querer é fácil. Na tela larga ele está na barra lateral. */}
        <IconButton
          aria-label="Sair"
          onClick={() => setLogoutOpen(true)}
          sx={{ display: { md: 'none' }, color: 'text.secondary' }}
        >
          <LogoutIcon />
        </IconButton>
      </Stack>
      <LogoutDialog open={logoutOpen} onClose={() => setLogoutOpen(false)} />

      {data?.fromMirror && <OfflineNotice savedAt={data.savedAt} />}

      <SearchField placeholder="Buscar por título, editora ou ISBN" value={query} onChange={changeQuery} />

      {isLoading && <LoadingSpinner size={28} sx={{ py: 4 }} />}

      {isError && <Alert severity="error">Não deu para carregar sua coleção agora.</Alert>}

      {items && items.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          {query.trim() ? 'Nenhum exemplar encontrado.' : 'Sua coleção está vazia. Cadastre o primeiro exemplar.'}
        </Typography>
      )}

      <EditionGrid>
        {visibleItems.map((item) => (
          <CollectionItemCard key={item.copy_id} item={item} showDelete={!data?.fromMirror} />
        ))}
      </EditionGrid>
      {!isWide && hasMore && <Box ref={sentinelRef} />}
      {isWide && pageCount > 1 && (
        <CollectionPagination
          count={pageCount}
          page={page}
          onChange={(_event, newPage) => changePage(newPage)}
          color="primary"
          siblingCount={0}
        />
      )}

      <AddFab color="primary" aria-label="Cadastrar novo exemplar" onClick={() => navigate('/cadastro')}>
        <AddIcon />
      </AddFab>
    </Box>
  )
}
