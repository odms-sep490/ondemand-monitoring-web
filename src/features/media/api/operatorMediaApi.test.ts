// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { operatorMediaApi, type LocalMedia } from './operatorMediaApi'
import { authenticatedFetch } from '../../auth/api/authApi'
import { pendingUploadFailures } from './uploadFailureJournal'

vi.mock('../../auth/api/authApi', () => ({ authenticatedFetch: vi.fn() }))

const item: LocalMedia = {
  localMediaId: 'capture',
  missionId: 'mission',
  deviceId: 'device-0050',
  mediaType: 'IMAGE',
  fileName: 'capture.jpg',
  contentType: 'image/jpeg',
  fileSize: 100,
  checksumSha256: 'a'.repeat(64),
  capturedAt: '2026-09-26T00:00:00Z',
  status: 'REVIEW_PENDING',
}
const plan = (status: string) => ({
  mediaId: 'media',
  attemptId: 'attempt',
  status,
  durablyAccepted: true,
  uploadMethod: 'PUT',
  uploadUrl: 'https://example.test/upload',
  uploadHeaders: {},
  partCount: 0,
})
const response = (data: unknown) =>
  Promise.resolve(
    new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  )

/** Counts real failure reports so retry-boundary assertions can distinguish them. */
let failureCount = 0

