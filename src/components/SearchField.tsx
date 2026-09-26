import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import { InputAdornment, styled, TextField } from '@mui/material'

/** Pílula arredondada, com largura máxima em tela larga. */
const PillTextField = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(2.5),
  '& .MuiOutlinedInput-root': { borderRadius: 999 },
  [theme.breakpoints.up('md')]: {
    maxWidth: 560,
  },
}))

type SearchFieldProps = {
  value: string
  onChange: (value: string) => void
  placeholder: string
}

/** Campo de busca com lupa, usado na coleção e no painel de admin. */
export function SearchField({ value, onChange, placeholder }: SearchFieldProps) {
  return (
    <PillTextField
      fullWidth
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchOutlinedIcon fontSize="small" color="disabled" />
            </InputAdornment>
          ),
        },
      }}
    />
  )
}
