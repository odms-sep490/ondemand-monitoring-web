import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { supportApi } from '../../../api/supportApi'

export function useTicketDetail(ticketId: string) {
  const query = useApiQuery(
    (signal) => supportApi.getTicketById(ticketId, signal),
    [ticketId],
  )
  return {
    ticket: query.data,
    loading: query.loading,
    error: query.error,
    reload: query.reload,
  }
}
