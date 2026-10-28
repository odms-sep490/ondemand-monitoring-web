import { ErrorState, LoadingState } from '../../components/common/StateView'
import { Card, EmptyState, PageHeader } from '../../components/common/ui'
import { useI18n } from '../../../../shared/i18n'
import { Pager } from '../../components/common/Pager'
import { shortId } from '../../lib/media/mapMedia'
import { NotificationItem } from './components/NotificationItem'
import { useNotifications } from './hooks/useNotifications'
import './Notifications.css'
import { notificationsPageMessages } from './NotificationsPage.messages'

/** Media notifications from `GET /api/customer/media-notifications`. */
export function NotificationsPage() {
  const { t } = useI18n(notificationsPageMessages)
  const list = useNotifications()

  return (
    <div className="nt-page">
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        actions={
          <button type="button" className="odm-btn odm-btn-gh" onClick={list.reload}>
            {t.refresh}
          </button>
        }
      />
      {list.loading && !list.loaded && <LoadingState />}
      {!list.loaded && !list.loading && (
        <ErrorState title={t.errorTitle} error={list.error} onRetry={list.reload} />
      )}
      {list.loaded && list.total === 0 && (
        <EmptyState title={t.emptyTitle} description={t.emptyDescription} />
      )}
      {list.loaded && list.total > 0 && (
        <Card>
          <ul className="nt-list">
            {list.items.map((item) => (
              <NotificationItem
                key={item.id}
                item={item}
                missionLabel={list.labels[item.missionId] ?? shortId(item.missionId)}
              />
            ))}
          </ul>
          <div className="nt-footer">
            <Pager
              page={list.page}
              totalPages={list.totalPages}
              totalItems={list.total}
              unit={t.unit}
              onPage={list.setPage}
            />
          </div>
        </Card>
      )}
    </div>
  )
}
