export type OfficeAreaId =
  | 'planning'
  | 'dispatch'
  | 'technical'
  | 'inspection'
  | 'shared'

/** Resolve an office area only from the manager identity or verified mission roles. */
export function resolveOfficeArea(isManager: boolean, roles: readonly string[]): OfficeAreaId {
  if (isManager) return 'planning'
  if (roles.includes('PILOT') || roles.includes('OPERATOR')) return 'dispatch'
  if (roles.includes('MAINTAINER')) return 'technical'
  if (roles.includes('INSPECTOR')) return 'inspection'
  return 'shared'
}
