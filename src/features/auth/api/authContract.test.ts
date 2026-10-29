import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { env } from '../../../config/env'
import { authApi, authenticatedFetch, authSession } from './authApi'
import { getRoleHomePath } from '../routing'
import { EMPLOYEE_ROLES, SYSTEM_ROLES } from '../roles'

const token = 'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ1c2VyIn0.signature'
const user = {
  id: 'u1',
  email: 'staff@example.com',
  fullName: 'Staff',
  role: 'STAFF' as const,
}

beforeEach(() => {
  authSession.clear()
  vi.spyOn(env, 'useMockApi', 'get').mockReturnValue(false)
})
afterEach(() => {
  authSession.clear()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('backend authentication contract', () => {
  it('has exactly four roles and only two employee roles', () => {
    expect(SYSTEM_ROLES).toEqual(['ADMIN', 'MANAGER', 'STAFF', 'CUSTOMER'])
    expect(EMPLOYEE_ROLES).toEqual(['MANAGER', 'STAFF'])
    expect(getRoleHomePath('MANAGER')).toBe('#portal/manager')
    expect(getRoleHomePath('STAFF')).toBe('#portal/staff')
  })

  it('accepts the minimal backend profile without inventing inactive status', () => {
    authSession.save({ accessToken: token, tokenType: 'Bearer', user }, false)
    expect(authSession.getUser()?.isActive).toBeUndefined()
    expect(authSession.getUser()?.role).toBe('STAFF')
  })

  it('rejects persisted legacy roles instead of routing them into a new role', () => {
    localStorage.setItem(
      'fieldwise.user',
      JSON.stringify({ ...user, role: 'DRONE_OPERATOR' }),
    )
    localStorage.setItem('fieldwise.accessToken', token)
    expect(authSession.getUser()).toBeUndefined()
    expect(authSession.getAccessToken()).toBeUndefined()
  })

  it('replaces a remembered account when a different session is saved', () => {
    authSession.save({ accessToken: token, tokenType: 'Bearer', user }, true)
    authSession.save(
      {
        accessToken: token,
        tokenType: 'Bearer',
        user: { ...user, role: 'MANAGER' },
      },
      false,
    )
    expect(localStorage.getItem('fieldwise.user')).toBeNull()
    expect(authSession.getUser()?.role).toBe('MANAGER')
  })

  it('refresh updates the returned profile together with the token', () => {
    authSession.save({ accessToken: token, tokenType: 'Bearer', user }, false)
    authSession.updateAccessToken({
      accessToken: token,
      tokenType: 'Bearer',
      user: { ...user, role: 'MANAGER' },
    })
    expect(authSession.getUser()?.role).toBe('MANAGER')
  })

  it('links local identity with bearer without requesting CSRF', async () => {
    authSession.save({ accessToken: token, tokenType: 'Bearer', user }, false)
    const network = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ success: true, data: null }))
    vi.stubGlobal('fetch', network)
    await authApi.linkLocal('NewPassword123!')
    expect(network).toHaveBeenCalledTimes(1)
    const [url, init] = network.mock.calls[0]
    expect(url).toBe(env.apiBaseUrl + '/api/auth/social/link-local')
    expect(init.credentials).toBe('include')
    expect(init.headers.has('X-XSRF-TOKEN')).toBe(false)
    expect(init.headers.get('Authorization')).toBe('Bearer ' + token)
    expect(JSON.parse(init.body)).toEqual({ password: 'NewPassword123!' })
  })

  it('does not submit a protected mutation if CSRF initialization fails', async () => {
    const network = vi
      .fn()
      .mockResolvedValue(Response.json({ success: false }, { status: 403 }))
    vi.stubGlobal('fetch', network)
    await expect(
      authenticatedFetch(env.apiBaseUrl + '/api/auth/refresh', {
        method: 'POST',
      }),
    ).rejects.toMatchObject({ code: 'CSRF_TOKEN_UNAVAILABLE' })
    expect(network).toHaveBeenCalledTimes(1)
  })

  it.each([
    '/api/auth/refresh',
    '/api/auth/logout',
    '/api/v1/auth/refresh',
    '/api/v1/auth/logout',
  ])('sends CSRF and cookies for %s', async (path) => {
    const network = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ success: true, data: 'masked-csrf' }),
      )
      .mockResolvedValueOnce(Response.json({ success: true, data: null }))
    vi.stubGlobal('fetch', network)
    await authenticatedFetch(env.apiBaseUrl + path, { method: 'POST' })
    expect(network.mock.calls[0][0]).toBe(env.apiBaseUrl + '/api/auth/csrf')
    expect(network.mock.calls[1][1].headers.get('X-XSRF-TOKEN')).toBe(
      'masked-csrf',
    )
    expect(network.mock.calls[1][1].credentials).toBe('include')
  })

  it.each(['/api/support-tickets', '/api/v1/admin/accounts'])(
    'sends bearer without CSRF for %s',
    async (path) => {
      authSession.save({ accessToken: token, tokenType: 'Bearer', user }, false)
      const network = vi
        .fn()
        .mockResolvedValue(Response.json({ success: true, data: null }))
      vi.stubGlobal('fetch', network)
      await authenticatedFetch(env.apiBaseUrl + path, { method: 'POST' })
      expect(network).toHaveBeenCalledTimes(1)
      expect(network.mock.calls[0][1].headers.has('X-XSRF-TOKEN')).toBe(false)
      expect(network.mock.calls[0][1].headers.get('Authorization')).toBe(
        'Bearer ' + token,
      )
    },
  )
})
