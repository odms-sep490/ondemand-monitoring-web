import { useI18n } from '../../../../../shared/i18n'
import { fmtDateTime } from '../../../lib/orderStatus'
import { MEDIA_AVAILABLE_EVENT } from '../../../lib/media/notifications'
import type { MediaNotification } from '../../../lib/media/types'
import { customerHref } from '../../../routes'
import { notificationItemMessages } from './NotificationItem.messages'

type Props = { item: MediaNotification; missionLabel: string }

export function NotificationItem({ item, missionLabel }: Props) {
  const { t, locale } = useI18n(notificationItemMessages)
  const known = item.eventType === MEDIA_AVAILABLE_EVENT
  return (
    <li className="nt-item">
      <span className="nt-dot" aria-hidden="true" />
      <div className="nt-main">
        <div className="nt-title">{known ? t.mediaAvailable : t.other(item.eventType)}</div>
        <div className="nt-sub">
          {[missionLabel, item.createdAt ? fmtDateTime(item.createdAt, locale) : null]
            .filter(Boolean)
            .join(' · ')}
        </div>
      </div>
      {known && (
        <a className="nt-link mgr-card-link" href={customerHref({ screen: 'mediaDetail', mediaId: item.mediaId })}>
          {t.view}
        </a>
      )}
    </li>
  )
}
