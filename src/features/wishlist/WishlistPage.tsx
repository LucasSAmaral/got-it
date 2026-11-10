import AddIcon from '@mui/icons-material/Add'
import { Alert, Box, Button, Stack, Typography, useMediaQuery, type Theme } from '@mui/material'
import { useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { EditionGrid } from '../../components/EditionGrid'
import { ListPagination } from '../../components/ListPagination'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { useShowMore } from '../../hooks/useShowMore'
import { paginate, parsePage } from '../../lib/pagination'
import { OfflineNotice } from '../collection/OfflineNotice'
import { useWishlist } from './useWishlist'
import { WishCard } from './WishCard'

/**
 * Lista de desejos: os gibis que a pessoa quer comprar, para mostrar ao atendente na loja. Cada item é uma
 * edição (um ISBN), com capa, título, editora e ISBN à vista, que é o que o atendente procura no sistema.
 * Abre sem sinal pela cópia salva; adicionar e tirar exigem internet. Como na coleção: em tela larga, páginas
 * de 12 com a página na URL (a paginação só aparece com mais de 12); no celular, mais ao rolar.
 */
export function WishlistPage() {
  const navigate = useNavigate()
  const { data, isLoading, isError } = useWishlist()
  const items = data?.items
  const isWide = useMediaQuery((theme: Theme) => theme.breakpoints.up('md'), { noSsr: true })
  const [searchParams, setSearchParams] = useSearchParams()
  const { pageItems, page, pageCount } = paginate(items ?? [], parsePage(searchParams.get('pagina')))
  const { visibleCount, hasMore, sentinelRef } = useShowMore(items?.length ?? 0, '')
  const visibleItems = isWide ? pageItems : (items ?? []).slice(0, visibleCount)
  const topRef = useRef<HTMLDivElement>(null)

  const changePage = (newPage: number) => {
    setSearchParams(newPage === 1 ? {} : { pagina: String(newPage) })
    topRef.current?.scrollIntoView()
  }

  return (
    <Box ref={topRef} sx={{ px: { xs: 2.5, md: 5 }, py: { xs: 4, md: 5 } }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start', justifyContent: 'space-between', mb: 2.5 }}>
        <Stack spacing={0.5}>
          <Typography variant="h2">Lista de desejos</Typography>
          <Typography variant="caption" color="text.secondary">
            {items ? `${items.length} ${items.length === 1 ? 'edição' : 'edições'}` : ' '}
          </Typography>
        </Stack>
        {!data?.fromMirror && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/desejos/adicionar')}>
            Adicionar
          </Button>
        )}
      </Stack>

      {data?.fromMirror && <OfflineNotice savedAt={data.savedAt} />}

      {isLoading && <LoadingSpinner size={28} sx={{ py: 4 }} />}

      {isError && <Alert severity="error">Não deu para carregar sua lista de desejos agora.</Alert>}

      {items && items.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          Sua lista está vazia. Adicione os gibis que você procura e mostre a lista na loja para perguntar se tem
          algum no estoque.
        </Typography>
      )}

      <EditionGrid>
        {visibleItems.map((item) => (
          <WishCard key={item.wish_id} item={item} showDelete={!data?.fromMirror} />
        ))}
      </EditionGrid>
      {!isWide && hasMore && <Box ref={sentinelRef} />}
      {isWide && pageCount > 1 && <ListPagination count={pageCount} page={page} onChange={changePage} />}
    </Box>
  )
}
