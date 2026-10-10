import CollectionsBookmarkOutlinedIcon from '@mui/icons-material/CollectionsBookmarkOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import type { ReactNode } from 'react'
import { useAuth } from '../auth/useAuth'
import { isAdmin } from '../features/admin/admin'

interface NavItem {
  to: string
  label: string
  icon: ReactNode
  /** Outras rotas em que o item fica marcado (ex.: a página de uma série marca "Séries"). */
  alsoActiveOn?: string[]
}

const BASE_NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Coleção', icon: <GridViewOutlinedIcon /> },
  { to: '/eu-tenho', label: 'Eu tenho?', icon: <SearchOutlinedIcon /> },
  { to: '/series', label: 'Séries', icon: <CollectionsBookmarkOutlinedIcon />, alsoActiveOn: ['/serie/'] },
]

const ADMIN_NAV_ITEM: NavItem = { to: '/admin', label: 'Editar catálogo', icon: <EditOutlinedIcon /> }

/** Itens de navegação (Coleção, Eu tenho?, Séries, e Editar catálogo só para o admin). Usado pela Sidebar e pelo AppLayout. */
export function useNavItems() {
  const { session } = useAuth()
  return isAdmin(session) ? [...BASE_NAV_ITEMS, ADMIN_NAV_ITEM] : BASE_NAV_ITEMS
}

/** O item marcado para a rota atual; `undefined` quando nenhum corresponde (ex.: detalhe do exemplar). */
export function activeNavItem(navItems: NavItem[], pathname: string): NavItem | undefined {
  return navItems.find((item) =>
    item.to === '/'
      ? pathname === '/'
      : [item.to, ...(item.alsoActiveOn ?? [])].some((prefix) => pathname.startsWith(prefix)),
  )
}
