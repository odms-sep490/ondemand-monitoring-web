import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { authSession } from '../../auth/api/authApi'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { missionsApi } from '../api/missionsApi'
import { ordersApi } from '../api/ordersApi'
import type { ManagerRoute } from '../routes'
import type { MissionStaffAssignmentResponse } from '../types/missions'

const STORAGE_PREFIX = 'ondemand.manager.notification-read.v1'
const MAX_SEEN_IDS = 500

export type ManagerNotificationReadScope = 'orders' | 'missions' | 'resources'

export type ManagerNotificationReadState = Record<
  ManagerNotificationReadScope,
  string[]
>

const emptyReadState = (): ManagerNotificationReadState => ({
  orders: [],
  missions: [],
  resources: [],
})

export function managerNotificationStorageKey(managerId: string) {
  return `${STORAGE_PREFIX}:${encodeURIComponent(managerId)}`
}

export function loadManagerNotificationReadState(
  managerId: string,
): ManagerNotificationReadState {
  if (typeof window === 'undefined') return emptyReadState()
  try {
    const value = window.localStorage.getItem(managerNotificationStorageKey(managerId))
    if (!value) return emptyReadState()
    const parsed = JSON.parse(value) as Partial<ManagerNotificationReadState>
    const strings = (items: unknown) =>
      Array.isArray(items)
        ? items.filter((item): item is string => typeof item === 'string').slice(-MAX_SEEN_IDS)
        : []
    return {
      orders: strings(parsed.orders),
      missions: strings(parsed.missions),
      resources: strings(parsed.resources),
    }
  } catch {
    return emptyReadState()
  }
}

export function markManagerNotificationsRead(
  managerId: string,
  scope: ManagerNotificationReadScope,
  ids: string[],
): ManagerNotificationReadState {
  const current = loadManagerNotificationReadState(managerId)
  const seen = new Set(current[scope])
  let changed = false
  for (const id of ids) {
    if (!id || seen.has(id)) continue
    seen.add(id)
    changed = true
  }
  if (!changed) return current

  const next = {
    ...current,
    [scope]: [...seen].slice(-MAX_SEEN_IDS),
  }
  try {
    window.localStorage.setItem(
      managerNotificationStorageKey(managerId),
      JSON.stringify(next),
    )
  } catch {
    // Keep the in-memory read state even when browser storage is unavailable.
  }
  return next
}

export function staffRejectionEventKeys(
  missionId: string,
  assignments: MissionStaffAssignmentResponse[] | null | undefined,
) {
  return (assignments ?? [])
    .filter(
      (assignment) =>
        assignment.responseStatus === 'REJECTED' &&
        assignment.isCurrent !== false,
    )
    .map((assignment) => `${missionId}:${assignment.id}`)
}

/** Keeps notification read state on this manager's device and in sync across tabs. */
export function useManagerNotificationReadState(managerId: string) {
  const [readState, setReadState] = useState(() =>
    loadManagerNotificationReadState(managerId),
  )

  useEffect(() => {
    setReadState(loadManagerNotificationReadState(managerId))
  }, [managerId])

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === managerNotificationStorageKey(managerId))
        setReadState(loadManagerNotificationReadState(managerId))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [managerId])

  const markRead = useCallback(
    (scope: ManagerNotificationReadScope, ids: string[]) => {
      if (ids.length === 0) return
      const next = markManagerNotificationsRead(managerId, scope, ids)
      setReadState((current) => {
        const unchanged = (['orders', 'missions', 'resources'] as const).every(
          (key) =>
            current[key].length === next[key].length &&
            current[key].every((id, index) => id === next[key][index]),
        )
        return unchanged ? current : next
      })
    },
    [managerId],
  )

  return { readState, markRead }
}

export function useManagerNavigationNotifications(route: ManagerRoute) {
  const managerId = authSession.getUser()?.id ?? 'manager'
  const { readState, markRead } = useManagerNotificationReadState(managerId)
  const orders = useApiQuery((signal) => ordersApi.getQueue(signal), [])
  const missions = useApiQuery(
    (signal) => missionsApi.listMissions({ signal }),
    [],
  )

  const orderIds = useMemo(
    () => [...new Set(orders.data?.map((order) => order.id) ?? [])],
    [orders.data],
  )
  const resourceAlertKeysByMission = useMemo(() => {
    const alerts: Record<string, string[]> = {}
    for (const mission of missions.data?.items ?? []) {
      const keys = staffRejectionEventKeys(mission.id, mission.staffAssignments)
      if (keys.length > 0) alerts[mission.id] = keys
    }
    return alerts
  }, [missions.data])
  const missionEventIds = useMemo(
    () => Object.values(resourceAlertKeysByMission).flat(),
    [resourceAlertKeysByMission],
  )

  const isMissionScreen =
    route.screen === 'missions' ||
    route.screen === 'missionDetail' ||
    route.screen === 'missionDispatch' ||
    route.screen === 'missionSetup'
  const previousScreen = useRef<ManagerRoute['screen'] | null>(null)
  const missionVisitPending = useRef(false)
  const orderRouteId =
    route.screen === 'orderReview' || route.screen === 'orderResults'
      ? route.orderId
      : undefined

  useEffect(() => {
    const previous = previousScreen.current
    if (
      (route.screen === 'missions' && previous !== 'missions') ||
      (previous === null && isMissionScreen)
    ) {
      missionVisitPending.current = true
    } else if (!isMissionScreen) {
      missionVisitPending.current = false
    }
    previousScreen.current = route.screen
  }, [isMissionScreen, route.screen])

  useEffect(() => {
    if (!missions.data || !missionVisitPending.current) return
    markRead('missions', missionEventIds)
    missionVisitPending.current = false
  }, [markRead, missionEventIds, missions.data, route.screen])

  useEffect(() => {
    if (!orders.data) return
    if (route.screen === 'orderQueue') markRead('orders', orderIds)
    else if (orderRouteId) markRead('orders', [orderRouteId])
  }, [markRead, orderIds, orderRouteId, orders.data, route.screen])

  const refresh = useCallback(() => {
    if (document.visibilityState === 'hidden') return
    orders.reload()
    missions.reload()
  }, [missions.reload, orders.reload])

  useEffect(() => {
    const timer = window.setInterval(refresh, 10_000)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [refresh])

  return {
    missionsLoaded: missions.data !== undefined,
    pendingOrders: orderIds.filter((id) => !readState.orders.includes(id)).length,
    pendingMissions: missionEventIds.filter(
      (id) => !readState.missions.includes(id),
    ).length,
    resourceAlertKeysByMission,
  }
}
