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
  | { screen: 'missionCreate'; orderId: string; replacesMissionId?: string }
  | { screen: 'missionDispatch'; missionId: string }
  | { screen: 'missionSetup'; missionId: string }
  | { screen: 'missionDetail'; missionId: string }
  | { screen: 'schedule' }
  | { screen: 'missions'; missionId?: string }
  | { screen: 'drones'; droneId?: string }
  | { screen: 'maintenance' }
  | { screen: 'support' }
  | { screen: 'notFound' }

export type ManagerScreen = ManagerRoute['screen']

/** Design artboard code for each screen, used by the "under construction" placeholder. */
export const managerScreenCode: Record<ManagerScreen, string> = {
  dashboard: 'MNG-01',
  orderQueue: 'MNG-02',
  orderReview: 'MNG-03',
  missionCreate: 'MNG-04',
  missionDispatch: 'MNG-05',
  missionSetup: 'MNG-05',
  missionDetail: 'MNG-08',
  schedule: 'MNG-06',
  missions: 'MNG-08',
  drones: 'MNG-09',
  maintenance: 'MNG-10',
  support: 'MNG-SUP',
  notFound: '',
}

/**
 * Parses a `window.location.hash`-style string into a `ManagerRoute`. Any
 * hash that doesn't start with `#portal/manager` (or doesn't match one of the
 * known screen shapes) resolves to `notFound`.
 */
export function parseManagerRoute(hash: string): ManagerRoute {
  if (hash !== MANAGER_ROOT && !hash.startsWith(`${MANAGER_ROOT}/`)) {
    return { screen: 'notFound' }
  }

  const rest = hash.slice(MANAGER_ROOT.length)
  const segments = rest.split('/').filter(Boolean).map(decodeURIComponent)

  if (segments.length === 0) return { screen: 'dashboard' }

  const [head, ...tail] = segments

  switch (head) {
    case 'orders': {
      if (tail.length === 1) return { screen: 'orderReview', orderId: tail[0] }
      if (tail.length === 2 && tail[1] === 'mission')
        return { screen: 'missionCreate', orderId: tail[0] }
      if (tail.length === 3 && tail[1] === 'replacement')
        return { screen: 'missionCreate', orderId: tail[0], replacesMissionId: tail[2] }
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
      return tail.length === 0 ? { screen: 'schedule' } : { screen: 'notFound' }
    case 'drones': {
      if (tail.length === 0) return { screen: 'drones' }
      if (tail.length === 1) return { screen: 'drones', droneId: tail[0] }
      return { screen: 'notFound' }
    }
    case 'maintenance':
      return tail.length === 0
        ? { screen: 'maintenance' }
        : { screen: 'notFound' }
    case 'support':
      return tail.length === 0 ? { screen: 'support' } : { screen: 'notFound' }
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
    case 'missionCreate':
      return route.replacesMissionId
        ? `${MANAGER_ROOT}/orders/${encodeURIComponent(route.orderId)}/replacement/${encodeURIComponent(route.replacesMissionId)}`
        : `${MANAGER_ROOT}/orders/${route.orderId}/mission`
    case 'missionDispatch':
      return `${MANAGER_ROOT}/missions/${route.missionId}/dispatch`
    case 'missionSetup':
      return `${MANAGER_ROOT}/missions/${route.missionId}/setup`
    case 'missionDetail':
      return `${MANAGER_ROOT}/missions/${route.missionId}/detail`
    case 'schedule':
      return `${MANAGER_ROOT}/schedule`
    case 'missions':
      return route.missionId
        ? `${MANAGER_ROOT}/missions/${route.missionId}`
        : `${MANAGER_ROOT}/missions`
    case 'drones':
      return route.droneId
        ? `${MANAGER_ROOT}/drones/${route.droneId}`
        : `${MANAGER_ROOT}/drones`
    case 'maintenance':
      return `${MANAGER_ROOT}/maintenance`
    case 'support':
      return `${MANAGER_ROOT}/support`
    case 'notFound':
      return MANAGER_ROOT
  }
}
