import { Client } from '@stomp/stompjs'

import { env } from '../../config/env'
import { authSession } from '../auth/api/authApi'
import type { AppNotification } from './types'

export type MissionWorkspaceEvent = {
  eventId: string
  missionId: string
  components: (
    'checklist' | 'result' | 'permissions' | 'media' | 'corrections'
  )[]
  occurredAt: string
}

const missionListeners = new Set<(event?: MissionWorkspaceEvent) => void>()
const missionEventIds = new Set<string>()
const MISSION_EVENT_LIMIT = 100
const MISSION_DESTINATION = '/user/queue/mission-events'
const MISSION_COMPONENTS = new Set([
  'checklist',
  'result',
  'permissions',
  'media',
  'corrections',
])

const REFRESH_DESTINATION = '/topic/notifications/refresh'
const CUSTOMER_ORDER_DESTINATION = '/user/queue/order-events'
const listeners = new Set<
  (notification?: AppNotification, replay?: boolean) => void
>()
const customerOrderEvents = new Map<string, AppNotification>()

let client: Client | undefined
let connectedToken: string | undefined
let unsubscribeAuth: (() => void) | undefined
let eventOwnerId: string | undefined
let eventOwnerEpoch: string | undefined

function socketUrl() {
  const url = new URL('/ws', env.apiBaseUrl)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return url.toString()
}

function stopClient() {
  const previous = client
  client = undefined
  connectedToken = undefined
  if (previous?.active) void previous.deactivate()
}

function publish(notification?: AppNotification, replay = false) {
  listeners.forEach((listener) => {
    try {
      listener(notification, replay)
    } catch {
      // A stale view must not prevent other mounted views from refreshing.
    }
  })
}

export function parseCustomerOrderNotification(
  body: string,
): AppNotification | undefined {
  try {
    const event = JSON.parse(body) as {
      eventType?: unknown
      orderId?: unknown
      occurredAt?: unknown
    }
    if (
      typeof event.orderId !== 'string' ||
      typeof event.occurredAt !== 'string'
    )
      return

    const type =
      event.eventType === 'QUOTE_APPROVED'
        ? 'ORDER_QUOTE_APPROVED'
        : event.eventType === 'ORDER_APPROVED'
          ? 'ORDER_APPROVED'
          : event.eventType === 'FINAL_PAYMENT_REQUIRED'
            ? 'ORDER_FINAL_PAYMENT_REQUIRED'
            : undefined
    if (!type) return

    return {
      id: `order:${event.orderId}:${type}:${event.occurredAt}`,
      type,
      entityId: event.orderId,
      reference: event.orderId,
      createdAt: event.occurredAt,
    }
  } catch {
    return
  }
}

function publishMissionEvent(event?: MissionWorkspaceEvent) {
  missionListeners.forEach((listener) => {
    try {
      listener(event)
    } catch {
      // A stale view must not prevent other mounted views from refreshing.
    }
  })
}

function parseMissionWorkspaceEvent(
  body: string,
): MissionWorkspaceEvent | undefined {
  try {
    const event = JSON.parse(body) as MissionWorkspaceEvent | null
    if (
      !event ||
      typeof event.eventId !== 'string' ||
      !event.eventId.trim() ||
      typeof event.missionId !== 'string' ||
      !event.missionId.trim() ||
      typeof event.occurredAt !== 'string' ||
      !event.occurredAt.trim() ||
      !Number.isFinite(Date.parse(event.occurredAt)) ||
      !Array.isArray(event.components) ||
      !event.components.length ||
      !event.components.every((component) => MISSION_COMPONENTS.has(component))
    )
      return
    return event
  } catch {
    return
  }
}

function startListening() {
  if (!unsubscribeAuth) unsubscribeAuth = authSession.subscribe(syncClient)
  syncClient()
}

function stopListeningIfUnused() {
  if (listeners.size || missionListeners.size) return
  unsubscribeAuth?.()
  unsubscribeAuth = undefined
  stopClient()
}

export function subscribeMissionWorkspaceEvents(
  listener: (event?: MissionWorkspaceEvent) => void,
) {
  missionListeners.add(listener)
  startListening()
  return () => {
    missionListeners.delete(listener)
    stopListeningIfUnused()
  }
}

function syncClient() {
  const token = authSession.getAccessToken()
  const userId = authSession.getUser()?.id
  const epoch = authSession.getEpoch()
  const ownerChanged = eventOwnerId !== userId || eventOwnerEpoch !== epoch
  if (ownerChanged || !token) {
    missionEventIds.clear()
    customerOrderEvents.clear()
    eventOwnerId = userId
    eventOwnerEpoch = epoch
  }
  // The backend STOMP handshake validates Cognito JWTs. Do not attempt a
  // websocket connection with mock or stale non-JWT credentials.
  if (
    !token ||
    token.split('.').length !== 3 ||
    typeof WebSocket === 'undefined'
  ) {
    stopClient()
    return
  }
  if (client && connectedToken === token && !ownerChanged) return

  stopClient()
  connectedToken = token
  const next = new Client({
    brokerURL: socketUrl(),
    connectHeaders: { Authorization: `Bearer ${token}` },
    reconnectDelay: 5_000,
    heartbeatIncoming: 10_000,
    heartbeatOutgoing: 10_000,
    onConnect: () => {
      if (!isCurrent()) return
      next.subscribe(REFRESH_DESTINATION, () => {
        if (isCurrent()) publish()
      })
      next.subscribe(CUSTOMER_ORDER_DESTINATION, (message) => {
        if (!isCurrent()) return
        const notification = parseCustomerOrderNotification(message.body)
        if (!notification) return
        customerOrderEvents.set(notification.id, notification)
        while (customerOrderEvents.size > 50) {
          const oldestId = customerOrderEvents.keys().next().value
          if (!oldestId) break
          customerOrderEvents.delete(oldestId)
        }
        publish(notification)
      })
      next.subscribe(MISSION_DESTINATION, (message) => {
        if (!isCurrent()) return
        const event = parseMissionWorkspaceEvent(message.body)
        if (!event || missionEventIds.has(event.eventId)) return
        missionEventIds.add(event.eventId)
        while (missionEventIds.size > MISSION_EVENT_LIMIT) {
          missionEventIds.delete(missionEventIds.values().next().value!)
        }
        publishMissionEvent(event)
      })
      publishMissionEvent()
    },
    onStompError: () => {
      // Notification feeds retain their fallback. Mission workspaces probe versions on reconnect.
    },
  })
  function isCurrent() {
    return (
      client === next &&
      authSession.getAccessToken() === token &&
      authSession.getUser()?.id === userId &&
      authSession.getEpoch() === epoch
    )
  }
  client = next
  void next.activate()
}

export function subscribeNotificationRefresh(
  listener: (notification?: AppNotification, replay?: boolean) => void,
) {
  listeners.add(listener)
  startListening()
  customerOrderEvents.forEach((notification) => {
    try {
      listener(notification, true)
    } catch {
      // A stale view must not prevent the remaining cached events from loading.
    }
  })

  return () => {
    listeners.delete(listener)
    stopListeningIfUnused()
  }
}
