import { matchesRealApiRoute } from '../../../shared/api/realApiRoutes'
import { AuthApiError, sessionChangedError } from './authErrors'
import { authSession, withAuthLock } from './authSession'
import type { SessionStamp } from './authSession'
export { AuthApiError } from './authErrors'
export { authSession } from './authSession'
import { env } from '../../../config/env'
import type {
  ApiResponse,
  AuthResponse,
  CreateManagedAccountRequest,
  FirstLoginPasswordChangeRequest,
  ForgotPasswordRequest,
  LoginRequest,
  ManagedAccountResponse,
  RegisterRequest,
  RegisterResponse,
  ResendOtpRequest,
  ResetPasswordRequest,
  SocialSyncRequest,
  VerifyOtpRequest,
} from '../types'

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
  accessToken?: string
  skipRefresh?: boolean
}

export function getGoogleAuthorizationUrl() {
  if (!env.cognitoDomain || !env.cognitoClientId) {
    throw new AuthApiError(
      'Google sign-in is not configured. Add the Cognito domain and app client ID to the frontend environment.',
      'GOOGLE_AUTH_NOT_CONFIGURED',
    )
  }

  const redirectUri =
    env.cognitoRedirectSignIn ?? `${window.location.origin}/social/callback`
  const domain = /^https?:\/\//i.test(env.cognitoDomain)
    ? env.cognitoDomain
    : `https://${env.cognitoDomain}`
  const params = new URLSearchParams({
    client_id: env.cognitoClientId,
    response_type: 'code',
    scope: 'openid email profile',
    redirect_uri: redirectUri,
    identity_provider: 'Google',
    state: `GOOGLE:${crypto.randomUUID()}`,
  })

  return `${domain.replace(/\/$/, '')}/oauth2/authorize?${params.toString()}`
}

let refreshJob:
  | { stamp: SessionStamp; promise: Promise<AuthResponse | undefined> }
  | undefined
let bootstrapJob: { stamp: SessionStamp; promise: Promise<void> } | undefined

function terminalSessionError(error: unknown) {
  return (
    error instanceof AuthApiError &&
    (error.status === 401 ||
      error.code === 'ACCOUNT_DISABLED' ||
      error.code === 'INVALID_AUTH_RESPONSE')
  )
}

async function validatedProfile(accessToken: string) {
  return request<NonNullable<AuthResponse['user']>>('/api/users/me', {
    accessToken,
    skipRefresh: true,
    signal: AbortSignal.timeout(15_000),
  })
}

async function refreshAccessTokenOnce() {
  if (!refreshJob || !authSession.isCurrent(refreshJob.stamp)) {
    const stamp = authSession.capture()
    const promise = withAuthLock(async () => {
      if (!authSession.isCurrent(stamp) || authSession.isLoggedOut())
        return undefined
      const response = await request<AuthResponse>('/api/auth/refresh', {
        method: 'POST',
        skipRefresh: true,
        signal: AbortSignal.timeout(15_000),
      })
      if (!authSession.isCurrent(stamp)) throw sessionChangedError()
      if (!response?.accessToken)
        throw new AuthApiError('Missing access token.', 'INVALID_AUTH_RESPONSE')
      const user = await validatedProfile(response.accessToken)
      authSession.restore({ ...response, user }, stamp)
      return { ...response, user }
    })
      .catch((error: unknown) => {
        if (authSession.isCurrent(stamp)) {
          if (terminalSessionError(error)) authSession.clear()
          else {
            if (
              !authSession.getAccessToken() ||
              authSession.getStatus() === 'loading'
            ) {
              authSession.setStatus('unavailable')
            }
            // A temporary refresh failure must not be reported as an expired
            // session by returning the protected request's original 401.
            throw error
          }
        }
        return undefined
      })
      .finally(() => {
        if (refreshJob?.promise === promise) refreshJob = undefined
      })
    refreshJob = { stamp, promise }
  }
  return refreshJob.promise
}

