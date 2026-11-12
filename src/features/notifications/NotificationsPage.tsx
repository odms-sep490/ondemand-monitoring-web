import { Button } from 'antd'

import { useI18n } from '../../shared/i18n'
import { notificationsMessages } from './notifications.messages'
import { NotificationItem } from './NotificationItems'
import type { NotificationRole } from './types'
import { useNotifications } from './useNotifications'
import './notifications.css'

export function NotificationsPage({ role }: { role: NotificationRole }) {
  const { t } = useI18n(notificationsMessages)
  const notifications = useNotifications()

  return (
    <section
      className="odm-notifications-page"
      aria-labelledby="odm-notifications-title"
    >
      <header className="odm-notifications-page-header">
        <div>
          <h1 id="odm-notifications-title">{t.title}</h1>
          <p>{t.pageDescription}</p>
        </div>
        <Button
          type="link"
          disabled={notifications.unreadCount === 0}
          onClick={notifications.markAllRead}
        >
          {t.markAllRead}
        </Button>
      </header>
      <div className="odm-notifications-page-list">
        {notifications.loading && notifications.items.length === 0 ? (
          <p className="odm-notification-state" role="status">
            {t.loading}
          </p>
        ) : notifications.error ? (
          <div className="odm-notification-state" role="alert">
            <p>{t.loadError}</p>
            <Button type="primary" onClick={notifications.reload}>
              {t.retry}
            </Button>
          </div>
        ) : notifications.items.length === 0 ? (
          <div className="odm-notification-state">
            <strong>{t.emptyTitle}</strong>
            <p>{t.emptyDescription}</p>
          </div>
        ) : (
          notifications.items.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              role={role}
              unread={!notifications.readIds.has(notification.id)}
              onClick={() => notifications.markRead(notification.id)}
            />
          ))
        )}
      </div>
    </section>
  )
}
