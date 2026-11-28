import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { parseCustomerOrderNotification } from './notificationRealtime'

type FakeClient = {
  active: boolean
  config: {
    onConnect: () => void
    connectHeaders: { Authorization: string }
    reconnectDelay: number
  }
  handlers: Map<string, (message: { body: string }) => void>
  activate: ReturnType<typeof vi.fn>
  deactivate: ReturnType<typeof vi.fn>
  subscribe: ReturnType<typeof vi.fn>
}

const state = vi.hoisted(() => ({
  clients: [] as FakeClient[],
  token: 'first.jwt.token' as string | undefined,
  userId: 'user-1' as string | undefined,
  epoch: 'session-1',
  authListeners: new Set<() => void>(),
}))

vi.mock('@stomp/stompjs', () => ({
  Client: class {
    active = false
    handlers = new Map<string, (message: { body: string }) => void>()
    activate = vi.fn(() => {
      this.active = true
    })
    deactivate = vi.fn(() => {
      this.active = false
      return Promise.resolve()
    })
    subscribe = vi.fn(
      (destination: string, handler: (message: { body: string }) => void) => {
        this.handlers.set(destination, handler)
        return { unsubscribe: vi.fn() }
      },
    )
    config: FakeClient['config']
    constructor(config: FakeClient['config']) {
      this.config = config
      state.clients.push(this)
    }
  },
}))

vi.mock('../auth/api/authApi', () => ({
  authSession: {
    getAccessToken: () => state.token,
    getUser: () => (state.userId ? { id: state.userId } : undefined),
    getEpoch: () => state.epoch,
    subscribe: (listener: () => void) => {
      state.authListeners.add(listener)
      return () => state.authListeners.delete(listener)
    },
  },
}))

vi.mock('../../config/env', () => ({
  env: { apiBaseUrl: 'https://api.example.test' },
}))

describe('customer order websocket events', () => {
  it.each([
    ['QUOTE_APPROVED', 'ORDER_QUOTE_APPROVED'],
    ['FINAL_PAYMENT_REQUIRED', 'ORDER_FINAL_PAYMENT_REQUIRED'],
  ] as const)(
    'maps %s to an actionable order notification',
    (eventType, type) => {
      expect(
        parseCustomerOrderNotification(
          JSON.stringify({
            eventType,
            orderId: 'order-123',
            occurredAt: '2026-11-12T10:00:00Z',
          }),
        ),
      ).toEqual({
        id: `order:order-123:${type}:2026-11-12T10:00:00Z`,
        type,
        entityId: 'order-123',
        reference: 'order-123',
        createdAt: '2026-11-12T10:00:00Z',
      })
    },
  )

  it('ignores unknown or malformed event messages', () => {
    expect(parseCustomerOrderNotification('{bad json')).toBeUndefined()
    expect(
      parseCustomerOrderNotification(
        JSON.stringify({
          eventType: 'ORDER_CANCELLED',
          orderId: 'order-123',
          occurredAt: '2026-11-12T10:00:00Z',
        }),
      ),
    ).toBeUndefined()
  })
})

const MISSION_DESTINATION = '/user/queue/mission-events'
const event = {
  eventId: 'event-1',
  missionId: 'mission-1',
  components: ['checklist', 'result', 'permissions', 'media', 'corrections'],
  occurredAt: '2026-11-27T10:00:00Z',
}

function connect(client = state.clients.at(-1)!) {
  client.handlers.clear()
  client.config.onConnect()
  return client
}

function emit(payload: unknown, client = state.clients.at(-1)!) {
  client.handlers.get(MISSION_DESTINATION)!({ body: JSON.stringify(payload) })
}

function authChanged() {
  state.authListeners.forEach((listener) => listener())
}

