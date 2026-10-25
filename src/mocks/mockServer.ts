import { env } from '../config/env'
import { matchesRealApiRoute } from '../shared/api/realApiRoutes'

export type MockEnvelope<T = unknown> = {
  success: boolean
  code?: string
  message?: string
  data?: T
  errors?: Record<string, string>
  timestamp: string
}

export type MockResult<T = unknown> =
  | {
    status: number
    envelope: MockEnvelope<T>
    passThrough?: false
  }
  | {
    passThrough: true
  }

export type MockContext = {
  params: Record<string, string>
  query: URLSearchParams
  body: unknown
  headers: Headers
}

export type MockMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type MockRoute = {
  method: MockMethod
  path: string
  handler: (ctx: MockContext) => MockResult | Promise<MockResult>
}

/** `data: {…}` → `{ success: true, code: 'OK', data, … }`, HTTP 200. */
export function ok<T>(data: T, message = 'OK'): MockResult<T> {
  return {
    status: 200,
    envelope: {
      success: true,
      code: 'OK',
      message,
      data,
      timestamp: new Date().toISOString(),
    },
  }
}

/** Same as `ok`, but HTTP 201 for resource creation. */
export function created<T>(data: T, message = 'Created'): MockResult<T> {
  return {
    status: 201,
    envelope: {
      success: true,
      code: 'CREATED',
      message,
      data,
      timestamp: new Date().toISOString(),
    },
  }
}

/**
 * A handler returns this to opt an individual request out of mocking — the
 * request falls through to the real network exactly like an unmatched
 * route. Used for routes that mock *some* inputs (e.g. known demo emails)
 * but must forward everything else to the real backend.
 */
export function passThrough(): MockResult {
  return { passThrough: true }
}

/**
 * True when `VITE_REAL_API_ROUTES` lists this route. A handler that wants to honour the hybrid
 * setting returns `passThrough()` in that case, so the request reaches the real network (or an
 * E2E interceptor) instead of the in-memory mock.
 */
export function isRealApiRoute(method: string, pathname: string): boolean {
  return matchesRealApiRoute(env.realApiRoutes, method, pathname)
}

/** Builds an error envelope + HTTP status, e.g. `fail(404, 'NOT_FOUND', …)`. */
export function fail(
  status: number,
  code: string,
  message: string,
  errors?: Record<string, string>,
): MockResult<undefined> {
  return {
    status,
    envelope: {
      success: false,
      code,
      message,
      errors,
      timestamp: new Date().toISOString(),
    },
  }
}

type CompiledRoute = MockRoute & {
  paramNames: string[]
  regex: RegExp
}

const routes: CompiledRoute[] = []

function compilePath(path: string): { regex: RegExp; paramNames: string[] } {
  const paramNames: string[] = []
  const pattern = path
    .split('/')
    .map((segment) => {
      if (segment.startsWith(':')) {
        paramNames.push(segment.slice(1))
        return '([^/]+)'
      }
      return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    })
    .join('/')
  return { regex: new RegExp(`^${pattern}$`), paramNames }
}

/** Registers mock route handlers. Called once per handler module at import time. */
export function registerMockRoutes(newRoutes: MockRoute[]) {
  for (const route of newRoutes) {
    const { regex, paramNames } = compilePath(route.path)
    routes.push({ ...route, regex, paramNames })
  }
}

/** Test-only: clears every registered route. */
export function resetMockRoutes() {
  routes.length = 0
}

function matchRoute(method: string, pathname: string) {
  for (const route of routes) {
    if (route.method !== method) continue
    const match = route.regex.exec(pathname)
    if (!match) continue
    const params: Record<string, string> = {}
    route.paramNames.forEach((name, index) => {
      params[name] = decodeURIComponent(match[index + 1] ?? '')
    })
    return { route, params }
  }
  return undefined
}

function parseBody(init?: RequestInit): unknown {
  const raw = init?.body
  if (raw === undefined || raw === null) return undefined
  if (raw instanceof FormData) return raw
  if (typeof raw !== 'string') return undefined
  try {
    return JSON.parse(raw)
  } catch {
    return undefined
  }
}

async function delay(ms: number) {
  if (ms <= 0) return
  await new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Mock transport used by `apiRequest` when `env.useMockApi` is on. Matches
 * `method + path` against registered routes (the origin/`env.apiBaseUrl`
 * prefix is stripped before matching); unmatched requests fall through to
 * the real `fetch` unchanged, so partially-mocked features still reach the
 * backend for the endpoints nobody has stubbed yet.
 */
export async function mockFetch(
  input: string,
  init?: RequestInit,
): Promise<Response> {
  const method = (init?.method ?? 'GET').toUpperCase() as MockMethod
  const url = new URL(input, env.apiBaseUrl)
  const pathname = url.pathname

  const matched = matchRoute(method, pathname)
  if (!matched) {
    return globalThis.fetch(input, init)
  }

  await delay(env.mockLatencyMs)

  const ctx: MockContext = {
    params: matched.params,
    query: url.searchParams,
    body: parseBody(init),
    headers: new Headers(init?.headers),
  }

  const result = await matched.route.handler(ctx)

  if (result.passThrough) {
    return globalThis.fetch(input, init)
  }

  return new Response(JSON.stringify(result.envelope), {
    status: result.status,
    headers: { 'Content-Type': 'application/json' },
  })
}
