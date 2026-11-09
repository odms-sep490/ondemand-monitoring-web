// Mock handlers for POST /api/v1/auth/login, /logout and /refresh.
//
// Only the demo emails listed in `src/mocks/data/auth-users.json` are
// intercepted — everything else (unknown email, or any request once the
// matching account can't be resolved) falls through to the real backend via
// `passThrough()`, per PLAN §6 ("Login mock: chỉ chặn khi email thuộc
// auth-users.json; email khác → backend thật").

import { createCollection } from '../db'
import {
  fail,
  ok,
  passThrough,
  registerMockRoutes,
  type MockRoute,
} from '../mockServer'
import seed from '../data/auth-users.json'

type MockUser = {
  id: string
  email: string
  password: string
  fullName: string
  role: 'CUSTOMER' | 'MANAGER' | 'STAFF' | 'ADMIN'
  emailVerified: boolean
  isActive: boolean
  accessToken: string
}

const users = createCollection(seed).users as MockUser[]

const REFRESH_COOKIE = 'odm_mock_refresh'

function findUserByEmail(email: string) {
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase())
}

function findUserByToken(token: string) {
  return users.find((user) => user.accessToken === token)
}

function readCookie(name: string): string | undefined {
  const match = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined
}

function setRefreshCookie(userId: string, rememberMe = false) {
  document.cookie = `${REFRESH_COOKIE}=${encodeURIComponent(userId)}; path=/${rememberMe ? '; max-age=2592000' : ''}`
}

function clearRefreshCookie() {
  document.cookie = `${REFRESH_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
}

function toAuthResponse(user: MockUser) {
  return {
    accessToken: user.accessToken,
    tokenType: 'Bearer',
    expiresIn: 3600,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      emailVerified: user.emailVerified,
      role: user.role,
      isActive: user.isActive,
      linkedProviders: ['LOCAL'],
    },
  }
}

function bearerToken(headers: Headers) {
  const header = headers.get('Authorization') ?? headers.get('authorization')
  if (!header?.startsWith('Bearer ')) return undefined
  return header.slice('Bearer '.length)
}

const authRoutes: MockRoute[] = [
  {
    method: 'POST',
    path: '/api/v1/auth/login',
    handler: ({ body }) => {
      const { email, password, rememberMe } = (body ?? {}) as {
        email?: string
        password?: string
        rememberMe?: boolean
      }
      if (!email) return passThrough()

      const user = findUserByEmail(email)
      if (!user) return passThrough()

      if (password !== user.password) {
        // Message copied verbatim from backend ErrorCode.INVALID_CREDENTIALS.
        return fail(
          401,
          'INVALID_CREDENTIALS',
          'Email hoặc mật khẩu không đúng',
        )
      }

      if (!user.isActive) {
        // Message copied verbatim from backend ErrorCode.ACCOUNT_DISABLED.
        return fail(403, 'ACCOUNT_DISABLED', 'Tài khoản đã bị vô hiệu hóa')
      }

      setRefreshCookie(user.id, rememberMe)
      return ok(toAuthResponse(user))
    },
  },
  {
    method: 'POST',
    path: '/api/v1/auth/logout',
    handler: ({ headers }) => {
      const token = bearerToken(headers)
      const user = token
        ? findUserByToken(token)
        : users.find((entry) => entry.id === readCookie(REFRESH_COOKIE))
      if (!user) return passThrough()

      clearRefreshCookie()
      return ok(undefined, 'Đăng xuất thành công')
    },
  },
  {
    method: 'POST',
    path: '/api/v1/auth/refresh',
    handler: () => {
      const userId = readCookie(REFRESH_COOKIE)
      if (!userId) return passThrough()
      const user = users.find((candidate) => candidate.id === userId)
      if (!user) return passThrough()

      // Match BE: refresh provides a token; GET /api/users/me supplies identity.
      return ok({
        accessToken: user.accessToken,
        tokenType: 'Bearer',
        expiresIn: 3600,
      })
    },
  },
]

// The frontend calls `/api/auth/*` (current BE contract); `/api/v1/auth/*` is
// the legacy prefix these handlers were first written for. Serve both.
registerMockRoutes([
  {
    method: 'GET',
    path: '/api/users/me',
    handler: ({ headers }) => {
      const token = bearerToken(headers)
      const user = token ? findUserByToken(token) : undefined
      if (!user) return passThrough()
      return ok({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        linkedProviders: ['LOCAL'],
      })
    },
  },
  ...authRoutes,
  ...authRoutes.map((route) => ({
    ...route,
    path: route.path.replace('/api/v1/auth/', '/api/auth/'),
  })),
])
