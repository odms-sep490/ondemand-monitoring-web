import type { UserRole } from '../auth/types'

export type NotificationType =
  | 'ORDER_CREATED'
  | 'MISSION_ASSIGNED'
  | 'MISSION_COMPLETED'
  | 'MISSION_REVIEW_REQUIRED'
  | 'MISSION_WARNING'
  | 'SYSTEM_UPDATE'

export type AppNotification = {
  id: string
  type: NotificationType
  entityId: string
  relatedEntityId?: string
  reference: string
  createdAt: string
}

export type NotificationFeed = { items: AppNotification[] }

export type NotificationRole = Extract<
  UserRole,
  'CUSTOMER' | 'STAFF' | 'MANAGER'
>
