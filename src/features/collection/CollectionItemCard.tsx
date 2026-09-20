import { Box, Card, Stack, Typography } from '@mui/material'
import { tokens } from '../../theme'
import type { CollectionItem } from '../../types/catalog'

function initials(title: string) {
  return title
    .split(/\s+/)
    .filter((word) => word.length > 0 && word !== '—')
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join('')
}

export function CollectionItemCard({ item }: { item: CollectionItem }) {
  return (
    <Card variant="outlined" sx={{ display: 'flex', gap: 1.5, alignItems: 'center', p: 1.5, borderColor: 'divider' }}>
      <Box
        sx={{
          width: 56,
          height: 76,
          flexShrink: 0,
          borderRadius: `${tokens.radius.sm}px`,
          bgcolor: 'background.default',
          border: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="h4" color="text.secondary" sx={{ fontSize: 16 }}>
          {initials(item.title)}
        </Typography>
      </Box>
      <Stack spacing={0.25} sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="h4" noWrap>
          {item.title}
        </Typography>
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
    </Card>
  )
}
