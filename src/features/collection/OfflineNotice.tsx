import CloudOffOutlinedIcon from '@mui/icons-material/CloudOffOutlined'
import { Alert } from '@mui/material'

function formatSavedAt(savedAt: string) {
  const date = new Date(savedAt)
  const day = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `${day} às ${time}`
}

/** Aparece quando o servidor não respondeu e a tela está mostrando a cópia salva no aparelho. */
export function OfflineNotice({ savedAt }: { savedAt: string | null }) {
  return (
    <Alert severity="info" icon={<CloudOffOutlinedIcon fontSize="small" />} sx={{ mb: 2 }}>
      Sem resposta do servidor. Mostrando a cópia salva{savedAt ? ` em ${formatSavedAt(savedAt)}` : ''}, que pode estar
      desatualizada.
    </Alert>
  )
}
