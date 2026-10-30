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
  window.location.hash = getRoleHomePath(role)
}