export function restoreAuthSession(): Promise<void> {
  if (bootstrapJob && authSession.isCurrent(bootstrapJob.stamp))
    return bootstrapJob.promise
  const stamp = authSession.capture()
  authSession.setStatus('loading')
  const promise = (async () => {
    if (authSession.isLoggedOut() && !authSession.getAccessToken()) {
      authSession.setStatus('guest')
      return
    }
    const token = authSession.getAccessToken()
    if (token) {
      try {
        const user = await validatedProfile(token)
        authSession.restore(
          { accessToken: token, tokenType: 'Bearer', user },
          stamp,
        )
        return
      } catch (error) {
        if (!authSession.isCurrent(stamp)) return
        if (!(error instanceof AuthApiError && error.status === 401)) {
          if (terminalSessionError(error)) authSession.clear()
          else authSession.setStatus('unavailable')
          return
        }
      }
    }
    try {
      await refreshAccessTokenOnce()
    } catch {
      // The refresh job already exposed the retryable bootstrap status.
    }
  })().finally(() => {
    if (bootstrapJob?.promise === promise) bootstrapJob = undefined
  })
  bootstrapJob = { stamp, promise }
  return promise
}

export function startAuthSession() {
  const restore = () => {
    void restoreAuthSession()
  }
  const retryUnavailable = () => {
    if (authSession.getStatus() === 'unavailable') restore()
  }
  const disconnect = authSession.connect(restore)
  window.addEventListener('online', retryUnavailable)
  if (window.location.pathname !== '/social/callback') restore()
  return () => {
    disconnect()
    window.removeEventListener('online', retryUnavailable)
  }
}

async function authenticate(path: string, body: unknown) {
  const stamp = authSession.capture()
  return withAuthLock(async () => {
    if (!authSession.isCurrent(stamp)) throw sessionChangedError()
    const response = await request<AuthResponse>(path, {
      method: 'POST',
      body,
      skipRefresh: true,
      signal: AbortSignal.timeout(30_000),
    })
    if (!authSession.isCurrent(stamp)) throw sessionChangedError()
    if (!response)
      throw new AuthApiError(
        'Missing authentication response.',
        'INVALID_AUTH_RESPONSE',
      )
    // Commit while holding the cookie lock: another tab cannot issue a login
    // between Set-Cookie and the publication of this account's session event.
    if (!(response.status === 'PASSWORD_CHANGE_REQUIRED' && response.session)) {
      authSession.save(
        response,
        (body as { rememberMe?: boolean }).rememberMe === true,
      )
    }
    return response
  })
}

// Same transport choice as `src/shared/api/httpClient.ts`: mockFetch when
// `env.useMockApi` is on, otherwise the real network. Dynamic import keeps
// `src/mocks` out of the module graph unless mocking is actually used.
async function transportFetch(
  url: string,
  init: RequestInit,
): Promise<Response> {
  if (usesMockTransport(url, init.method)) {
    const { mockFetch } = await import('../../../mocks')
    return mockFetch(url, init)
  }
  return fetch(url, init)
}

function usesMockTransport(url: string, method = 'GET') {
  return (
    env.useMockApi &&
    !matchesRealApiRoute(
      env.realApiRoutes,
      method,
      new URL(url, env.apiBaseUrl).pathname,
    )
  )
}

const cookieAuthenticationPaths = new Set([
  '/api/auth/refresh',
  '/api/auth/logout',
  '/api/v1/auth/refresh',
  '/api/v1/auth/logout',
])

async function csrfHeaders(url: string, method = 'GET'): Promise<Headers> {
  const headers = new Headers()
  const path = new URL(url, env.apiBaseUrl).pathname
  if (
    usesMockTransport(url, method) ||
    ['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase()) ||
    !cookieAuthenticationPaths.has(path)
  )
    return headers
  // Read the response token (Spring's CSRF handler may mask the cookie token).
  const response = await fetch(`${env.apiBaseUrl}/api/auth/csrf`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  })
  const payload = (await response.json().catch(() => undefined)) as
    ApiResponse<string> | undefined
  if (
    !response.ok ||
    payload?.success === false ||
    typeof payload?.data !== 'string'
  ) {
    throw new AuthApiError(
      payload?.message ?? 'Unable to initialize CSRF protection.',
      'CSRF_TOKEN_UNAVAILABLE',
    )
  }
  headers.set('X-XSRF-TOKEN', payload.data)
  return headers
}

