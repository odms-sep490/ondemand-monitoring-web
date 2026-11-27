import { apiRequest } from '../../../shared/api/httpClient'
import { authSession } from '../../auth/api/authApi'
import { subscribeMissionWorkspaceEvents } from '../../notifications/notificationRealtime'

export const workspaceComponents = [
  'checklist',
  'result',
  'permissions',
  'media',
  'corrections',
] as const
export type WorkspaceComponent = (typeof workspaceComponents)[number]
export type MissionWorkspaceVersion = { missionId: string } & Record<
  WorkspaceComponent,
  string
>
type Listener = (changed: readonly WorkspaceComponent[]) => void
type Entry = {
  listeners: Set<Listener>
  version?: MissionWorkspaceVersion
  controller?: AbortController
  timer?: ReturnType<typeof setTimeout>
  pending: boolean
}
const entries = new Map<string, Entry>()
let unsubscribeSocket: (() => void) | undefined
let unsubscribeAuth: (() => void) | undefined
let owner: string | undefined

export function isWorkspaceVersion(
  value: unknown,
  missionId: string,
): value is MissionWorkspaceVersion {
  if (!value || typeof value !== 'object') return false
  const data = value as Record<string, unknown>
  return (
    data.missionId === missionId &&
    workspaceComponents.every((key) => typeof data[key] === 'string')
  )
}

function publish(entry: Entry, changed: readonly WorkspaceComponent[]) {
  entry.listeners.forEach((listener) => {
    try {
      listener(changed)
    } catch {
      /* One stale consumer must not interrupt sibling views. */
    }
  })
}

function schedule(missionId: string, entry: Entry) {
  entry.pending = true
  if (entry.controller || entry.timer || document.hidden) return
  entry.timer = setTimeout(() => {
    entry.timer = undefined
    void check(missionId, entry)
  }, 100)
}

async function check(missionId: string, entry: Entry) {
  if (entries.get(missionId) !== entry || entry.controller) return
  entry.pending = false
  const controller = new AbortController()
  entry.controller = controller
  try {
    const next = await apiRequest<MissionWorkspaceVersion>(
      `/api/missions/${encodeURIComponent(missionId)}/workspace-version`,
      { signal: controller.signal },
    )
    if (controller.signal.aborted || entries.get(missionId) !== entry) return
    if (!isWorkspaceVersion(next, missionId))
      throw new Error('Invalid Mission workspace version')
    const previous = entry.version
    // Domain GETs may predate this baseline and miss a write before STOMP connects.
    // Resync once before relying on version comparisons for later probes.
    const changed = previous
      ? workspaceComponents.filter((key) => previous[key] !== next[key])
      : workspaceComponents
    entry.version = next
    if (changed.length) publish(entry, changed)
  } catch {
    if (!controller.signal.aborted && entries.get(missionId) === entry) {
      // A failed version probe must never hide a failed permission revalidation.
      // Let mounted queries fetch through their normal authorization/error path.
      publish(entry, workspaceComponents)
    }
  } finally {
    if (entries.get(missionId) === entry && entry.controller === controller) {
      entry.controller = undefined
      if (entry.pending) schedule(missionId, entry)
    }
  }
}

function revalidateVisible() {
  if (!document.hidden)
    entries.forEach((entry, missionId) => schedule(missionId, entry))
}

function disposeEntry(entry: Entry) {
  entry.controller?.abort()
  if (entry.timer) clearTimeout(entry.timer)
}

function start() {
  if (unsubscribeSocket) return
  owner = `${authSession.getUser()?.id ?? ''}:${authSession.getEpoch()}`
  unsubscribeAuth = authSession.subscribe(() => {
    const nextOwner = `${authSession.getUser()?.id ?? ''}:${authSession.getEpoch()}`
    if (owner === nextOwner) return
    owner = nextOwner
    entries.forEach((entry, missionId) => {
      disposeEntry(entry)
      entry.controller = undefined
      entry.timer = undefined
      entry.version = undefined
      schedule(missionId, entry)
    })
  })
  unsubscribeSocket = subscribeMissionWorkspaceEvents((event) => {
    if (!event) {
      revalidateVisible()
      return
    }
    const entry = entries.get(event.missionId)
    if (!entry) return
    schedule(event.missionId, entry)
  })
  window.addEventListener('focus', revalidateVisible)
  window.addEventListener('online', revalidateVisible)
  document.addEventListener('visibilitychange', revalidateVisible)
}

/** One version request per Mission, shared by cockpit and review components. */
export function subscribeMissionWorkspace(
  missionId: string,
  listener: Listener,
) {
  let entry = entries.get(missionId)
  if (!entry) {
    entry = { listeners: new Set(), pending: false }
    entries.set(missionId, entry)
  }
  entry.listeners.add(listener)
  start()
  schedule(missionId, entry)
  return () => {
    entry.listeners.delete(listener)
    if (!entry.listeners.size) {
      disposeEntry(entry)
      entries.delete(missionId)
    }
    if (entries.size) return
    unsubscribeSocket?.()
    unsubscribeSocket = undefined
    unsubscribeAuth?.()
    unsubscribeAuth = undefined
    window.removeEventListener('focus', revalidateVisible)
    window.removeEventListener('online', revalidateVisible)
    document.removeEventListener('visibilitychange', revalidateVisible)
  }
}

/** Successful local writes also invalidate sibling views without waiting for STOMP. */
export function notifyMissionWorkspaceChanged(
  missionId: string,
  components: readonly WorkspaceComponent[],
) {
  const entry = entries.get(missionId)
  if (!entry || components.length === 0) return
  schedule(missionId, entry)
}
