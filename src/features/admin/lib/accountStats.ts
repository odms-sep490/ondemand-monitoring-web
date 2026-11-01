import {
  BE_USER_ROLES,
  adminUsersApi,
  type ManagedUserRole,
} from '../api/adminUsersApi'

export type AccountStats = {
  total: number
  active: number
  locked: number
  /** Accounts whose e-mail is not verified yet. */
  unverified: number
  byRole: Record<ManagedUserRole, number>
}

/** Counts accounts via `GET /api/admin/users?size=1` (totalItems), in parallel. */
export async function fetchAccountStats(
  signal?: AbortSignal,
): Promise<AccountStats> {
  const count = (q: Parameters<typeof adminUsersApi.listUsers>[0]) =>
    adminUsersApi.listUsers({ size: 1, signal, ...q }).then((r) => r.totalItems)
  const [total, active, locked, unverified, ...roleCounts] = await Promise.all([
    count({}),
    count({ active: true }),
    count({ active: false }),
    count({ emailVerified: false }),
    ...BE_USER_ROLES.map((role) => count({ role })),
  ])
  const byRole = {} as Record<ManagedUserRole, number>
  BE_USER_ROLES.forEach((role, i) => {
    byRole[role] = roleCounts[i]
  })
  return { total, active, locked, unverified, byRole }
}
