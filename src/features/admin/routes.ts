// Admin (role ADMIN) client-side routing. All admin screens live under
// the `#portal/admin` hash prefix.

export const ADMIN_ROOT = '#portal/admin'

export type AdminRoute =
  | { screen: 'dashboard' }
  | { screen: 'accounts' }
  | { screen: 'createAccount' }
  | { screen: 'accountDetail'; accountId: string }
  | { screen: 'roles' }
  | { screen: 'catalog' }
  | { screen: 'checklists' }
  | { screen: 'serviceChecklists'; serviceId?: string }
  | { screen: 'operatingConfig' }
  | { screen: 'auditLog' }
  | { screen: 'notFound' }

export type AdminScreen = AdminRoute['screen']

export function parseAdminRoute(hash: string): AdminRoute {
  if (hash !== ADMIN_ROOT && !hash.startsWith(`${ADMIN_ROOT}/`)) {
    return { screen: 'notFound' }
  }

  const rest = hash.slice(ADMIN_ROOT.length)
  const segments = rest.split('/').filter(Boolean).map(decodeURIComponent)

  if (segments.length === 0) return { screen: 'accounts' }

  const [head, ...tail] = segments

  switch (head) {
    case 'accounts': {
      if (tail.length === 0) return { screen: 'accounts' }
      if (tail[0] === 'new') return { screen: 'createAccount' }
      if (tail.length === 1)
        return { screen: 'accountDetail', accountId: tail[0] }
      return { screen: 'notFound' }
    }
    case 'roles':
      return { screen: 'roles' }
    case 'catalog':
      return { screen: 'catalog' }
    case 'checklists':
      return tail.length === 0
        ? { screen: 'checklists' }
        : { screen: 'notFound' }
    case 'services':
      if (tail.length === 0) return { screen: 'serviceChecklists' }
      if (tail.length === 2 && tail[1] === 'checklists')
        return { screen: 'serviceChecklists', serviceId: tail[0] }
      return { screen: 'notFound' }
    case 'operating-config':
      return { screen: 'operatingConfig' }
    case 'audit-log':
      return { screen: 'auditLog' }
    default:
      return { screen: 'notFound' }
  }
}

export function adminHref(route: AdminRoute): string {
  switch (route.screen) {
    case 'dashboard':
      return ADMIN_ROOT
    case 'accounts':
      return `${ADMIN_ROOT}/accounts`
    case 'createAccount':
      return `${ADMIN_ROOT}/accounts/new`
    case 'accountDetail':
      return `${ADMIN_ROOT}/accounts/${route.accountId}`
    case 'roles':
      return `${ADMIN_ROOT}/roles`
    case 'catalog':
      return `${ADMIN_ROOT}/catalog`
    case 'checklists':
      return `${ADMIN_ROOT}/checklists`
    case 'serviceChecklists':
      return route.serviceId
        ? `${ADMIN_ROOT}/services/${encodeURIComponent(route.serviceId)}/checklists`
        : `${ADMIN_ROOT}/services`
    case 'operatingConfig':
      return `${ADMIN_ROOT}/operating-config`
    case 'auditLog':
      return `${ADMIN_ROOT}/audit-log`
    case 'notFound':
      return ADMIN_ROOT
  }
}
