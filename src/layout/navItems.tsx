import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import { useAuth } from '../auth/useAuth'
import { isAdmin } from '../features/admin/admin'

const BASE_NAV_ITEMS = [
  { to: '/', label: 'Coleção', icon: <GridViewOutlinedIcon /> },
  { to: '/eu-tenho', label: 'Eu tenho?', icon: <SearchOutlinedIcon /> },
]

const ADMIN_NAV_ITEM = { to: '/admin', label: 'Editar catálogo', icon: <EditOutlinedIcon /> }

/** Itens de navegação (Coleção, Eu tenho?, e Editar catálogo só para o admin). Usado pela Sidebar e pelo AppLayout. */
export function useNavItems() {
  const { session } = useAuth()
  return isAdmin(session) ? [...BASE_NAV_ITEMS, ADMIN_NAV_ITEM] : BASE_NAV_ITEMS
}
