import {
  AlertOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  DollarCircleOutlined,
  FileTextOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { useI18n } from '../../shared/i18n'
import { notificationHref } from './routes'
import { notificationsMessages } from './notifications.messages'
import type { AppNotification } from './types'

const iconByType = {
  ORDER_CREATED: CalendarOutlined,
  ORDER_UNDER_REVIEW: FileTextOutlined,
  ORDER_NEEDS_INFO: AlertOutlined,
  ORDER_APPROVED: CheckCircleOutlined,
  ORDER_REJECTED: AlertOutlined,
  ORDER_IN_PROGRESS: CalendarOutlined,
  ORDER_COMPLETED: CheckCircleOutlined,
  ORDER_CANCELLED: AlertOutlined,
  ORDER_DEPOSIT_PAID: DollarCircleOutlined,
  ORDER_QUOTE_APPROVED: CheckCircleOutlined,
  ORDER_FINAL_PAYMENT_REQUIRED: AlertOutlined,
  MISSION_ASSIGNED: TeamOutlined,
  MISSION_DRONE_REPLACED: CheckCircleOutlined,
  MISSION_STAFF_ACCEPTED: CheckCircleOutlined,
  MISSION_STAFF_REPLACEMENT_REQUIRED: TeamOutlined,
  MISSION_DRONE_REPLACEMENT_REQUIRED: AlertOutlined,
  MISSION_COMPLETED: CheckCircleOutlined,
  MISSION_REVIEW_REQUIRED: FileTextOutlined,
  MISSION_WARNING: AlertOutlined,
  SYSTEM_UPDATE: FileTextOutlined,
} as const

export function notificationCopy(
  notification: AppNotification,
  t: (typeof notificationsMessages)['vi'],
) {
  const reference = notification.reference || notification.entityId
  const copy = {
    ORDER_CREATED: [t.orderTitle, t.orderDescription],
    ORDER_UNDER_REVIEW: [t.orderReviewTitle, t.orderReviewDescription],
    ORDER_NEEDS_INFO: [t.orderInfoTitle, t.orderInfoDescription],
    ORDER_APPROVED: [t.orderApprovedTitle, t.orderApprovedDescription],
    ORDER_REJECTED: [t.orderRejectedTitle, t.orderRejectedDescription],
    ORDER_IN_PROGRESS: [t.orderStartedTitle, t.orderStartedDescription],
    ORDER_COMPLETED: [t.orderCompletedTitle, t.orderCompletedDescription],
    ORDER_CANCELLED: [t.orderCancelledTitle, t.orderCancelledDescription],
    ORDER_DEPOSIT_PAID: [t.depositPaidTitle, t.depositPaidDescription],
    ORDER_QUOTE_APPROVED: [t.quoteApprovedTitle, t.quoteApprovedDescription],
    ORDER_FINAL_PAYMENT_REQUIRED: [
      t.finalPaymentTitle,
      t.finalPaymentDescription,
    ],
    MISSION_DRONE_REPLACED: [t.droneReplacedTitle, t.droneReplacedDescription],
    MISSION_ASSIGNED: [t.assignedTitle, t.assignedDescription],
    MISSION_STAFF_REPLACEMENT_REQUIRED: [t.staffReplacementTitle, t.staffReplacementDescription],
    MISSION_DRONE_REPLACEMENT_REQUIRED: [t.droneReplacementTitle, t.droneReplacementDescription],
    MISSION_STAFF_ACCEPTED: [
      t.staffAcceptedTitle,
      t.staffAcceptedDescription,
    ],
    MISSION_COMPLETED: [t.completedTitle, t.completedDescription],
    MISSION_REVIEW_REQUIRED: [t.reviewTitle, t.reviewDescription],
    MISSION_WARNING: [t.warningTitle, t.warningDescription],
    SYSTEM_UPDATE: [t.systemTitle, t.systemDescription],
  }[notification.type]
  return {
    title: copy[0],
    description: copy[1]
      .replace('{reference}', reference)
      .replace('{actor}', notification.actorName || t.staffFallback),
  }
}

function relativeTime(value: string, locale: string, justNow: string) {
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp)) return ''
  const seconds = Math.round((timestamp - Date.now()) / 1000)
  if (Math.abs(seconds) < 45) return justNow
  const unit =
    Math.abs(seconds) < 3600
      ? 'minute'
      : Math.abs(seconds) < 86_400
        ? 'hour'
        : 'day'
  const divisor = unit === 'minute' ? 60 : unit === 'hour' ? 3600 : 86_400
  return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(
    Math.round(seconds / divisor),
    unit,
  )
}

export function NotificationItem({
  notification,
  role,
  unread,
  onClick,
}: {
  notification: AppNotification
  role: Parameters<typeof notificationHref>[1]
  unread: boolean
  onClick?: () => void
}) {
  const { t, lang } = useI18n(notificationsMessages)
  const Icon = iconByType[notification.type]
  const copy = notificationCopy(notification, t)
  const href = notificationHref(notification, role)

  if (!href) return null
  return (
    <a
      className={`odm-notification-item${unread ? ' is-unread' : ''}`}
      href={href}
      onClick={onClick}
      aria-label={`${copy.title}. ${copy.description}`}
    >
      <span
        className={`odm-notification-item-icon is-${notification.type.toLowerCase()}`}
        aria-hidden="true"
      >
        <Icon />
      </span>
      <span className="odm-notification-item-copy">
        <strong>{copy.title}</strong>
        <span className="odm-notification-item-description">
          {copy.description}
        </span>
        <time dateTime={notification.createdAt}>
          {relativeTime(
            notification.createdAt,
            lang === 'vi' ? 'vi' : 'en',
            t.justNow,
          )}
        </time>
      </span>
      {unread ? (
        <span className="odm-notification-unread-dot" aria-hidden="true" />
      ) : null}
    </a>
  )
}
