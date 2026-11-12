import type {
  AppNotification,
  NotificationType,
} from '../../features/notifications/types'
import { authSession } from '../../features/auth/api/authApi'
import authSeed from '../data/auth-users.json'
import operatorMissionSeed from '../data/operator-missions.json'
import {
  createdOrders as customerCreatedOrders,
  orders as customerOrders,
} from './customerOrdersStore'
import { listBeOrders } from './customerOrdersStore'
import { missions as managerMissions } from './missionsStore'
import { orders as managerOrders } from './ordersStore'
import { fail, ok, registerMockRoutes } from '../mockServer'

type MockUser = {
  id: string
  accessToken: string
  role: 'CUSTOMER' | 'STAFF' | 'MANAGER' | 'ADMIN'
}

type OrderLike = {
  id: string
  status?: string
  orderStatus?: string
  code?: string
  orderCode?: string
  createdAt?: string | null
  updatedAt?: string | null
  submittedAt?: string | null
  reviewAt?: string | null
  approvalAt?: string | null
  customerId?: string
  statusHistory?: { at?: string | null }[]
}

type MissionLike = {
  id: string
  missionCode?: string
  status: string
  orderId?: string
  orderCode?: string
  createdAt?: string | null
  updatedAt?: string | null
  completedAt?: string | null
  flightStartedAt?: string | null
  staffAssignments?: {
    id: string
    staffId?: string | null
    staffName?: string | null
    responseStatus?: string | null
    respondedAt?: string | null
    isCurrent?: boolean | null
  }[]
}

function orderNotification(order: OrderLike): AppNotification | undefined {
  const status = order.orderStatus ?? order.status
  const type: Partial<Record<string, NotificationType>> = {
    PENDING: 'ORDER_CREATED',
    SUBMITTED: 'ORDER_CREATED',
    UNDER_REVIEW: 'ORDER_UNDER_REVIEW',
    NEEDS_INFO: 'ORDER_NEEDS_INFO',
    APPROVED: 'ORDER_APPROVED',
    SCHEDULED: 'ORDER_APPROVED',
    REJECTED: 'ORDER_REJECTED',
    IN_PROGRESS: 'ORDER_IN_PROGRESS',
    COMPLETED: 'ORDER_COMPLETED',
    CANCELLED: 'ORDER_CANCELLED',
  }
  const notificationType = status ? type[status] : undefined
  if (!notificationType) return

  const timestamp =
    order.reviewAt ??
    order.approvalAt ??
    order.updatedAt ??
    order.statusHistory?.at(-1)?.at ??
    order.submittedAt ??
    order.createdAt ??
    new Date().toISOString()
  const reference = order.orderCode ?? order.code ?? order.id
  return {
    id: `order:${order.id}:${notificationType.toLowerCase()}`,
    type: notificationType,
    entityId: order.id,
    reference,
    createdAt: timestamp,
  }
}

function missionNotification(
  mission: MissionLike,
  role: 'STAFF' | 'MANAGER' | 'ADMIN',
): AppNotification | undefined {
  let type: NotificationType | undefined
  if (role === 'STAFF') {
    if (mission.status === 'COMPLETED') type = 'MISSION_COMPLETED'
    else if (mission.status === 'FAILED') type = 'MISSION_WARNING'
    else type = 'MISSION_ASSIGNED'
  } else if (mission.status === 'FAILED') {
    type = 'MISSION_WARNING'
  } else if (
    ['AWAITING_REVIEW', 'PENDING_REVIEW', 'PENDING_MANAGER_REVIEW'].includes(
      mission.status,
    )
  ) {
    type = 'MISSION_REVIEW_REQUIRED'
  }
  if (!type) return

  return {
    id: `mission:${mission.id}:${type.toLowerCase()}`,
    type,
    entityId: mission.id,
    relatedEntityId: mission.orderId,
    reference: mission.missionCode ?? mission.orderCode ?? mission.id,
    createdAt:
      mission.completedAt ??
      mission.updatedAt ??
      mission.flightStartedAt ??
      mission.createdAt ??
      new Date().toISOString(),
  }
}

function acceptedStaffNotifications(mission: MissionLike): AppNotification[] {
  const notifications = new Map<string, AppNotification>()
  for (const assignment of mission.staffAssignments ?? []) {
    if (
      assignment.responseStatus !== 'ACCEPTED' ||
      assignment.isCurrent === false
    ) {
      continue
    }
    const acceptedAt =
      assignment.respondedAt ??
      mission.updatedAt ??
      mission.createdAt ??
      new Date().toISOString()
    const staffId = assignment.staffId ?? assignment.staffName ?? assignment.id
    const id = `mission-staff-accepted:${mission.id}:${staffId}:${acceptedAt}`
    if (notifications.has(id)) continue
    notifications.set(id, {
      id,
      type: 'MISSION_STAFF_ACCEPTED',
      entityId: mission.id,
      relatedEntityId: mission.orderId,
      reference: mission.missionCode ?? mission.id,
      createdAt: acceptedAt,
      actorName: assignment.staffName,
    })
  }
  return [...notifications.values()]
}

function feedFor(user: MockUser): AppNotification[] {
  if (user.role === 'CUSTOMER') {
    const orders = [
      ...customerOrders.filter((order) => order.customerId === user.id),
      ...customerCreatedOrders.filter((order) => order.customerId === user.id),
    ] as unknown as OrderLike[]
    return orders
      .map(orderNotification)
      .filter((item): item is AppNotification => item !== undefined)
  }

  if (user.role === 'MANAGER' || user.role === 'ADMIN') {
    const managerRole: 'MANAGER' | 'ADMIN' = user.role
    const orders = [
      ...managerOrders,
      ...listBeOrders(),
    ] as unknown as OrderLike[]
    const orderItems = orders
      .filter((order) =>
        ['PENDING', 'UNDER_REVIEW', 'NEEDS_INFO'].includes(
          order.orderStatus ?? order.status ?? '',
        ),
      )
      .map(orderNotification)
      .filter((item): item is AppNotification => item !== undefined)
    const missionItems = (managerMissions as unknown as MissionLike[]).flatMap(
      (mission) => [
        ...acceptedStaffNotifications(mission),
        missionNotification(mission, managerRole),
      ].filter((item): item is AppNotification => item !== undefined),
    )
    return [...orderItems, ...missionItems]
  }

  const operatorMissions = operatorMissionSeed.missions as MissionLike[]
  return operatorMissions
    .map((mission) => missionNotification(mission, 'STAFF'))
    .filter((item): item is AppNotification => item !== undefined)
}

registerMockRoutes([
  {
    method: 'GET',
    path: '/api/notifications',
    handler: ({ headers, query }) => {
      const token = headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
      const sessionUser = authSession.getUser()
      const users = authSeed.users as MockUser[]
      const user = token
        ? users.find((candidate) => candidate.accessToken === token)
        : users.find((candidate) => candidate.id === sessionUser?.id)
      if (!user) return fail(401, 'UNAUTHORIZED', 'Sign in first')

      const requestedLimit = Number(query.get('limit') ?? 30)
      const limit = Number.isFinite(requestedLimit)
        ? Math.max(1, Math.min(Math.floor(requestedLimit), 50))
        : 30
      const items = feedFor(user)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
        .slice(0, limit)
      return ok({ items })
    },
  },
])
