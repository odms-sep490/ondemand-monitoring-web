import { ErrorState, LoadingState } from '../../components/common/StateView'
import { EmptyState, PageHeader } from '../../../../shared/components/ui'
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

  return (
    <div className="lh-page">
      <PageHeader title={t.title} subtitle={t.subtitle} />
      {loading && !data && <LoadingState />}
      {!data && !loading && <ErrorState title={t.errorTitle} error={error} onRetry={reload} />}
      {data && data.length === 0 && (
        <EmptyState
          title={t.noSessionTitle}
          description={t.noSessionDescription}
          action={
            <a className="odm-btn odm-btn-gh" href={customerHref({ screen: 'orders' })}>
              {t.viewOrders}
            </a>
          }
        />
      )}
      {data && data.length > 0 && (
        <ul className="lh-list">
          {data.map((order) => (
            <li key={order.id}>
              <LiveOrderCard order={order} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
