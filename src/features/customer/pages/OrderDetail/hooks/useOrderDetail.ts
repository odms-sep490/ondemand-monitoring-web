import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { customerApi } from '../../../api/customerApi'
import { toOrderDetail } from '../../../lib/orders/mapOrder'

/** Customer order detail sourced only from `GET /api/orders/{id}`. */
export function useOrderDetail(orderId: string) {
  const query = useApiQuery(
    (signal) => customerApi.getOrderById(orderId, signal).then(toOrderDetail),
    [orderId],
  )
  return {
    order: query.data,
    loading: query.loading,
    error: query.error,
    reload: query.reload,
  }
}
