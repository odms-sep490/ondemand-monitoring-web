// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  flushPendingFailureEvents,
  pendingUploadFailures,
  recordUploadFailure,
  startFailureJournalReplay,
  type UploadFailureEvent,
} from './uploadFailureJournal'
import { authenticatedFetch } from '../../auth/api/authApi'

vi.mock('../../auth/api/authApi', () => ({ authenticatedFetch: vi.fn() }))

const baseEvent: UploadFailureEvent = {
  eventId: 'evt-test-1',
  missionId: 'mission-1',
  mediaId: 'media-1',
  attemptId: 'attempt-1',
  attemptNumber: 1,
  localMediaId: 'capture-1',
  category: 'TRANSFER_FAILED',
  occurredAt: '2026-10-15T10:00:00Z',
  code: 'TRANSFER_FAILED',
  message: 'S3 PUT timed out',
}

const ackResponse = (durablyAccepted: boolean, duplicate = false) =>
  Promise.resolve(
    new Response(
      JSON.stringify({
        success: true,
        data: { durablyAccepted, duplicate, mediaId: 'media-1' },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    ),
  )

describe('uploadFailureJournal (IndexedDB durability & replay)', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    indexedDB.deleteDatabase('odms-media-journal')
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('persists a failed transfer durably before network transmission', async () => {
    await recordUploadFailure(baseEvent)
    const pending = await pendingUploadFailures()
    expect(pending).toHaveLength(1)
    expect(pending[0].eventId).toBe('evt-test-1')
    expect(pending[0].attemptId).toBe('attempt-1')
  })

  it('retains the event when Backend is unreachable and replays on next flush', async () => {
    await recordUploadFailure(baseEvent)
    vi.mocked(authenticatedFetch).mockRejectedValue(new Error('Network error'))

    const remaining = await flushPendingFailureEvents()

    expect(remaining).toBe(1)
    expect(await pendingUploadFailures()).toHaveLength(1)

    // Backend restored: acknowledges durable acceptance.
    vi.mocked(authenticatedFetch).mockImplementation(() => ackResponse(true))
    const drained = await flushPendingFailureEvents()

    expect(drained).toBe(0)
    expect(await pendingUploadFailures()).toHaveLength(0)
  })

  it('deletes the event only after explicit durablyAccepted acknowledgment', async () => {
    await recordUploadFailure(baseEvent)
    // Server responded with success:false or durablyAccepted:false.
    vi.mocked(authenticatedFetch).mockImplementation(() => ackResponse(false))

    await flushPendingFailureEvents()
    expect(await pendingUploadFailures()).toHaveLength(1)

    vi.mocked(authenticatedFetch).mockImplementation(() => ackResponse(true))
    await flushPendingFailureEvents()
    expect(await pendingUploadFailures()).toHaveLength(0)
  })

  it('treats duplicate acknowledgment as durable acceptance and deletes the entry', async () => {
    await recordUploadFailure(baseEvent)
    // Server says duplicate: true, durablyAccepted: true (already recorded earlier).
    vi.mocked(authenticatedFetch).mockImplementation(() => ackResponse(true, true))

    const remaining = await flushPendingFailureEvents()
    expect(remaining).toBe(0)
    expect(await pendingUploadFailures()).toHaveLength(0)
  })

  it('preserves occurrence order across multiple journaled failures', async () => {
    await recordUploadFailure({
      ...baseEvent,
      eventId: 'evt-2',
      occurredAt: '2026-10-15T10:02:00Z',
    })
    await recordUploadFailure({
      ...baseEvent,
      eventId: 'evt-1',
      occurredAt: '2026-10-15T10:01:00Z',
    })

    const pending = await pendingUploadFailures()
    expect(pending.map((e) => e.eventId)).toEqual(['evt-1', 'evt-2'])
  })

  it('startFailureJournalReplay retries after a backend outage and drains once recovered', async () => {
    await recordUploadFailure(baseEvent)

    // Backend down on the initial mount flush.
    vi.mocked(authenticatedFetch).mockRejectedValue(new Error('Server 503'))
    const stop = startFailureJournalReplay()

    // Event must remain queued while the backend is unreachable.
    await vi.waitFor(async () => expect(authenticatedFetch).toHaveBeenCalled())
    expect(await pendingUploadFailures()).toHaveLength(1)

    // Backend restored: the scheduled retry acknowledges and drains the journal.
    vi.mocked(authenticatedFetch).mockImplementation(() => ackResponse(true))
    await vi.waitFor(async () => expect(await pendingUploadFailures()).toHaveLength(0), {
      timeout: 4000,
    })
    stop()
  })

  it('stopping the replay driver cancels further retries', async () => {
    await recordUploadFailure(baseEvent)
    vi.mocked(authenticatedFetch).mockRejectedValue(new Error('Server 503'))
    const stop = startFailureJournalReplay()

    await vi.waitFor(async () => expect(authenticatedFetch).toHaveBeenCalled())
    const callsAfterStart = vi.mocked(authenticatedFetch).mock.calls.length
    stop()

    // No further scheduled work after disposal.
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(vi.mocked(authenticatedFetch).mock.calls.length).toBe(callsAfterStart)
    expect(await pendingUploadFailures()).toHaveLength(1)
  })
})