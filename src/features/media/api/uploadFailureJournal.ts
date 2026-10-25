/**
 * Durable client-side journal of upload-failure events.
 *
 * The Browser is the only process that observes an S3 PUT failing, so it is the only place a
 * failure can be journalled when the Backend is unreachable. Entries are written to IndexedDB
 * BEFORE the failure report is transmitted and are deleted only after the Backend returns an
 * explicit `durablyAccepted` acknowledgment, so a lost response never loses failure history.
 *
 * IndexedDB (not localStorage) because entries must survive refresh, tab closure and process
 * restart, which is what the replay contract requires.
 */
import { authenticatedFetch } from '../../auth/api/authApi'
import { env } from '../../../config/env'

export type UploadFailureCategory = 'TRANSFER_FAILED' | 'TRANSFER_ACK_LOST'

export type UploadFailureEvent = {
  /** Idempotency key. Generated before transmission and never reused. */
  eventId: string
  missionId: string
  mediaId: string
  attemptId: string
  attemptNumber: number
  localMediaId: string
  category: UploadFailureCategory
  occurredAt: string
  code: string
  message: string
  checksumSha256?: string
}

const DB_NAME = 'odms-media-journal'
const DB_VERSION = 1
const STORE = 'upload-failure-events'
/** Bounded exponential backoff; resets once the journal drains. */
const MAX_BACKOFF_MS = 30_000

type Ack = { durablyAccepted?: boolean; duplicate?: boolean; retryLater?: boolean }

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        // Keyed by eventId so replay is naturally idempotent and ordered by occurrence.
        const store = db.createObjectStore(STORE, { keyPath: 'eventId' })
        store.createIndex('occurredAt', 'occurredAt')
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

/** Persists the event durably. Must resolve before the report is transmitted. */
export async function recordUploadFailure(event: UploadFailureEvent): Promise<void> {
  const db = await open()
  try {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(event)
    await done(tx)
  } finally {
    db.close()
  }
}

/** Pending events in occurrence order, so replay preserves the original sequence. */
export async function pendingUploadFailures(): Promise<UploadFailureEvent[]> {
  const db = await open()
  try {
    const tx = db.transaction(STORE, 'readonly')
    const store = tx.objectStore(STORE)
    const rows = await new Promise<UploadFailureEvent[]>((resolve, reject) => {
      const request = store.index('occurredAt').getAll()
      request.onsuccess = () => resolve(request.result as UploadFailureEvent[])
      request.onerror = () => reject(request.error)
    })
    return rows.sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))
  } finally {
    db.close()
  }
}

async function remove(eventId: string): Promise<void> {
  const db = await open()
  try {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(eventId)
    await done(tx)
  } finally {
    db.close()
  }
}

async function report(event: UploadFailureEvent): Promise<Ack | null> {
  const path = `/media/${encodeURIComponent(event.mediaId)}/upload-attempts/` +
    `${encodeURIComponent(event.attemptId)}/failures`
  const response = await authenticatedFetch(`${env.apiBaseUrl}/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventId: event.eventId,
      category: event.category,
      missionId: event.missionId,
      mediaId: event.mediaId,
      attemptId: event.attemptId,
      localMediaId: event.localMediaId,
      attemptNumber: event.attemptNumber,
      checksumSha256: event.checksumSha256 ?? null,
      occurredAt: event.occurredAt,
      code: event.code,
      message: event.message,
    }),
  })
  if (!response.ok) return null
  const payload = (await response.json().catch(() => undefined)) as
    { success?: boolean; data?: Ack } | undefined
  return payload?.success ? (payload.data ?? null) : null
}

/**
 * Replays unacknowledged events in order. An entry is deleted only when the Backend confirms
 * durable acceptance; a duplicate acknowledgment counts as accepted.
 *
 * @returns the number of events still pending afterwards
 */
export async function flushPendingFailureEvents(): Promise<number> {
  let pending: UploadFailureEvent[]
  try {
    pending = await pendingUploadFailures()
  } catch {
    return 0 // Storage unavailable; nothing can be replayed this cycle.
  }
  for (const event of pending) {
    let ack: Ack | null
    try {
      ack = await report(event)
    } catch {
      // Backend unreachable. Stop so ordering is preserved and retry on the next flush.
      break
    }
    if (ack?.durablyAccepted) await remove(event.eventId)
    else break // No durable acceptance yet; keep the event for the next cycle.
  }
  return pendingUploadFailures()
    .then((rows) => rows.length)
    .catch(() => 0)
}

/**
 * Mount/online/backoff replay driver.
 *
 * Bounded exponential backoff runs ONLY while events remain unacknowledged; once the journal
 * is empty the timer is cleared, so there is no permanent polling loop.
 *
 * @returns a disposer that clears the timer and listeners
 */
export function startFailureJournalReplay(): () => void {
  let timer: number | undefined
  let stopped = false
  let attempt = 0

  const schedule = (pending: number) => {
    if (stopped) return
    if (timer !== undefined) window.clearTimeout(timer)
    if (pending <= 0) {
      attempt = 0 // Journal drained: stop polling until the next event is recorded.
      return
    }
    const delay = Math.min(MAX_BACKOFF_MS, 1000 * 2 ** attempt)
    attempt += 1
    timer = window.setTimeout(() => void run(), delay)
  }

  const run = async () => {
    if (stopped) return
    try {
      schedule(await flushPendingFailureEvents())
    } catch {
      schedule(1)
    }
  }

  const onOnline = () => {
    attempt = 0
    void run()
  }
  window.addEventListener('online', onOnline)
  void run() // Initial mount flush.

  return () => {
    stopped = true
    window.removeEventListener('online', onOnline)
    if (timer !== undefined) window.clearTimeout(timer)
  }
}

export function newEventId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `evt-${Date.now()}-${Math.random().toString(16).slice(2)}`
}