// Manager (role MANAGER) client-side routing. All manager screens live under
// the `#portal/manager` hash prefix. `parseManagerRoute` is a pure function so
// it can be unit-tested exhaustively without mounting the router; it plans
// for all 12 MNG-* screens up front so later phases only need to add pages,
// never touch routing shape.
//
// Screen -> design code:
//  dashboard        MNG-01   orderQueue      MNG-02   orderReview   MNG-03
//  missionCreate    MNG-04   missionDispatch MNG-05   schedule      MNG-06
//  missions         MNG-08   drones          MNG-09   maintenance   MNG-10

export const MANAGER_ROOT = '#portal/manager'

export type ManagerRoute =
  | { screen: 'dashboard' }
  | { screen: 'orderQueue' }
  | { screen: 'orderReview'; orderId: string }
  | { screen: 'missionCreate'; orderId: string; replacesMissionId?: string; reworkCaseId?: string }
  | { screen: 'orderResults'; orderId: string }
  | { screen: 'missionDispatch'; missionId: string }
  | { screen: 'missionSetup'; missionId: string }
  | { screen: 'missionDetail'; missionId: string }
  | {
      screen: 'schedule'
      assignmentMissionId?: string
      assignmentCanEdit?: boolean
      assignmentReplaceStaffId?: string
      assignmentReturnOrderId?: string
    }
  | { screen: 'missions'; missionId?: string }
  | { screen: 'drones'; droneId?: string; assignmentMissionId?: string }
  | { screen: 'maintenance' }
  | { screen: 'notifications' }
  | { screen: 'support'; ticketId?: string }
  | { screen: 'notFound' }

export type ManagerScreen = ManagerRoute['screen']


/**
 * Parses a `window.location.hash`-style string into a `ManagerRoute`. Any
 * hash that doesn't start with `#portal/manager` (or doesn't match one of the
 * known screen shapes) resolves to `notFound`.
 */
export function parseManagerRoute(hash: string): ManagerRoute {
  if (hash !== MANAGER_ROOT && !hash.startsWith(`${MANAGER_ROOT}/`)) {
    return { screen: 'notFound' }
  }

  const [pathname, query = ''] = hash.slice(MANAGER_ROOT.length).split('?', 2)
  const segments = pathname.split('/').filter(Boolean).map(decodeURIComponent)
  const searchParams = new URLSearchParams(query)

  if (segments.length === 0) return { screen: 'dashboard' }

  const [head, ...tail] = segments

  switch (head) {
    case 'orders': {
      if (tail.length === 2 && tail[1] === 'results')
        return { screen: 'orderResults', orderId: tail[0] }
      if (tail.length === 1) return { screen: 'orderReview', orderId: tail[0] }
      if (tail.length === 2 && tail[1] === 'mission')
        return { screen: 'missionCreate', orderId: tail[0] }
      if (tail.length === 3 && tail[1] === 'rework')
        return { screen: 'missionCreate', orderId: tail[0], reworkCaseId: tail[2] }
      if (tail.length === 3 && tail[1] === 'replacement')
        return {
          screen: 'missionCreate',
          orderId: tail[0],
          replacesMissionId: tail[2],
        }
      if (tail.length === 0) return { screen: 'orderQueue' }
      return { screen: 'notFound' }
    }
    case 'missions': {
      if (tail.length === 0) return { screen: 'missions' }
      if (tail.length === 1) return { screen: 'missions', missionId: tail[0] }
      if (tail.length === 2 && tail[1] === 'setup')
        return { screen: 'missionSetup', missionId: tail[0] }
      if (tail.length === 2 && tail[1] === 'detail')
        return { screen: 'missionDetail', missionId: tail[0] }
      if (tail.length === 2 && tail[1] === 'dispatch')
        return { screen: 'missionDispatch', missionId: tail[0] }
      return { screen: 'notFound' }
    }
    case 'schedule':
      if (tail.length > 0) return { screen: 'notFound' }
      {
        const assignmentMissionId =
          searchParams.get('assignmentMissionId')?.trim() || undefined
        const assignmentReturnOrderId =
          searchParams.get('assignmentReturnOrderId')?.trim() || undefined
        const assignmentReplaceStaffId =
          searchParams.get('assignmentReplaceStaffId')?.trim() || undefined
        return assignmentMissionId
          ? {
              screen: 'schedule',
              assignmentMissionId,
              assignmentCanEdit: searchParams.get('assignmentCanEdit') === '1',
              ...(assignmentReplaceStaffId ? { assignmentReplaceStaffId } : {}),
              ...(assignmentReturnOrderId ? { assignmentReturnOrderId } : {}),
            }
          : { screen: 'schedule' }
      }
    case 'drones': {
      const assignmentMissionId =
        searchParams.get('assignmentMissionId')?.trim() || undefined
      if (tail.length === 0)
        return assignmentMissionId
          ? { screen: 'drones', droneId: undefined, assignmentMissionId }
          : { screen: 'drones', droneId: undefined }
      if (tail.length === 1)
        return {
          screen: 'drones',
          droneId: tail[0],
          ...(assignmentMissionId ? { assignmentMissionId } : {}),
        }
      return { screen: 'notFound' }
    }
    case 'maintenance':
      return tail.length === 0
        ? { screen: 'maintenance' }
        : { screen: 'notFound' }
    case 'notifications':
      return tail.length === 0
        ? { screen: 'notifications' }
        : { screen: 'notFound' }
    case 'support':
      if (tail.length === 0) return { screen: 'support' }
      if (tail.length === 2 && tail[0] === 'tickets')
        return { screen: 'support', ticketId: tail[1] }
      return { screen: 'notFound' }
    default:
      return { screen: 'notFound' }
  }
}

