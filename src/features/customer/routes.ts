export const CUSTOMER_ROOT = '#portal/customer'

export type CustomerRoute =
  | { screen: 'missionHistory' }
  | { screen: 'missionHistoryDetail'; missionId: string }
  | { screen: 'dashboard' }
  | { screen: 'orders' }
  | { screen: 'createOrder' }
  | { screen: 'orderDetail'; orderId: string }
  | { screen: 'missionReport'; orderId: string; missionId: string }
  | { screen: 'live'; orderId: string }
  | { screen: 'liveHub' }
  | { screen: 'mediaLibrary' }
  | { screen: 'mediaDetail'; mediaId: string }
  | { screen: 'media'; orderId: string }
  | { screen: 'notifications' }
  | { screen: 'notFound' }

export type CustomerScreen = CustomerRoute['screen']

export function parseCustomerRoute(hash: string): CustomerRoute {
  if (hash !== CUSTOMER_ROOT && !hash.startsWith(`${CUSTOMER_ROOT}/`)) {
    return { screen: 'notFound' }
  }

  const rest = hash.slice(CUSTOMER_ROOT.length)
  const segments = rest.split('/').filter(Boolean).map(decodeURIComponent)

  if (segments.length === 0) return { screen: 'dashboard' }

  const [head, ...tail] = segments

  switch (head) {
    case 'mission-history':
      if (tail.length === 0) return { screen: 'missionHistory' }
      if (tail.length === 1)
        return { screen: 'missionHistoryDetail', missionId: tail[0] }
      return { screen: 'notFound' }
    case 'orders': {
      if (tail.length === 0) return { screen: 'orders' }
      if (tail[0] === 'new') return { screen: 'createOrder' }
      if (tail.length === 1) return { screen: 'orderDetail', orderId: tail[0] }
      if (tail.length === 4 && tail[1] === 'missions' && tail[3] === 'report')
        return { screen: 'missionReport', orderId: tail[0], missionId: tail[2] }
      if (tail.length === 2 && tail[1] === 'live')
        return { screen: 'live', orderId: tail[0] }
      if (tail.length === 2 && tail[1] === 'media')
        return { screen: 'media', orderId: tail[0] }
      return { screen: 'notFound' }
    }
    case 'live':
      return { screen: 'liveHub' }
    case 'media': {
      if (tail.length === 0) return { screen: 'mediaLibrary' }
      if (tail.length === 1) return { screen: 'mediaDetail', mediaId: tail[0] }
      return { screen: 'notFound' }
    }
    case 'notifications':
      return { screen: 'notifications' }
    default:
      return { screen: 'notFound' }
  }
}

export function customerHref(route: CustomerRoute): string {
  switch (route.screen) {
    case 'missionHistory':
      return `${CUSTOMER_ROOT}/mission-history`
    case 'missionHistoryDetail':
      return `${CUSTOMER_ROOT}/mission-history/${encodeURIComponent(route.missionId)}`
    case 'dashboard':
      return CUSTOMER_ROOT
    case 'orders':
      return `${CUSTOMER_ROOT}/orders`
    case 'createOrder':
      return `${CUSTOMER_ROOT}/orders/new`
    case 'orderDetail':
      return `${CUSTOMER_ROOT}/orders/${route.orderId}`
    case 'missionReport':
      return `${CUSTOMER_ROOT}/orders/${encodeURIComponent(route.orderId)}/missions/${encodeURIComponent(route.missionId)}/report`
    case 'live':
      return `${CUSTOMER_ROOT}/orders/${route.orderId}/live`
    case 'liveHub':
      return `${CUSTOMER_ROOT}/live`
    case 'mediaLibrary':
      return `${CUSTOMER_ROOT}/media`
    case 'mediaDetail':
      return `${CUSTOMER_ROOT}/media/${route.mediaId}`
    case 'media':
      return `${CUSTOMER_ROOT}/orders/${route.orderId}/media`
    case 'notifications':
      return `${CUSTOMER_ROOT}/notifications`
    case 'notFound':
      return CUSTOMER_ROOT
  }
}
