import { Pagination, styled } from '@mui/material'

/** Paginação abaixo dos cartões, centralizada. Usada nas listas longas em tela larga (coleção e séries). */
const CenteredPagination = styled(Pagination)(({ theme }) => ({
  marginTop: theme.spacing(3),
  '& .MuiPagination-ul': {
    justifyContent: 'center',
  },
}))

export function ListPagination({
  count,
  page,
  onChange,
}: {
  count: number
  page: number
  onChange: (page: number) => void
}) {
  return (
    <CenteredPagination
      count={count}
      page={page}
      onChange={(_event, newPage) => onChange(newPage)}
      color="primary"
      siblingCount={0}
    />
  )
}
