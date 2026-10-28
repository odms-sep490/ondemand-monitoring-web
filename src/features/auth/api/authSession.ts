import { env } from '../../../config/env'
import { isUserRole } from '../roles'
import type { AuthResponse, UserProfile } from '../types'
import { AuthApiError, sessionChangedError } from './authErrors'

const ACCESS_TOKEN_KEY = 'fieldwise.accessToken'
const USER_KEY = 'fieldwise.user'
const SIGNAL_KEY = 'fieldwise.auth.event'
const EPOCH_KEY = 'fieldwise.auth.epoch'
const CHANNEL = 'fieldwise.auth'

type SessionSignal = { id: string; type: 'login' | 'logout'; at: number }
export type SessionStatus =
  'loading' | 'authenticated' | 'guest' | 'unavailable'
export type SessionStamp = { generation: number; epoch: string }

// Storage can be disabled in private/embedded contexts. Keep this tab usable.
const memory = new Map<string, string>()
function read(kind: 'localStorage' | 'sessionStorage', key: string) {
  if (memory.has(`${kind}:${key}`)) return memory.get(`${kind}:${key}`)!
  try {
    return window[kind].getItem(key)
  } catch {
    return null
  }
}
function write(
  kind: 'localStorage' | 'sessionStorage',
  key: string,
  value?: string,
) {
  try {
    if (value === undefined) window[kind].removeItem(key)
    else window[kind].setItem(key, value)
    memory.delete(`${kind}:${key}`)
  } catch {
    if (value === undefined) memory.delete(`${kind}:${key}`)
    else memory.set(`${kind}:${key}`, value)
  }
}
function parseSignal(value: unknown): SessionSignal | undefined {
  if (!value || typeof value !== 'object') return
  const signal = value as SessionSignal
  if (
    typeof signal.id === 'string' &&
    ['login', 'logout'].includes(signal.type) &&
    typeof signal.at === 'number' &&
    Number.isFinite(signal.at)
  )
    return signal
}
function readSignal(): SessionSignal | undefined {
  try {
    return parseSignal(JSON.parse(read('localStorage', SIGNAL_KEY) ?? 'null'))
  } catch {
    /* Ignore corrupt metadata; never derive identity from it. */
  }
}
function epoch() {
  return readSignal()?.id ?? 'legacy'
}

let generation = 0
let revision = 0
let status: SessionStatus = 'loading'
let seenEpoch = epoch()
let channel: BroadcastChannel | undefined
const subscribers = new Set<() => void>()
function notify() {
  revision += 1
  subscribers.forEach((listener) => listener())
}
function eraseCredentials() {
  for (const kind of ['localStorage', 'sessionStorage'] as const) {
    write(kind, ACCESS_TOKEN_KEY)
    write(kind, USER_KEY)
  }
  write('sessionStorage', EPOCH_KEY)
}
function emit(type: SessionSignal['type']) {
  const signal: SessionSignal = {
    id: crypto.randomUUID(),
    type,
    at: Math.max(Date.now(), (readSignal()?.at ?? 0) + 1),
  }
  write('localStorage', SIGNAL_KEY, JSON.stringify(signal))
  seenEpoch = signal.id
  try {
    channel?.postMessage(signal)
  } catch {
    /* storage event is the fallback. */
  }
  return signal.id
}
function isUsableToken(token: unknown): token is string {
  return (
    typeof token === 'string' &&
    /^[A-Za-z0-9._~-]+$/.test(token) &&
    (env.useMockApi || token.split('.').length === 3)
  )
}
function safeUser(user: unknown): UserProfile | undefined {
  if (!user || typeof user !== 'object') return
  const candidate = user as UserProfile
  if (
    typeof candidate.id !== 'string' ||
    !candidate.id ||
    typeof candidate.fullName !== 'string' ||
    typeof candidate.email !== 'string' ||
    !isUserRole(candidate.role) ||
    candidate.isActive === false
  )
    return
  return {
    id: candidate.id,
    fullName: candidate.fullName,
    email: candidate.email,
    role: candidate.role,
    emailVerified: candidate.emailVerified,
    isActive: candidate.isActive,
    linkedProviders: Array.isArray(candidate.linkedProviders)
      ? candidate.linkedProviders.filter(
          (provider) => typeof provider === 'string',
        )
      : undefined,
    avatarUrl:
      typeof candidate.avatarUrl === 'string' &&
      /^https?:\/\//i.test(candidate.avatarUrl)
        ? candidate.avatarUrl
        : undefined,
  }
}
function credentialsMatchEpoch() {
  const stored = read('sessionStorage', EPOCH_KEY)
  return !stored || stored === epoch()
}
function persist(response: AuthResponse) {
  const user = safeUser(response.user)
  if (!isUsableToken(response.accessToken) || !user) {
    throw new AuthApiError(
      'Invalid authentication response or unsupported account role.',
      'INVALID_AUTH_RESPONSE',
    )
  }
  // Migrate legacy persistent tokens. Remember-me is now owned by the HttpOnly cookie.
  eraseCredentials()
  write('sessionStorage', ACCESS_TOKEN_KEY, response.accessToken)
  write('sessionStorage', USER_KEY, JSON.stringify(user))
  write('sessionStorage', EPOCH_KEY, epoch())
  status = 'authenticated'
}

