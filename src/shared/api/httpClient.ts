import { env } from '../../config/env'
import { authenticatedFetch } from '../../features/auth/api/authApi'

import { getLanguage } from '../i18n'
import { matchesRealApiRoute } from './realApiRoutes'

const errorText = {
  vi: {
    unreachable: 'Không thể kết nối tới máy chủ. Vui lòng thử lại.',
    sessionExpired:
      'Phiên đăng nhập đã hết hạn hoặc token không hợp lệ. Vui lòng đăng nhập lại.',
    requestFailed: 'Yêu cầu thất bại. Vui lòng thử lại.',
  },
  en: {
    unreachable: 'Unable to reach the server. Please try again.',
    sessionExpired:
      'Your session has expired or the token is invalid. Please sign in again.',
    requestFailed: 'Request failed. Please try again.',
  },
} as const

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type ApiRequestOptions = {
  method?: HttpMethod
  body?: unknown
  query?: Record<string, string | number | boolean | undefined>
  signal?: AbortSignal
  headers?: Record<string, string>
}

// Backend envelope shape, matches `ApiResponse` in
// src/features/auth/types/index.ts.
type ApiEnvelope<T> = {
  success: boolean
  code?: string
  message?: string
  data?: T
  errors?: Record<string, string> | unknown
  timestamp?: string
}

// Thrown by `apiRequest` for every failure (network error, non-2xx status,
// or envelope success === false). `method` / `path` let error screens show
// the design's mono debug line, e.g. `GET /manager/dashboard · 500`.
export class ApiError extends Error {
  readonly status?: number
  readonly code?: string
  readonly errors?: Record<string, string>
  readonly method: string
  readonly path: string

  constructor(
    message: string,
    options: {
      status?: number
      code?: string
      errors?: Record<string, string>
      method: string
      path: string
    },
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = options.status
    this.code = options.code
    this.errors = options.errors
    this.method = options.method
    this.path = options.path
  }
}

export type HttpTransport = (
  input: string,
  init?: RequestInit,
) => Promise<Response>

let transportOverride: HttpTransport | undefined

// Lets tests (and callers who need a custom transport) swap out how
// `apiRequest` sends requests without touching env flags. `resetHttpTransport`
// restores the default `env.useMockApi` selection.
export function setHttpTransport(transport: HttpTransport) {
  transportOverride = transport
}

export function resetHttpTransport() {
  transportOverride = undefined
}

async function defaultTransport(
  input: string,
  init?: RequestInit,
): Promise<Response> {
  if (env.useMockApi) {
    const method = init?.method ?? 'GET'
    const { pathname } = new URL(input, env.apiBaseUrl)
    // The Manager dashboard is an operational surface: never serve seed KPIs
    // in interactive hybrid mode. Its aggregate endpoint must remain real.
    if (
      (method === 'GET' && pathname === '/api/manager/dashboard') ||
      matchesRealApiRoute(env.realApiRoutes, method, pathname)
    ) {
      return authenticatedFetch(input, init)
    }
    const { mockFetch } = await import('../../mocks')
    return mockFetch(input, init)
  }
  return authenticatedFetch(input, init)
}

function buildUrl(
  path: string,
  query?: Record<string, string | number | boolean | undefined>,
) {
  const url = `${env.apiBaseUrl}${path}`
  if (!query) return url
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue
    params.set(key, String(value))
  }
  const qs = params.toString()
  return qs ? `${url}?${qs}` : url
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    method = 'GET',
    body,
    query,
    signal,
    headers: customHeaders,
  } = options
  const url = buildUrl(path, query)
  const headers = new Headers()
  headers.set('Accept', 'application/json')
  const multipart = body instanceof FormData
  if (body !== undefined && !multipart)
    headers.set('Content-Type', 'application/json')
  if (customHeaders) {
    for (const [key, value] of Object.entries(customHeaders)) {
      headers.set(key, value)
    }
  }

  const transport = transportOverride ?? defaultTransport

  let response: Response
  try {
    response = await transport(url, {
      method,
      headers,
      body:
        body === undefined
          ? undefined
          : multipart
            ? body
            : JSON.stringify(body),
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }
    throw new ApiError(errorText[getLanguage()].unreachable, {
      code: 'NETWORK_ERROR',
      method,
      path,
    })
  }

  const payload = (await response.json().catch(() => undefined)) as
    ApiEnvelope<T> | undefined

  if (!response.ok || payload?.success === false) {
    const errors =
      payload?.errors && typeof payload.errors === 'object'
        ? (payload.errors as Record<string, string>)
        : undefined
    throw new ApiError(
      response.status === 401
        ? errorText[getLanguage()].sessionExpired
        : (payload?.message ?? errorText[getLanguage()].requestFailed),
      {
        status: response.status,
        code: payload?.code,
        errors,
        method,
        path,
      },
    )
  }

  if (payload && typeof payload === 'object' && 'success' in payload) {
    return payload.data as T
  }

  return payload as T
}
