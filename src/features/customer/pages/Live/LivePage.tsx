import { EmptyState, ErrorState, LoadingState } from '../../components/common/StateView'
import { useI18n } from '../../../../shared/i18n'
import { ContextAwareHelpWidget } from '../../../support/components/ContextAwareHelpWidget'
import { getOrderStatusMeta } from '../../lib/orderStatus'
import { LiveHeader } from './components/LiveHeader'
import { useLiveOrder } from './hooks/useLiveOrder'
import { livePageMessages } from './LivePage.messages'

/** Live view of one order; the stream itself is not available from the BE yet. */
export function LivePage({ orderId }: { orderId: string }) {
  const { t, lang } = useI18n(livePageMessages)
  const order = useLiveOrder(orderId)

  if (order.loading && !order.data) return <LoadingState />
  if (!order.data) {
    return <ErrorState title={t.errorTitle} error={order.error} onRetry={order.reload} />
  }

  return (
    <div className="cus-page live-page">
      <LiveHeader order={order.data} />
      <EmptyState title={t.soonTitle} description={t.soonDescription} />
      <ContextAwareHelpWidget
        type="MISSION"
        id={order.data.code ?? orderId}
        status={order.data.status}
        statusLabel={getOrderStatusMeta(order.data.status, lang).label}
        orderId={orderId}
      />
    </div>
  )
}
