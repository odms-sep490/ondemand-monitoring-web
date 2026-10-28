import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { env } from '../../../config/env'
import {
  authApi,
  authSession,
  authenticatedFetch,
  restoreAuthSession,
} from './authApi'

const token = 'header.payload.signature'
const renewed = 'header.renewed.signature'
const user = {
  id: 'customer-1',
  email: 'customer@example.com',
  fullName: 'Customer',
  role: 'CUSTOMER' as const,
}
const ok = (data: unknown) => Response.json({ success: true, data })
const unauthorized = () =>
  Response.json(
    { success: false, code: 'REFRESH_TOKEN_INVALID' },
    { status: 401 },
  )

beforeEach(() => {
  authSession.clear()
  localStorage.clear()
  sessionStorage.clear()
  vi.spyOn(env, 'useMockApi', 'get').mockReturnValue(false)
})
afterEach(() => {
  authSession.clear()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function network(
  handler?: (path: string, init: RequestInit) => Response | Promise<Response>,
) {
  const fetcher = vi.fn(async (input: string, init: RequestInit) => {
    const path = new URL(input).pathname
    if (handler) return handler(path, init)
    if (path.endsWith('/csrf')) return ok('csrf-token')
    if (path.endsWith('/refresh'))
      return ok({ accessToken: renewed, tokenType: 'Bearer' })
    if (path === '/api/users/me') return ok(user)
    return unauthorized()
  })
  vi.stubGlobal('fetch', fetcher)
  return fetcher
}

describe('session restoration', () => {
  it('stores tokens only in this tab even when remember-me is checked', () => {
    authSession.save({ accessToken: token, tokenType: 'Bearer', user }, true)
    expect(localStorage.getItem('fieldwise.accessToken')).toBeNull()
    expect(localStorage.getItem('fieldwise.user')).toBeNull()
    expect(sessionStorage.getItem('fieldwise.accessToken')).toBe(token)
    expect(JSON.parse(localStorage.getItem('fieldwise.auth.event')!)).toEqual({
      id: expect.any(String),
      type: 'login',
      at: expect.any(Number),
    })
  })

  it('restores a new tab from the cookie and loads identity from /users/me', async () => {
    const fetcher = network()
    await restoreAuthSession()
    expect(authSession.getStatus()).toBe('authenticated')
    expect(authSession.getUser()).toMatchObject(user)
    expect(authSession.getAccessToken()).toBe(renewed)
    expect(fetcher.mock.calls.map(([url]) => new URL(url).pathname)).toEqual([
      '/api/auth/csrf',
      '/api/auth/refresh',
      '/api/users/me',
    ])
    expect(fetcher.mock.calls[1][1].headers).toBeInstanceOf(Headers)
    expect(
      (fetcher.mock.calls[1][1].headers as Headers).get('X-XSRF-TOKEN'),
    ).toBe('csrf-token')
    expect(fetcher.mock.calls[1][1].credentials).toBe('include')
    expect(
      (fetcher.mock.calls[2][1].headers as Headers).get('Authorization'),
    ).toBe(`Bearer ${renewed}`)
  })

  it('validates and migrates a legacy persistent token without trusting its stored role', async () => {
    localStorage.setItem('fieldwise.accessToken', token)
    localStorage.setItem(
      'fieldwise.user',
      JSON.stringify({ ...user, role: 'ADMIN' }),
    )
    const fetcher = network()
    await restoreAuthSession()
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(authSession.getUser()?.role).toBe('CUSTOMER')
    expect(localStorage.getItem('fieldwise.accessToken')).toBeNull()
    expect(authSession.getAccessToken()).toBe(token)
  })

  it('does not recreate a cookie session after an explicit offline logout', async () => {
    authSession.clear()
    const fetcher = network()
    await restoreAuthSession()
    expect(fetcher).not.toHaveBeenCalled()
    expect(authSession.getStatus()).toBe('guest')
  })

  it('becomes guest when the refresh cookie is rejected', async () => {
    network((path) => (path.endsWith('/csrf') ? ok('csrf') : unauthorized()))
    await restoreAuthSession()
    expect(authSession.getStatus()).toBe('guest')
    expect(authSession.getUser()).toBeUndefined()
  })

  it('keeps a transient connection failure retryable without recording a logout', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')))
    await restoreAuthSession()
    expect(authSession.getStatus()).toBe('unavailable')
    expect(authSession.isLoggedOut()).toBe(false)
    network()
    await restoreAuthSession()
    expect(authSession.getStatus()).toBe('authenticated')
  })

  it('rejects a profile with an unsupported role', async () => {
    network((path) => {
      if (path.endsWith('/csrf')) return ok('csrf')
      if (path.endsWith('/refresh')) return ok({ accessToken: renewed })
      return ok({ ...user, role: 'LEGACY_ROLE' })
    })
    await restoreAuthSession()
    expect(authSession.getStatus()).toBe('guest')
    expect(authSession.getAccessToken()).toBeUndefined()
  })

  it('rejects invalid replacement identity before publishing any new login', async () => {
    authSession.save({ accessToken: token, tokenType: 'Bearer', user }, false)
    network(() => ok({ ...user, id: 'unexpected', role: 'LEGACY_ROLE' }))
    await restoreAuthSession()
    expect(authSession.getStatus()).toBe('guest')
    expect(authSession.isLoggedOut()).toBe(true)
  })
})

describe('refresh and session races', () => {
  it('preserves an active session and reports a connection error when refresh is offline', async () => {
    authSession.save({ accessToken: token, tokenType: 'Bearer', user }, false)
    network((path) => {
      if (path.endsWith('/csrf')) throw new TypeError('offline')
      return unauthorized()
    })
    await expect(
      authenticatedFetch(`${env.apiBaseUrl}/api/private`),
    ).rejects.toThrow('offline')
    expect(authSession.getStatus()).toBe('authenticated')
    expect(authSession.getUser()?.id).toBe(user.id)
    expect(authSession.isLoggedOut()).toBe(false)
  })

  it('deduplicates parallel 401 responses in a tab and retries each request once', async () => {
    authSession.save({ accessToken: token, tokenType: 'Bearer', user }, false)
    const fetcher = network((path, init) => {
      if (path.endsWith('/csrf')) return ok('csrf')
      if (path.endsWith('/refresh')) return ok({ accessToken: renewed })
      if (path === '/api/users/me') return ok(user)
      return (init.headers as Headers).get('Authorization') ===
        `Bearer ${renewed}`
        ? ok('done')
        : unauthorized()
    })
    const responses = await Promise.all([
      authenticatedFetch(`${env.apiBaseUrl}/api/private/a`),
      authenticatedFetch(`${env.apiBaseUrl}/api/private/b`),
    ])
    expect(responses.map((response) => response.status)).toEqual([200, 200])
    expect(
      fetcher.mock.calls.filter(([url]) => url.endsWith('/refresh')),
    ).toHaveLength(1)
  })

  it.each(['logout', 'account-switch'] as const)(
    'ignores a refresh response after %s',
    async (change) => {
      authSession.save({ accessToken: token, tokenType: 'Bearer', user }, false)
      let finish!: (response: Response) => void
      const waiting = new Promise<Response>((resolve) => {
        finish = resolve
      })
      const fetcher = network((path) => {
        if (path.endsWith('/csrf')) return ok('csrf')
        if (path.endsWith('/refresh')) return waiting
        if (path === '/api/users/me') return ok(user)
        return unauthorized()
      })
      const pending = authenticatedFetch(`${env.apiBaseUrl}/api/private`)
      const rejected = expect(pending).rejects.toMatchObject({
        code: 'SESSION_CHANGED',
      })
      await vi.waitFor(() =>
        expect(
          fetcher.mock.calls.some(([url]) => url.endsWith('/refresh')),
        ).toBe(true),
      )
      if (change === 'logout') authSession.clear()
      else
        authSession.save(
          {
            accessToken: token,
            tokenType: 'Bearer',
            user: { ...user, id: 'other', role: 'ADMIN' },
          },
          false,
        )
      finish(ok({ accessToken: renewed }))
      await rejected
      expect(authSession.getUser()?.id).toBe(
        change === 'logout' ? undefined : 'other',
      )
      expect(authSession.getAccessToken()).toBe(
        change === 'logout' ? undefined : token,
      )
    },
  )

  it('rejects a late login response after another tab has logged out', async () => {
    let finish!: (response: Response) => void
    const response = new Promise<Response>((resolve) => {
      finish = resolve
    })
    const fetcher = network(() => response)
    const pending = authApi.login({
      email: user.email,
      password: 'password',
      rememberMe: false,
    })
    const rejected = expect(pending).rejects.toMatchObject({
      code: 'SESSION_CHANGED',
    })
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledOnce())
    authSession.clear()
    finish(ok({ accessToken: token, tokenType: 'Bearer', user }))
    await rejected
    expect(authSession.getStatus()).toBe('guest')
  })

  it('uses a Web Lock to coordinate cookie operations across tabs when available', async () => {
    const lock = vi.fn(
      async (_name: string, callback: () => Promise<unknown>) => callback(),
    )
    vi.stubGlobal('navigator', { locks: { request: lock } })
    network()
    await restoreAuthSession()
    expect(lock).toHaveBeenCalledWith('fieldwise.auth', expect.any(Function))
  })
})

