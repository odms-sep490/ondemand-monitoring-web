import { describe, expect, it } from 'vitest'
import { env } from '../../config/env'

import { matchesRealApiRoute, parseRealApiRoutes } from './realApiRoutes'

const routes = parseRealApiRoutes(
  'GET /api/admin/users*, PATCH /api/admin/users/*/status,POST /api/admin/accounts',
)

describe('parseRealApiRoutes', () => {
  it('returns empty for undefined/empty and skips malformed entries', () => {
    expect(parseRealApiRoutes(undefined)).toEqual([])
    expect(parseRealApiRoutes('')).toEqual([])
    expect(parseRealApiRoutes('bogus,GET nopath, ,get /a')).toEqual([
      { method: 'GET', pattern: '/a' },
    ])
  })
})

describe('matchesRealApiRoute', () => {
  it('matches trailing wildcard for collection and detail', () => {
    expect(matchesRealApiRoute(routes, 'GET', '/api/admin/users')).toBe(true)
    expect(matchesRealApiRoute(routes, 'GET', '/api/admin/users/u1')).toBe(true)
  })
  it('matches single-segment wildcard only', () => {
    expect(
      matchesRealApiRoute(routes, 'PATCH', '/api/admin/users/u1/status'),
    ).toBe(true)
    expect(
      matchesRealApiRoute(routes, 'PATCH', '/api/admin/users/status'),
    ).toBe(false)
    expect(
      matchesRealApiRoute(routes, 'PATCH', '/api/admin/users/a/b/status'),
    ).toBe(false)
  })
  it('requires method and exact path when no wildcard', () => {
    expect(matchesRealApiRoute(routes, 'POST', '/api/admin/accounts')).toBe(
      true,
    )
    expect(matchesRealApiRoute(routes, 'post', '/api/admin/accounts')).toBe(
      true,
    )
    expect(matchesRealApiRoute(routes, 'GET', '/api/admin/accounts')).toBe(
      false,
    )
    expect(matchesRealApiRoute(routes, 'POST', '/api/admin/accounts/x')).toBe(
      false,
    )
    expect(matchesRealApiRoute(routes, 'DELETE', '/api/admin/users/u1')).toBe(
      false,
    )
  })
  it('trailing wildcard is a prefix match; other paths do not match', () => {
    expect(matchesRealApiRoute(routes, 'GET', '/api/admin/usersX')).toBe(true)
    expect(matchesRealApiRoute(routes, 'GET', '/api/admin/roles')).toBe(false)
  })

  it('always sends staff license reads and writes to the real backend', () => {
    const requests = [
      ['GET', '/api/staff-licenses/users/staff-1'],
      ['GET', '/api/staff-licenses/license-1'],
      ['GET', '/api/staff-licenses/license-1/document'],
      ['POST', '/api/staff-licenses'],
      ['PUT', '/api/staff-licenses/license-1'],
      ['POST', '/api/staff-licenses/license-1/verification'],
      ['POST', '/api/staff-licenses/license-1/revoke'],
      ['POST', '/api/staff-licenses/license-1/document'],
    ] as const

    for (const [method, path] of requests) {
      expect(matchesRealApiRoute(env.realApiRoutes, method, path)).toBe(true)
    }
  })

  it('always sends notification feeds to the real backend', () => {
    expect(
      matchesRealApiRoute(env.realApiRoutes, 'GET', '/api/notifications'),
    ).toBe(true)
  })
})
