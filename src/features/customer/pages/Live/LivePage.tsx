import { ErrorState, LoadingState } from '../../components/common/StateView'
import { EmptyState } from '../../../../shared/components/ui'
import { useI18n } from '../../../../shared/i18n'
import { ContextAwareHelpWidget } from '../../../support/components/ContextAwareHelpWidget'
import { LiveHeader } from './components/LiveHeader'
import { useLiveOrder } from './hooks/useLiveOrder'
import { livePageMessages } from './LivePage.messages'

/** Live view of one order; the stream itself is not available from the BE yet. */
export function LivePage({ orderId }: { orderId: string }) {
  const { t } = useI18n(livePageMessages)
  const order = useLiveOrder(orderId)

  if (order.loading && !order.data) return <LoadingState />
  if (!order.data) {
    return <ErrorState title={t.errorTitle} error={order.error} onRetry={order.reload} />
  }

  return (
    <div className="live-page">
      <LiveHeader order={order.data} />
      <EmptyState title={t.soonTitle} description={t.soonDescription} />
      <ContextAwareHelpWidget
        type="MISSION"
        id={orderId}
        status="IN_FLIGHT"
        orderId={orderId}
      />
    </div>
  )
}
