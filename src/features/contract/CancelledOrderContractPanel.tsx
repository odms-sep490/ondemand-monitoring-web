import { Alert, Button } from 'antd'
import { useApiQuery } from '../../shared/hooks/useApiQuery'
import { useI18n } from '../../shared/i18n'
import { contractApi } from './contractApi'
import { contractCancellationMessages } from './contractCancellation.messages'
import { OrderContractPanel } from './OrderContractPanel'
/** Keep unresolved cases reachable after Order cancellation, including on page reload. */
export function CancelledOrderContractPanel({
  orderId,
  onUpdated,
}: {
  orderId: string
  onUpdated: () => void
}) {
  const { t } = useI18n(contractCancellationMessages)
  const query = useApiQuery(
    (signal) => contractApi.cancellation(orderId, signal),
    [orderId],
  )
  if (query.error)
    return (
      <Alert
        type="warning"
        message={t.loadFailed}
        action={<Button onClick={query.reload}>{t.refresh}</Button>}
      />
    )
  if (!query.data) return null
  return (
    <OrderContractPanel
      orderId={orderId}
      mode="manager"
      onUpdated={onUpdated}
    />
  )
}