export async function withAuthLock<T>(operation: () => Promise<T>): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.locks?.request) {
    return navigator.locks.request(CHANNEL, operation)
  }
  // The current BE refresh does not rotate cookies; per-tab single-flight and
  // epoch guards still prevent stale responses on browsers without Web Locks.
  return operation()
}

export const authSession = {
  subscribe(listener: () => void) {
    subscribers.add(listener)
    return () => {
      subscribers.delete(listener)
    }
  },
  getSnapshot: () => revision,
  getStatus: () => status,
  getEpoch: epoch,
  capture: (): SessionStamp => ({ generation, epoch: epoch() }),
  isCurrent(stamp: SessionStamp) {
    return stamp.generation === generation && stamp.epoch === epoch()
  },
  isLoggedOut: () => readSignal()?.type === 'logout',
  save(response: AuthResponse, _rememberMe: boolean) {
    void _rememberMe // Persistence is selected on the login request, in the BE cookie.
    // Validate before publishing a login event.
    if (!isUsableToken(response.accessToken) || !safeUser(response.user)) {
      throw new AuthApiError(
        'Invalid authentication response or unsupported account role.',
        'INVALID_AUTH_RESPONSE',
      )
    }
    generation += 1
    emit('login')
    persist(response)
    notify()
  },
  restore(response: AuthResponse, stamp: SessionStamp) {
    if (!authSession.isCurrent(stamp)) throw sessionChangedError()
    if (!isUsableToken(response.accessToken) || !safeUser(response.user)) {
      throw new AuthApiError(
        'Invalid restored session.',
        'INVALID_AUTH_RESPONSE',
      )
    }
    const previous = authSession.getUser()
    if (
      previous &&
      response.user &&
      (previous.id !== response.user.id || previous.role !== response.user.role)
    ) {
      generation += 1
      emit('login')
    }
    persist(response)
    notify()
  },
  updateAccessToken(response: AuthResponse) {
    persist({ ...response, user: response.user ?? authSession.getUser() })
    notify()
  },
  getAccessToken() {
    if (!credentialsMatchEpoch()) return undefined
    const token =
      read('sessionStorage', ACCESS_TOKEN_KEY) ??
      read('localStorage', ACCESS_TOKEN_KEY)
    return isUsableToken(token) ? token : undefined
  },
  getUser() {
    if (!credentialsMatchEpoch()) return undefined
    try {
      const raw =
        read('sessionStorage', USER_KEY) ?? read('localStorage', USER_KEY)
      const user = safeUser(JSON.parse(raw ?? 'null'))
      if (raw && !user) {
        eraseCredentials()
        return undefined
      }
      return user
    } catch {
      return undefined
    }
  },
  markLocalLinked() {
    const user = authSession.getUser()
    const accessToken = authSession.getAccessToken()
    if (!user || !accessToken) return
    authSession.save(
      {
        accessToken,
        tokenType: 'Bearer',
        user: {
          ...user,
          linkedProviders: Array.from(
            new Set([...(user.linkedProviders ?? ['GOOGLE']), 'LOCAL']),
          ),
        },
      },
      false,
    )
  },
  clear() {
    generation += 1
    eraseCredentials()
    emit('logout')
    status = 'guest'
    notify()
  },
  setStatus(next: SessionStatus) {
    status = next
    notify()
  },
  connect(onLogin: () => void) {
    // storage is authoritative when available; channel messages carry the same
    // credential-free metadata so blocked storage can still synchronize tabs.
    const synchronize = () => {
      const signal = readSignal()
      if (!signal || signal.id === seenEpoch) return
      seenEpoch = signal.id
      generation += 1
      eraseCredentials()
      status = signal.type === 'logout' ? 'guest' : 'loading'
      notify()
      if (signal.type === 'login') onLogin()
    }
    const onStorage = (event: StorageEvent) => {
      if (event.key === SIGNAL_KEY || event.key === null) synchronize()
    }
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel(CHANNEL)
        channel.onmessage = (event: MessageEvent<unknown>) => {
          const incoming = parseSignal(event.data)
          const latest = readSignal()
          if (
            incoming &&
            (!latest ||
              incoming.at > latest.at ||
              (incoming.at === latest.at && incoming.id > latest.id))
          ) {
            write('localStorage', SIGNAL_KEY, JSON.stringify(incoming))
          }
          synchronize()
        }
      }
    } catch {
      /* storage events work without BroadcastChannel. */
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', synchronize)
    window.addEventListener('pageshow', synchronize)
    synchronize()
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', synchronize)
      window.removeEventListener('pageshow', synchronize)
      channel?.close()
      channel = undefined
    }
  },
}