describe('tab synchronization', () => {
  it('uses credential-free channel events even when browser storage is blocked', () => {
    let deliver!: (event: MessageEvent) => void
    const send = vi.fn()
    const close = vi.fn()
    vi.stubGlobal(
      'BroadcastChannel',
      class {
        set onmessage(handler: (event: MessageEvent) => void) {
          deliver = handler
        }
        postMessage = send
        close = close
      },
    )
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked')
    })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new DOMException('blocked')
    })
    const restore = vi.fn()
    const disconnect = authSession.connect(restore)
    try {
      authSession.save({ accessToken: token, tokenType: 'Bearer', user }, false)
      expect(authSession.getAccessToken()).toBe(token)
      expect(send).toHaveBeenCalledWith({
        id: expect.any(String),
        type: 'login',
        at: expect.any(Number),
      })
      deliver(
        new MessageEvent('message', {
          data: { id: 'remote', type: 'logout', at: Date.now() + 1000 },
        }),
      )
      expect(authSession.getUser()).toBeUndefined()
      expect(authSession.getStatus()).toBe('guest')
      expect(restore).not.toHaveBeenCalled()
    } finally {
      disconnect()
    }
    expect(close).toHaveBeenCalledOnce()
  })

  it('invalidates local credentials and restores a remote login once using storage fallback', () => {
    vi.stubGlobal('BroadcastChannel', undefined)
    authSession.save({ accessToken: token, tokenType: 'Bearer', user }, false)
    const restore = vi.fn()
    const disconnect = authSession.connect(restore)
    try {
      localStorage.setItem(
        'fieldwise.auth.event',
        JSON.stringify({
          id: 'other-tab-login',
          type: 'login',
          at: Date.now() + 100,
        }),
      )
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'fieldwise.auth.event' }),
      )
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'fieldwise.auth.event' }),
      )
      expect(authSession.getAccessToken()).toBeUndefined()
      expect(authSession.getUser()).toBeUndefined()
      expect(authSession.getStatus()).toBe('loading')
      expect(restore).toHaveBeenCalledTimes(1)
    } finally {
      disconnect()
    }
  })

  it('clears local UI state on a remote logout without calling refresh', () => {
    authSession.save({ accessToken: token, tokenType: 'Bearer', user }, false)
    const restore = vi.fn()
    const disconnect = authSession.connect(restore)
    try {
      localStorage.setItem(
        'fieldwise.auth.event',
        JSON.stringify({
          id: 'other-tab-logout',
          type: 'logout',
          at: Date.now() + 100,
        }),
      )
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'fieldwise.auth.event' }),
      )
      expect(authSession.getStatus()).toBe('guest')
      expect(authSession.getUser()).toBeUndefined()
      expect(restore).not.toHaveBeenCalled()
    } finally {
      disconnect()
    }
  })
})