/** Builds the `#portal/manager/...` href for a given route. Inverse of `parseManagerRoute`. */
export function managerHref(route: ManagerRoute): string {
  switch (route.screen) {
    case 'dashboard':
      return MANAGER_ROOT
    case 'orderQueue':
      return `${MANAGER_ROOT}/orders`
    case 'orderReview':
      return `${MANAGER_ROOT}/orders/${route.orderId}`
    case 'orderResults':
      return `${MANAGER_ROOT}/orders/${route.orderId}/results`
    case 'missionCreate':
      if (route.reworkCaseId)
        return `${MANAGER_ROOT}/orders/${encodeURIComponent(route.orderId)}/rework/${encodeURIComponent(route.reworkCaseId)}`
      return route.replacesMissionId
        ? `${MANAGER_ROOT}/orders/${encodeURIComponent(route.orderId)}/replacement/${encodeURIComponent(route.replacesMissionId)}`
        : `${MANAGER_ROOT}/orders/${route.orderId}/mission`
    case 'missionDispatch':
      return `${MANAGER_ROOT}/missions/${route.missionId}/dispatch`
    case 'missionSetup':
      return `${MANAGER_ROOT}/missions/${route.missionId}/setup`
    case 'missionDetail':
      return `${MANAGER_ROOT}/missions/${route.missionId}/detail`
    case 'schedule': {
      if (!route.assignmentMissionId) return `${MANAGER_ROOT}/schedule`
      const params = new URLSearchParams({
        assignmentMissionId: route.assignmentMissionId,
        assignmentCanEdit: route.assignmentCanEdit ? '1' : '0',
      })
      if (route.assignmentReturnOrderId) {
        params.set('assignmentReturnOrderId', route.assignmentReturnOrderId)
      }
      if (route.assignmentReplaceStaffId) {
        params.set('assignmentReplaceStaffId', route.assignmentReplaceStaffId)
      }
      return `${MANAGER_ROOT}/schedule?${params.toString()}`
    }
    case 'missions':
      return route.missionId
        ? `${MANAGER_ROOT}/missions/${route.missionId}`
        : `${MANAGER_ROOT}/missions`
    case 'drones': {
      const path = route.droneId
        ? `${MANAGER_ROOT}/drones/${route.droneId}`
        : `${MANAGER_ROOT}/drones`
      if (!route.assignmentMissionId) return path
      const params = new URLSearchParams({
        assignmentMissionId: route.assignmentMissionId,
      })
      return `${path}?${params.toString()}`
    }
    case 'maintenance':
      return `${MANAGER_ROOT}/maintenance`
    case 'notifications':
      return `${MANAGER_ROOT}/notifications`
    case 'support':
      return route.ticketId
        ? `${MANAGER_ROOT}/support/tickets/${encodeURIComponent(route.ticketId)}`
        : `${MANAGER_ROOT}/support`
    case 'notFound':
      return MANAGER_ROOT
  }
}
