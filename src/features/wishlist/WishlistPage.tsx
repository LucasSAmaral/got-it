import AddIcon from '@mui/icons-material/Add'
import { Alert, Box, Button, Stack, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { EditionGrid } from '../../components/EditionGrid'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { OfflineNotice } from '../collection/OfflineNotice'
import { useWishlist } from './useWishlist'
import { WishCard } from './WishCard'

/**
 * Lista de desejos: os gibis que a pessoa quer comprar, para mostrar ao atendente na loja. Cada item é uma
 * edição (um ISBN), com capa, título, editora e ISBN à vista, que é o que o atendente procura no sistema.
 * Abre sem sinal pela cópia salva; adicionar e tirar exigem internet.
 */
export function WishlistPage() {
  const navigate = useNavigate()
  const { data, isLoading, isError } = useWishlist()
  const items = data?.items

  return (
    <Box sx={{ px: { xs: 2.5, md: 5 }, py: { xs: 4, md: 5 } }}>
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
        {items?.map((item) => (
          <WishCard key={item.wish_id} item={item} showDelete={!data?.fromMirror} />
        ))}
      </EditionGrid>
    </Box>
  )
}