describe('shared mission workspace websocket events', () => {
  const cleanups: (() => void)[] = []

  beforeEach(() => {
    vi.resetModules()
    state.clients.length = 0
    state.authListeners.clear()
    state.token = 'first.jwt.token'
    state.userId = 'user-1'
    state.epoch = 'session-1'
    vi.stubGlobal('WebSocket', class {})
  })

  afterEach(() => {
    cleanups.splice(0).forEach((cleanup) => cleanup())
    vi.unstubAllGlobals()
  })

  it.each(['notification', 'mission'] as const)(
    'reuses one client when %s subscribes first and retains it until both sets are empty',
    async (first) => {
      const api = await import('./notificationRealtime')
      const notification = vi.fn()
      const mission = vi.fn()
      const subscribeNotification = () =>
        api.subscribeNotificationRefresh(notification)
      const subscribeMission = () =>
        api.subscribeMissionWorkspaceEvents(mission)
      const stopFirst =
        first === 'notification' ? subscribeNotification() : subscribeMission()
      cleanups.push(stopFirst)
      const client = connect()
      const stopSecond =
        first === 'notification' ? subscribeMission() : subscribeNotification()
      cleanups.push(stopSecond)
      expect(state.clients).toHaveLength(1)
      expect(state.authListeners.size).toBe(1)
      expect(client.activate).toHaveBeenCalledTimes(1)
      expect([...client.handlers.keys()]).toEqual([
        '/topic/notifications/refresh',
        '/user/queue/order-events',
        MISSION_DESTINATION,
      ])
      emit(event)
      expect(mission).toHaveBeenLastCalledWith(event)
      client.handlers.get('/topic/notifications/refresh')!({ body: '' })
      expect(notification).toHaveBeenCalledWith(undefined, false)
      stopFirst()
      expect(client.deactivate).not.toHaveBeenCalled()
      stopSecond()
      expect(client.deactivate).toHaveBeenCalledTimes(1)
      expect(state.authListeners.size).toBe(0)
    },
  )

  it('resyncs every listener on every successful connect and reconnect, without replaying duplicate events', async () => {
    const { subscribeMissionWorkspaceEvents } =
      await import('./notificationRealtime')
    const first = vi.fn()
    const second = vi.fn()
    cleanups.push(
      subscribeMissionWorkspaceEvents(first),
      subscribeMissionWorkspaceEvents(second),
    )
    const client = connect()
    expect(first.mock.calls).toEqual([[undefined]])
    expect(second.mock.calls).toEqual([[undefined]])
    emit(event)
    emit(event)
    connect(client)
    emit(event)
    expect(first.mock.calls).toEqual([[undefined], [event], [undefined]])
    expect(second.mock.calls).toEqual(first.mock.calls)
    expect(state.clients).toHaveLength(1)
  })

  it('bounds duplicate suppression while retaining recent event ids', async () => {
    const { subscribeMissionWorkspaceEvents } =
      await import('./notificationRealtime')
    const listener = vi.fn()
    cleanups.push(subscribeMissionWorkspaceEvents(listener))
    connect()
    listener.mockClear()
    for (let i = 0; i <= 100; i++) emit({ ...event, eventId: `event-${i}` })
    emit({ ...event, eventId: 'event-100' })
    expect(listener).toHaveBeenCalledTimes(101)
    emit({ ...event, eventId: 'event-0' })
    expect(listener).toHaveBeenCalledTimes(102)
  })

  it('ignores malformed messages and unknown components without poisoning deduplication', async () => {
    const { subscribeMissionWorkspaceEvents } =
      await import('./notificationRealtime')
    const listener = vi.fn()
    cleanups.push(subscribeMissionWorkspaceEvents(listener))
    const client = connect()
    listener.mockClear()
    client.handlers.get(MISSION_DESTINATION)!({ body: '{bad json' })
    const malformed = [
      null,
      [],
      'event',
      {},
      { ...event, eventId: '' },
      { ...event, eventId: 1 },
      { ...event, missionId: ' ' },
      { ...event, missionId: null },
      { ...event, occurredAt: 123 },
      { ...event, occurredAt: 'invalid' },
      { ...event, components: [] },
      { ...event, components: 'media' },
      { ...event, components: ['media', 'unknown'] },
      { ...event, components: [null] },
    ]
    malformed.forEach((payload) => emit(payload))
    expect(listener).not.toHaveBeenCalled()
    emit(event)
    expect(listener).toHaveBeenCalledExactlyOnceWith(event)
  })

  it('isolates throwing listeners and does not deliver after unsubscribe', async () => {
    const { subscribeMissionWorkspaceEvents } =
      await import('./notificationRealtime')
    const listener = vi.fn()
    const stopThrowing = subscribeMissionWorkspaceEvents(() => {
      throw new Error('unmounted')
    })
    cleanups.push(stopThrowing, subscribeMissionWorkspaceEvents(listener))
    expect(() => connect()).not.toThrow()
    expect(() => emit(event)).not.toThrow()
    expect(listener).toHaveBeenLastCalledWith(event)
  })

  it('reuses auth headers and reconnect settings on token refresh while preserving duplicate suppression', async () => {
    const { subscribeMissionWorkspaceEvents } =
      await import('./notificationRealtime')
    const listener = vi.fn()
    cleanups.push(subscribeMissionWorkspaceEvents(listener))
    const old = connect()
    emit(event)
    const lateMessage = old.handlers.get(MISSION_DESTINATION)!
    state.token = 'refreshed.jwt.token'
    authChanged()
    expect(old.deactivate).toHaveBeenCalledTimes(1)
    const current = connect()
    expect(current.config.connectHeaders.Authorization).toBe(
      'Bearer refreshed.jwt.token',
    )
    expect(current.config.reconnectDelay).toBe(5000)
    listener.mockClear()
    lateMessage({ body: JSON.stringify({ ...event, eventId: 'late' }) })
    old.config.onConnect()
    emit(event)
    expect(listener).not.toHaveBeenCalled()
    emit({ ...event, eventId: 'fresh' })
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it.each(['user switch', 'new session', 'logout'] as const)(
    'clears deduplication and rejects stale callbacks on %s, even with the same token',
    async (change) => {
      const { subscribeMissionWorkspaceEvents, subscribeNotificationRefresh } =
        await import('./notificationRealtime')
      const listener = vi.fn()
      const notification = vi.fn()
      cleanups.push(
        subscribeMissionWorkspaceEvents(listener),
        subscribeNotificationRefresh(notification),
      )
      const old = connect()
      emit(event)
      const lateMission = old.handlers.get(MISSION_DESTINATION)!
      const lateOrder = old.handlers.get('/user/queue/order-events')!
      const lateRefresh = old.handlers.get('/topic/notifications/refresh')!
      if (change === 'user switch') state.userId = 'user-2'
      if (change === 'new session') state.epoch = 'session-2'
      if (change === 'logout') {
        state.token = undefined
        state.userId = undefined
      }
      authChanged()
      listener.mockClear()
      lateMission({ body: JSON.stringify(event) })
      lateOrder({
        body: JSON.stringify({
          eventType: 'ORDER_APPROVED',
          orderId: 'order-1',
          occurredAt: event.occurredAt,
        }),
      })
      lateRefresh({ body: '' })
      old.config.onConnect()
      expect(listener).not.toHaveBeenCalled()
      expect(notification).not.toHaveBeenCalled()
      expect(old.deactivate).toHaveBeenCalledTimes(1)
      if (change === 'logout') {
        expect(state.clients).toHaveLength(1)
        state.token = 'first.jwt.token'
        state.userId = 'user-1'
        authChanged()
      }
      connect()
      emit(event)
      expect(listener.mock.calls).toEqual([[undefined], [event]])
    },
  )

  it('does not connect with missing or mock tokens and stops a mission-only client', async () => {
    state.token = 'mock-token'
    const { subscribeMissionWorkspaceEvents } =
      await import('./notificationRealtime')
    const listener = vi.fn()
    const stop = subscribeMissionWorkspaceEvents(listener)
    cleanups.push(stop)
    expect(state.clients).toHaveLength(0)
    state.token = 'valid.jwt.token'
    authChanged()
    const client = connect()
    stop()
    listener.mockClear()
    emit(event, client)
    client.config.onConnect()
    expect(listener).not.toHaveBeenCalled()
    expect(client.deactivate).toHaveBeenCalledTimes(1)
    expect(state.authListeners.size).toBe(0)
  })
})
