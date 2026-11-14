import type { UserRole } from '../auth/types'

export type NotificationType =
  | 'ORDER_CREATED'
  | 'ORDER_UNDER_REVIEW'
  | 'ORDER_NEEDS_INFO'
  | 'ORDER_APPROVED'
  | 'ORDER_REJECTED'
  | 'ORDER_IN_PROGRESS'
  | 'ORDER_COMPLETED'
  | 'ORDER_CANCELLED'
  | 'ORDER_DEPOSIT_PAID'
  | 'ORDER_QUOTE_APPROVED'
  | 'ORDER_FINAL_PAYMENT_REQUIRED'
  | 'MISSION_ASSIGNED'
  | 'MISSION_DRONE_REPLACED'
  | 'MISSION_STAFF_ACCEPTED'
  | 'MISSION_STAFF_REPLACEMENT_REQUIRED'
  | 'MISSION_DRONE_REPLACEMENT_REQUIRED'
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
  actorName?: string | null
}

export type NotificationFeed = { items: AppNotification[] }

export type NotificationRole = Extract<
  UserRole,
  'CUSTOMER' | 'STAFF' | 'MANAGER' | 'ADMIN'
>