describe('operator media retry workflow', () => {
  it('links pending evidence before transfer and never reports an attach conflict as a failed S3 transfer', async () => {
    vi.mocked(authenticatedFetch).mockImplementation(() =>
      response(plan('UPLOAD_PENDING')),
    )
    const controller = vi.fn()
    vi.stubGlobal('fetch', controller)
    const attach = vi.fn().mockRejectedValue(new Error('attach conflict'))
    await expect(operatorMediaApi.upload(item, false, attach)).rejects.toThrow(
      'attach conflict',
    )
    expect(attach).toHaveBeenCalledWith('media')
    expect(controller).not.toHaveBeenCalled()
    expect(authenticatedFetch).toHaveBeenCalledOnce()
  })
  it('propagates satellite provenance and leaves unknown legacy capture unclassified', async () => {
    vi.mocked(authenticatedFetch).mockImplementation(() =>
      response(plan('AVAILABLE')),
    )
    await operatorMediaApi.transfer(
      { ...item, sourceType: 'SATELLITE_SNAPSHOT' },
      false,
    )
    let body = JSON.parse(
      String(vi.mocked(authenticatedFetch).mock.calls[0][1]?.body),
    )
    expect(body.sourceType).toBe('SATELLITE_SNAPSHOT')
    vi.clearAllMocks()
    await operatorMediaApi.transfer(item, false)
    body = JSON.parse(
      String(vi.mocked(authenticatedFetch).mock.calls[0][1]?.body),
    )
    expect(body.sourceType).toBeNull()
  })
  beforeEach(async () => {
    vi.clearAllMocks()
    localStorage.clear()
    failureCount = 0
    // The IndexedDB journal persists across tests in the same worker; start from empty.
    await operatorMediaApi.flushPendingFailureEvents().catch(() => 0)
    const remaining = await pendingUploadFailures()
    if (remaining.length > 0) {
      vi.mocked(authenticatedFetch).mockImplementation(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({ success: true, data: { durablyAccepted: true } }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        ),
      )
      await operatorMediaApi.flushPendingFailureEvents()
    }
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('does not silently start a manual attempt', async () => {
    vi.mocked(authenticatedFetch).mockImplementation(() =>
      response(plan('MANUAL_UPLOAD_REQUIRED')),
    )
    await expect(operatorMediaApi.upload(item)).rejects.toThrow(
      'upload thủ công',
    )
    expect(authenticatedFetch).toHaveBeenCalledTimes(1)
  })

  it('never restates the backend retry budget as a hard-coded attempt count', async () => {
    vi.mocked(authenticatedFetch).mockImplementation(() =>
      response(plan('MANUAL_UPLOAD_REQUIRED')),
    )
    // The escalation reason comes from the backend status, not a duplicated number.
    await expect(operatorMediaApi.upload(item)).rejects.toThrow(
      /Số lần tải lên tự động đã hết/,
    )
    await expect(operatorMediaApi.upload(item)).rejects.toThrow(
      expect.not.stringMatching(/\d+\s*lần upload tự động/),
    )
  })

  it('caps automatic transfers at four and surfaces the last transfer error', async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Connection lost')),
    )
    let failures = 0
    vi.mocked(authenticatedFetch).mockImplementation((url) => {
      if (String(url).endsWith('/failures')) {
        failures++
        // The backend always says RETRY_REQUIRED here, so only the client cap stops the loop.
        return response(plan('RETRY_REQUIRED'))
      }
      return response(plan('UPLOAD_PENDING'))
    })
    const result = expect(operatorMediaApi.upload(item)).rejects.toThrow(
      'Connection lost',
    )
    await vi.runAllTimersAsync()
    await result
    expect(failures).toBe(4)
    expect(fetch).toHaveBeenCalledTimes(4)
  })

  it('defers to the backend MANUAL_UPLOAD_REQUIRED status once the budget is spent', async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Connection lost')),
    )
    vi.mocked(authenticatedFetch).mockImplementation((url) =>
      response(
        plan(
          String(url).endsWith('/failures')
            ? 'MANUAL_UPLOAD_REQUIRED'
            : 'UPLOAD_PENDING',
        ),
      ),
    )
    const result = expect(operatorMediaApi.upload(item)).rejects.toThrow(
      'Task upload thủ công',
    )
    await vi.runAllTimersAsync()
    await result
  })

  it('treats an object found by backend as validating, not as a retry', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Response lost')),
    )
    vi.mocked(authenticatedFetch).mockImplementation((url) =>
      response(
        plan(
          String(url).endsWith('/failures') ? 'VALIDATING' : 'UPLOAD_PENDING',
        ),
      ),
    )
    await expect(operatorMediaApi.upload(item)).resolves.toBe('media')
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('journals a failed transfer durably before reporting and clears it on acknowledgment', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Connection lost')),
    )
    vi.mocked(authenticatedFetch).mockImplementation((url) =>
      response(
        plan(
          String(url).endsWith('/failures')
            ? 'RETRY_REQUIRED'
            : 'UPLOAD_PENDING',
        ),
      ),
    )

    await expect(operatorMediaApi.transfer(item, false)).rejects.toThrow()

    // The genuine failed transfer was persisted with full attempt identity...
    const journalled = await pendingUploadFailures()
    expect(journalled).toHaveLength(1)
    expect(journalled[0]).toMatchObject({
      mediaId: 'media',
      attemptId: 'attempt',
      missionId: 'mission',
      category: 'TRANSFER_FAILED',
    })
    // ...and acknowledged events are removed rather than replayed forever.
    const remaining = await operatorMediaApi.flushPendingFailureEvents()
    expect(remaining).toBe(0)
    expect(await pendingUploadFailures()).toHaveLength(0)
  })

  it('keeps the journalled event when the failure report response is lost', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Connection lost')),
    )
    // Backend unreachable: the failure report itself throws.
    vi.mocked(authenticatedFetch).mockImplementation((url) =>
      String(url).endsWith('/failures')
        ? Promise.reject(new Error('Failed to fetch'))
        : response(plan('UPLOAD_PENDING')),
    )

    await expect(operatorMediaApi.transfer(item, false)).rejects.toThrow()

    // Event must survive: it is replayed later, not discarded with the lost response.
    expect(await pendingUploadFailures()).toHaveLength(1)
  })

  it('performs four transfers in one upload operation so the 4th failure can escalate', async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Connection lost')),
    )
    // Backend escalates only on the fourth qualifying failure.
    vi.mocked(authenticatedFetch).mockImplementation((url) => {
      if (String(url).endsWith('/failures')) {
        const n = (failureCount += 1)
        return response(
          plan(n === 4 ? 'MANUAL_UPLOAD_REQUIRED' : 'RETRY_REQUIRED'),
        )
      }
      return response(plan('UPLOAD_PENDING'))
    })

    const result = expect(operatorMediaApi.upload(item)).rejects.toThrow(
      'Task upload thủ công',
    )
    await vi.runAllTimersAsync()
    await result

    expect(failureCount).toBe(4)
    expect(fetch).toHaveBeenCalledTimes(4)
  })

  it('stops retrying immediately after a successful transfer', async () => {
    // First transfer fails, second succeeds.
    let transfers = 0
    vi.stubGlobal(
      'fetch',
      vi.fn(() => {
        transfers += 1
        return transfers === 1
          ? Promise.reject(new Error('Connection lost'))
          : Promise.resolve(
              new Response(JSON.stringify({ parts: [] }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              }),
            )
      }),
    )
    let failures = 0
    vi.mocked(authenticatedFetch).mockImplementation((url) =>
      response(
        plan(
          String(url).endsWith('/failures')
            ? ((failures += 1), 'RETRY_REQUIRED')
            : 'UPLOAD_PENDING',
        ),
      ),
    )

    await expect(operatorMediaApi.upload(item)).resolves.toBe('media')

    // One failure reported, then the success stops the loop: no further transfers.
    expect(failures).toBe(1)
    expect(transfers).toBe(2)
  })

  it('loads manual tasks from backend even when Flight Controller is offline', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Controller offline')),
    )
    vi.mocked(authenticatedFetch).mockImplementation(() =>
      response([
        {
          ...item,
          backendMediaId: 'media',
          manualTaskId: 'task',
          status: 'MANUAL_UPLOAD_REQUIRED',
        },
      ]),
    )
    const result = await operatorMediaApi.reviewItems('mission')
    expect(result).toHaveLength(1)
    expect(result[0].localAvailable).toBe(false)
    expect(result[0].manualTaskId).toBe('task')
  })
})
