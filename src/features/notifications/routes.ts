import type { UserRole } from '../auth/types'
import { customerHref } from '../customer/routes'
import { managerHref } from '../manager/routes'
import { operatorHref } from '../drone-operator/routes'
import type { AppNotification } from './types'

export function notificationsHref(role: UserRole): string | undefined {
  if (role === 'CUSTOMER') return customerHref({ screen: 'notifications' })
  if (role === 'MANAGER' || role === 'ADMIN')
    return managerHref({ screen: 'notifications' })
  if (role === 'STAFF') return operatorHref({ screen: 'notifications' })
  return undefined
}

export function notificationHref(
  notification: AppNotification,
  role: UserRole,
): string | undefined {
  if (notification.type.startsWith('ORDER_')) {
    if (role === 'CUSTOMER')
      return customerHref({
        screen: 'orderDetail',
        orderId: notification.entityId,
      })
    if (role === 'MANAGER' || role === 'ADMIN')
      return managerHref({
        screen: 'orderReview',
        orderId: notification.entityId,
      })
    return notificationsHref(role)
  }

  if (notification.type === 'SYSTEM_UPDATE') return notificationsHref(role)

  if (role === 'CUSTOMER') {
    // The customer mission-history screens were removed; open the parent
    // Order instead, or fall back to the notification center.
    return notification.relatedEntityId
      ? customerHref({
          screen: 'orderDetail',
          orderId: notification.relatedEntityId,
        })
      : notificationsHref(role)
  }
  if (role === 'MANAGER' || role === 'ADMIN') {
    if (role === 'MANAGER' &&
        ['MISSION_STAFF_REPLACEMENT_REQUIRED', 'MISSION_DRONE_REPLACEMENT_REQUIRED'].includes(notification.type)) {
      return managerHref({ screen: 'missionDetail', missionId: notification.entityId }) + '?tab=plan'
    }
    return managerHref({
      screen: 'missionDetail',
      missionId: notification.entityId,
    })
  }
  if (role === 'STAFF') {
    return operatorHref({
      screen: 'missionDetail',
      missionId: notification.entityId,
    })
  }
  return notificationsHref(role)
}
