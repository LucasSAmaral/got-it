import { Alert, Box, Typography } from '@mui/material'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { EditionCard } from '../../components/EditionCard'
import { EditionGrid } from '../../components/EditionGrid'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { NarrationTitle } from '../../components/NarrationTitle'
import { formatTimestampDate } from '../../lib/format'
import { fetchCoverSubmissions, fetchEditionReports, type CoverSubmission } from '../moderation/api'
import { isAdmin } from './admin'
import type { EditionSummary } from './api'
import { EditEditionDialog } from './EditEditionDialog'
import { PendingCoverDialog } from './PendingCoverDialog'
import { ReportCard } from './ReportCard'

/**
 * Revisão do catálogo aberto: capas enviadas por quem não é de confiança (só entram depois de aprovadas) e
 * denúncias de capa ou dado errado.
 */
export function ModerationPage() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const covers = useQuery({ queryKey: ['moderation', 'covers'], queryFn: fetchCoverSubmissions })
  const reports = useQuery({ queryKey: ['moderation', 'reports'], queryFn: fetchEditionReports })
  const [reviewing, setReviewing] = useState<CoverSubmission | null>(null)
  const [editing, setEditing] = useState<EditionSummary | null>(null)

  if (!isAdmin(session)) {
    return <Navigate to="/" replace />
  }

  return (
    <Box sx={{ px: { xs: 2.5, md: 5 }, py: { xs: 4, md: 5 } }}>
      <Typography variant="h2" sx={{ mb: 3 }}>
        Revisar
      </Typography>

      <NarrationTitle sx={{ mb: 2 }}>Capas para revisar</NarrationTitle>
      {covers.isLoading && <LoadingSpinner size={28} sx={{ py: 4 }} />}
      {covers.isError && <Alert severity="error">Não deu para consultar as capas agora.</Alert>}
      {covers.data?.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
          Nenhuma capa esperando.
        </Typography>
      )}
      <EditionGrid>
        {covers.data?.map((submission) => (
          <EditionCard
            key={submission.id}
            // A miniatura mostra a capa enviada, não a atual da edição.
            edition={{ ...submission.edition, cover_url: submission.previewUrl }}
            detail={`Enviada em ${formatTimestampDate(submission.created_at)}`}
            onClick={() => setReviewing(submission)}
          />
        ))}
      </EditionGrid>

      <NarrationTitle sx={{ mt: 4, mb: 2 }}>Denúncias</NarrationTitle>
      {reports.isLoading && <LoadingSpinner size={28} sx={{ py: 4 }} />}
      {reports.isError && <Alert severity="error">Não deu para consultar as denúncias agora.</Alert>}
      {reports.data?.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
          Nenhuma denúncia.
        </Typography>
      )}
      <EditionGrid>
        {reports.data?.map((report) => (
          <ReportCard key={report.id} report={report} onEdit={() => setEditing(report.edition)} />
        ))}
      </EditionGrid>

      {reviewing && <PendingCoverDialog submission={reviewing} onClose={() => setReviewing(null)} />}
      <EditEditionDialog
        edition={editing}
        onClose={() => {
          setEditing(null)
          queryClient.invalidateQueries({ queryKey: ['moderation'] })
        }}
      />
    </Box>
  )
}
