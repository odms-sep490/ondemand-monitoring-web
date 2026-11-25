// Admin (role ADMIN) client-side routing. All admin screens live under
// the `#portal/admin` hash prefix.

import type { AiOpsTab } from './api/aiOpsApi'

export const ADMIN_ROOT = '#portal/admin'

const AI_OPS_TABS = new Set<AiOpsTab>([
  'overview',
  'models',
  'services',
  'tracing',
  'evaluation',
  'supervisor',
  'promptLab',
  'security',
  'audit',
  'incidents',
])

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
  | { screen: 'orderCriteria' }
  | { screen: 'deviceCheckCriteria' }
  | { screen: 'auditLog' }
  | { screen: 'refunds' }
  | { screen: 'aiOps'; tab?: AiOpsTab }
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
    case 'order-criteria':
      return { screen: 'orderCriteria' }
    case 'device-check-criteria':
      return tail.length === 0
        ? { screen: 'deviceCheckCriteria' }
        : { screen: 'notFound' }
    case 'audit-log':
      return { screen: 'auditLog' }
    case 'refunds':
      return { screen: 'refunds' }
    case 'ai-ops': {
      const candidate = tail[0] as AiOpsTab | undefined
      return {
        screen: 'aiOps',
        tab: candidate && AI_OPS_TABS.has(candidate) ? candidate : 'overview',
      }
    }
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
    case 'orderCriteria':
      return `${ADMIN_ROOT}/order-criteria`
    case 'deviceCheckCriteria':
      return `${ADMIN_ROOT}/device-check-criteria`
    case 'auditLog':
      return `${ADMIN_ROOT}/audit-log`
    case 'refunds':
      return `${ADMIN_ROOT}/refunds`
    case 'aiOps':
      return route.tab && route.tab !== 'overview'
        ? `${ADMIN_ROOT}/ai-ops/${route.tab}`
        : `${ADMIN_ROOT}/ai-ops`
    case 'notFound':
      return ADMIN_ROOT
  }
}