export async function authenticatedFetch(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const stamp = authSession.capture()
  const protection = await csrfHeaders(url, init.method)
  if (!authSession.isCurrent(stamp)) throw sessionChangedError()
  const request = (token?: string) => {
    const headers = new Headers(init.headers)
    protection.forEach((value, key) => headers.set(key, value))
    if (token) headers.set('Authorization', `Bearer ${token}`)
    return transportFetch(url, { ...init, credentials: 'include', headers })
  }

  const response = await request(authSession.getAccessToken() ?? undefined)
  if (!authSession.isCurrent(stamp)) throw sessionChangedError()
  if (response.status !== 401) return response
  if (
    cookieAuthenticationPaths.has(new URL(url, env.apiBaseUrl).pathname) ||
    authSession.isLoggedOut()
  )
    return response

  const refreshed = await refreshAccessTokenOnce()
  if (!authSession.isCurrent(stamp)) throw sessionChangedError()
  if (!refreshed?.accessToken) return response
  const retried = await request(refreshed.accessToken)
  if (!authSession.isCurrent(stamp)) throw sessionChangedError()
  return retried
}

async function request<T>(path: string, options: RequestOptions = {}) {
  const stamp = authSession.capture()
  const { accessToken, skipRefresh, body, ...requestInit } = options
  const headers = new Headers(options.headers)
  const protection = await csrfHeaders(
    `${env.apiBaseUrl}${path}`,
    options.method,
  )
  protection.forEach((value, key) => headers.set(key, value))
  headers.set('Accept', 'application/json')
  if (body !== undefined) headers.set('Content-Type', 'application/json')
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)

  let response: Response
  try {
    response = await transportFetch(`${env.apiBaseUrl}${path}`, {
      ...requestInit,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'include',
      headers,
    })
  } catch {
    throw new AuthApiError(
      'Unable to reach the authentication service. Please try again.',
    )
  }

  if (accessToken && !authSession.isCurrent(stamp)) throw sessionChangedError()

  if (
    response.status === 401 &&
    accessToken &&
    !skipRefresh &&
    path !== '/api/auth/refresh'
  ) {
    const refreshed = await refreshAccessTokenOnce()
    if (!authSession.isCurrent(stamp)) throw sessionChangedError()
    if (refreshed?.accessToken) {
      return request<T>(path, {
        ...options,
        accessToken: refreshed.accessToken,
        skipRefresh: true,
      })
    }
  }

  const payload = (await response.json().catch(() => undefined)) as
    ApiResponse<T> | undefined
  if (!response.ok || payload?.success === false) {
    const errors =
      payload?.errors && typeof payload.errors === 'object'
        ? (payload.errors as Record<string, string>)
        : undefined
    throw new AuthApiError(
      payload?.message ?? 'Something went wrong. Please try again.',
      payload?.code,
      errors,
      response.status,
    )
  }
  return payload?.data as T
}

export const authApi = {
  register: (body: RegisterRequest) =>
    request<RegisterResponse>('/api/auth/register', {
      method: 'POST',
      body,
    }),
  verifyOtp: (body: VerifyOtpRequest) =>
    request<void>('/api/auth/verify-otp', { method: 'POST', body }),
  resendOtp: (body: ResendOtpRequest) =>
    request<void>('/api/auth/resend-otp', { method: 'POST', body }),
  login: (body: LoginRequest) => authenticate('/api/auth/login', body),
  completeFirstLogin: (body: FirstLoginPasswordChangeRequest) =>
    authenticate('/api/auth/first-login/change-password', body),
  socialSync: (body: SocialSyncRequest) =>
    authenticate('/api/auth/social/sync', body),
  linkLocal: (password: string) =>
    request<void>('/api/auth/social/link-local', {
      method: 'POST',
      body: { password },
      accessToken: authSession.getAccessToken(),
    }),
  refresh: () =>
    request<AuthResponse>('/api/auth/refresh', {
      method: 'POST',
      skipRefresh: true,
    }),
  logout: (accessToken?: string) =>
    request<void>('/api/auth/logout', {
      method: 'POST',
      accessToken,
      skipRefresh: true,
      signal: AbortSignal.timeout(15_000),
    }),
  createManagedAccount: (
    body: CreateManagedAccountRequest,
    accessToken: string,
  ) =>
    request<ManagedAccountResponse>('/api/admin/accounts', {
      method: 'POST',
      body,
      accessToken,
    }),
  forgotPassword: (body: ForgotPasswordRequest) =>
    request<void>('/api/auth/forgot-password', { method: 'POST', body }),
  resetPassword: (body: ResetPasswordRequest) =>
    request<void>('/api/auth/reset-password', { method: 'POST', body }),
  /** `GET /api/auth/csrf` [BE]. */
  getCsrf: (signal?: AbortSignal) =>
    request<string>('/api/auth/csrf', { signal }),
}
