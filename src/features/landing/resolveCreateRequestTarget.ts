import { getRoleHomePath } from '../auth/routing'
import type { UserProfile } from '../auth/types'

/**
 * Where the landing page's "Tạo yêu cầu" / "Tạo yêu cầu giám sát" call to
 * action should navigate to:
 * - no session -> login
 * - logged in as CUSTOMER -> the create-request screen directly
 * - logged in as any other role -> that role's home (creating monitoring
 *   requests is a customer action, not theirs)
 */
export function resolveCreateRequestTarget(user?: UserProfile): string {
  if (!user) return '#auth/login'
  if (user.role === 'CUSTOMER') return '#portal/customer/request'
  return getRoleHomePath(user.role)
}
