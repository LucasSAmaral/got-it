import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined'
import {
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { tokens } from '../../theme'
import type { CollectionItem } from '../../types/catalog'
import { ClampedTitle, CoverPlaceholder } from './CollectionItemCard.styles'
import { useDeleteCopy } from './useDeleteCopy'

function initials(title: string) {
  return title
    .split(/\s+/)
    .filter((word) => word.length > 0 && word !== '—')
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join('')
}

export function CollectionItemCard({ item, showDelete = false }: { item: CollectionItem; showDelete?: boolean }) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [coverFailed, setCoverFailed] = useState(false)
  const deleteCopy = useDeleteCopy()

  return (
    <Card variant="outlined" sx={{ display: 'flex', gap: 1.5, alignItems: 'center', p: 1.5, borderColor: 'divider' }}>
      <CoverPlaceholder>
        {item.cover_url && !coverFailed ? (
          <Box
            component="img"
            src={item.cover_url}
            alt=""
            onError={() => setCoverFailed(true)}
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Typography variant="h4" color="text.secondary" sx={{ fontSize: 16 }}>
            {initials(item.title)}
          </Typography>
        )}
      </CoverPlaceholder>
      <Stack spacing={0.25} sx={{ minWidth: 0, flex: 1 }}>
        {/* Celular: uma linha com reticências. Tela larga: até duas linhas, porque o título é o que identifica a edição. */}
        <ClampedTitle variant="h4">{item.title}</ClampedTitle>
        <Typography variant="body2" color="text.secondary" noWrap>
          {[item.publisher, item.volume].filter(Boolean).join(' · ') || 'Editora não informada'}
        </Typography>
        {item.isbn13 && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontFamily: tokens.font.mono, mt: 0.25 }}
          >
            {item.isbn13}
          </Typography>
        )}
      </Stack>

      {showDelete && (
        <>
          <IconButton
            aria-label="Remover exemplar da coleção"
            size="small"
            onClick={() => setConfirmOpen(true)}
            sx={{ alignSelf: 'flex-start', color: 'text.secondary' }}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>

          <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
            <DialogTitle>Remover exemplar?</DialogTitle>
            <DialogContent>
              <DialogContentText>
                "{item.title}" sai da sua coleção. A edição continua no catálogo pra outras pessoas.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setConfirmOpen(false)} color="inherit">
                Cancelar
              </Button>
              <Button
                color="error"
                disabled={deleteCopy.isPending}
                onClick={() => {
                  deleteCopy.mutate(item.copy_id, { onSuccess: () => setConfirmOpen(false) })
                }}
              >
                {deleteCopy.isPending ? 'Removendo…' : 'Remover'}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Card>
  )
}
