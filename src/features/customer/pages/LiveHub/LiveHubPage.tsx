import { Button } from 'antd'

import { usePagedGrid } from '../../../../shared/components/antd'
import { EmptyState, ErrorState, LoadingState } from '../../components/common/StateView'
import { PageHeader } from '../../components/common/ui'
import { useI18n } from '../../../../shared/i18n'
import { customerHref } from '../../routes'
import { LiveOrderCard } from './components/LiveOrderCard'
import { useLiveOrders } from './hooks/useLiveOrders'
import './LiveHub.css'
import { liveHubPageMessages } from './LiveHubPage.messages'

/** In-progress orders from `GET /api/orders/mine?status=IN_PROGRESS`. */
export function LiveHubPage() {
  const { t } = useI18n(liveHubPageMessages)
  const { data, loading, error, reload } = useLiveOrders()
  const { pageItems, pager } = usePagedGrid(data ?? [], 'live-orders')

  return (
    <div className="cus-page lh-page">
      <PageHeader title={t.title} subtitle={t.subtitle} />
      {loading && !data && <LoadingState />}
      {!data && !loading && <ErrorState title={t.errorTitle} error={error} onRetry={reload} />}
      {data && data.length === 0 && (
        <EmptyState
          title={t.noSessionTitle}
          description={t.noSessionDescription}
          action={
            <Button href={customerHref({ screen: 'orders' })}>{t.viewOrders}</Button>
          }
        />
      )}
      {data && data.length > 0 && (
        <>
          <ul className="lh-list cus-card-grid">
            {pageItems.map((order) => (
              <li key={order.id}>
                <LiveOrderCard order={order} />
              </li>
            ))}
          </ul>
          {pager}
        </>
      )}
    </div>
  )
}
