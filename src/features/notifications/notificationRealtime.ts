import { Client } from '@stomp/stompjs'

import { env } from '../../config/env'
import { authSession } from '../auth/api/authApi'
import type { AppNotification } from './types'

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

function syncClient() {
  const token = authSession.getAccessToken()
  const userId = authSession.getUser()?.id
  if (eventOwnerId !== userId) {
    customerOrderEvents.clear()
    eventOwnerId = userId
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
  if (client && connectedToken === token) return

  stopClient()
  connectedToken = token
  const next = new Client({
    brokerURL: socketUrl(),
    connectHeaders: { Authorization: `Bearer ${token}` },
    reconnectDelay: 5_000,
    heartbeatIncoming: 10_000,
    heartbeatOutgoing: 10_000,
    onConnect: () => {
      if (client !== next) return
      next.subscribe(REFRESH_DESTINATION, () => publish())
      next.subscribe(CUSTOMER_ORDER_DESTINATION, (message) => {
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
    },
    onStompError: () => {
      // The existing 30-second refresh remains as a fallback while reconnecting.
    },
  })
  client = next
  void next.activate()
}

export function subscribeNotificationRefresh(
  listener: (notification?: AppNotification, replay?: boolean) => void,
) {
  listeners.add(listener)
  if (!unsubscribeAuth) {
    unsubscribeAuth = authSession.subscribe(syncClient)
  }
  syncClient()
  customerOrderEvents.forEach((notification) => {
    try {
      listener(notification, true)
    } catch {
      // A stale view must not prevent the remaining cached events from loading.
    }
  })

  return () => {
    listeners.delete(listener)
    if (listeners.size !== 0) return
    unsubscribeAuth?.()
    unsubscribeAuth = undefined
    stopClient()
  }
}
