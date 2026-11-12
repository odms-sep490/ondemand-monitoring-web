// Hybrid transport helper: decides whether a request should bypass the mock
// API and hit the real backend, based on VITE_REAL_API_ROUTES patterns.
//
// Pattern syntax: "METHOD /path" where `*` matches exactly one path segment
// and a trailing `*` (e.g. `/api/admin/users*`) matches any suffix, so it
// covers both the collection path and its query/prefix.

export type RealApiRoute = { method: string; pattern: string }

export const notificationApiRoutes: RealApiRoute[] = [
  { method: 'GET', pattern: '/api/notifications' },
]

export function parseRealApiRoutes(raw: string | undefined): RealApiRoute[] {
  if (!raw) return []
  const routes: RealApiRoute[] = []
  for (const entry of raw.split(',')) {
    const [method, pattern] = entry.trim().split(/\s+/)
    if (!method || !pattern || !pattern.startsWith('/')) continue
    routes.push({ method: method.toUpperCase(), pattern })
  }
  return routes
}

function patternToRegex(pattern: string): RegExp {
  const trailingWildcard = pattern.endsWith('*')
  const body = trailingWildcard ? pattern.slice(0, -1) : pattern
  const source = body
    .split('/')
    .map((segment) =>
      segment === '*'
        ? '[^/]+'
        : segment.replace(/[.+?^${}()|[\]\\*]/g, '\\$&'),
    )
    .join('/')
  return new RegExp(`^${source}${trailingWildcard ? '.*' : ''}$`)
}

export function matchesRealApiRoute(
  routes: readonly RealApiRoute[],
  method: string,
  pathname: string,
): boolean {
  const upper = method.toUpperCase()
  return routes.some(
    (route) =>
      route.method === upper && patternToRegex(route.pattern).test(pathname),
  )
}
