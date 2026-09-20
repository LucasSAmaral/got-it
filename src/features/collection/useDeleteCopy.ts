import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteCopy } from './api'

export function useDeleteCopy() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteCopy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection'] })
      queryClient.invalidateQueries({ queryKey: ['check'] })
    },
  })
}
