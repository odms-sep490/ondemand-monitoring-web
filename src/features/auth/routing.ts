import type { UserRole } from './types'

export const roleHomePaths: Record<UserRole, string> = {
  CUSTOMER: '#portal/customer',
  MANAGER: '#portal/manager',
  STAFF: '#portal/staff',
  ADMIN: '#portal/admin',
}

export function getRoleHomePath(role?: UserRole) {
  return role ? (roleHomePaths[role] ?? '#auth/login') : '#auth/login'
}

export function getRoleHomeUrl(
  role?: UserRole,
  origin = window.location.origin,
) {
  return `${origin.replace(/\/$/, '')}/${getRoleHomePath(role)}`
}

export function redirectToRoleHome(role?: UserRole) {
  const saved = window.sessionStorage.getItem('auth:return-to')
  window.sessionStorage.removeItem('auth:return-to')
  const home = getRoleHomePath(role)
  if (!saved && window.location.hash.startsWith(`${home}/`)) return
  window.location.hash = saved?.startsWith(`${home}/`) ? saved : home
}

export function rememberProtectedRoute(hash: string) {
  if (hash.startsWith('#portal/')) {
    window.sessionStorage.setItem('auth:return-to', hash)
  }
}
