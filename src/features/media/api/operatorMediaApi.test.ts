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
  it('restricts new captures to drone-camera provenance and preserves legacy source values only as read data', async () => {
    vi.mocked(authenticatedFetch).mockImplementation((url) =>
      String(url).endsWith('/uploaded')
        ? response(null)
        : response(plan('UPLOAD_PENDING')),
    )
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(null, { status: 200 }),
    ))
    await expect(operatorMediaApi.transfer(
      { ...item, sourceType: 'SATELLITE_SNAPSHOT' }, false,
    )).rejects.toThrow('camera của drone')
    expect(authenticatedFetch).not.toHaveBeenCalled()
    await operatorMediaApi.transfer(item, false)
    const body = JSON.parse(
      String(vi.mocked(authenticatedFetch).mock.calls[0][1]?.body),
    )
    expect(body.sourceType).toBe('DRONE_CAMERA')
  })

  it('loads the persisted Mission library including failed Staff attempts and channel metadata', async () => {
    vi.mocked(authenticatedFetch).mockResolvedValue(await response({
      items: [{
        mediaId: 'media-1', missionId: 'mission', deviceId: 'device-0050',
        mediaType: 'IMAGE', sourceType: 'DRONE_CAMERA', fileName: 'capture.jpg',
        contentType: 'image/jpeg', fileSize: 100, capturedAt: '2026-09-26T00:00:00Z',
        status: 'MANUAL_UPLOAD_REQUIRED', localMediaId: 'staff-a', checksumSha256: 'a'.repeat(64),
        uploadChannel: 'STAFF_FILE', attemptNumber: 1, failureCode: 'TRANSFER_FAILED',
        failureMessage: 'Connection lost', manualTaskId: 'task-1',
    }], totalPages: 1,
    }))
    const result = await operatorMediaApi.workspaceLibrary('mission')
    expect(String(vi.mocked(authenticatedFetch).mock.calls[0][0])).toContain(
      '/operator/missions/mission/media/media-library?page=0&size=100',
    )
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      backendMediaId: 'media-1', localMediaId: 'staff-a', status: 'MANUAL_UPLOAD_REQUIRED',
      uploadChannel: 'STAFF_FILE', attemptNumber: 1, manualTaskId: 'task-1',
    })
  })

  it('uploads a newly selected drone file directly to S3 with no automatic retry', async () => {
    const file = new File(['drone-photo'], 'flight.jpg', { type: 'image/jpeg', lastModified: Date.now() })
    vi.mocked(authenticatedFetch).mockImplementation((url) =>
      String(url).endsWith('/staff-media-uploads')
        ? response({ ...plan('UPLOAD_PENDING'), uploadMethod: 'PUT', uploadUrl: 'https://s3.test/object', uploadHeaders: {} })
        : response(null),
    )
    const transfer = vi.fn().mockResolvedValue({ ok: true, status: 200, headers: new Headers() })
    vi.stubGlobal('fetch', transfer)
    const prepared = vi.fn()

    const mediaId = await operatorMediaApi.uploadStaffFile('mission', 'device-0050', file, '2026-09-26T00:00:00Z', prepared)

    expect(mediaId).toBe('media')
    expect(prepared).toHaveBeenCalledOnce()
    expect(transfer).toHaveBeenCalledOnce()
    expect(transfer.mock.calls[0][0]).toBe('https://s3.test/object')
    expect(transfer.mock.calls[0][1]).toMatchObject({ method: 'PUT', credentials: 'omit' })
    const prepareCall = vi.mocked(authenticatedFetch).mock.calls[0]
    expect(String(prepareCall[0])).toContain('/staff-media-uploads')
    expect(JSON.parse(String(prepareCall[1]?.body))).toMatchObject({
      deviceId: 'device-0050', sourceType: 'DRONE_CAMERA', mediaType: 'IMAGE', capturedAt: '2026-09-26T00:00:00.000Z',
    })
    expect(String(vi.mocked(authenticatedFetch).mock.calls[1][0])).toContain('/uploaded')
  })

  it('requires a confirmed capture time instead of using file modification time', async () => {
    const file = new File(['photo'], 'flight.jpg', { type: 'image/jpeg', lastModified: Date.now() });
    await expect(operatorMediaApi.uploadStaffFile('mission', 'device-0050', file, ''))
      .rejects.toThrow('thời gian chụp');
    expect(authenticatedFetch).not.toHaveBeenCalled();
  })

  it('records one failed Staff transfer and does not retry it automatically', async () => {
    const file = new File(['drone-photo'], 'flight.jpg', { type: 'image/jpeg', lastModified: Date.now() })
    vi.mocked(authenticatedFetch).mockImplementation((url) =>
      String(url).endsWith('/staff-media-uploads')
        ? response({ ...plan('UPLOAD_PENDING'), attemptNumber: 1 })
        : response({ durablyAccepted: true, mediaId: 'media', status: 'MANUAL_UPLOAD_REQUIRED' }),
    )
    const transfer = vi.fn().mockRejectedValue(new Error('Network unavailable'))
    vi.stubGlobal('fetch', transfer)

    await expect(operatorMediaApi.uploadStaffFile('mission', 'device-0050', file, '2026-09-26T00:00:00Z'))
      .rejects.toThrow('Network unavailable')

    expect(transfer).toHaveBeenCalledOnce()
    expect(vi.mocked(authenticatedFetch).mock.calls.map(([url]) => String(url))).toEqual([
      expect.stringContaining('/staff-media-uploads'),
      expect.stringContaining('/failures'),
    ])
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
    vi.mocked(authenticatedFetch).mockClear()
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
      response({ items: [{
          ...item,
          mediaId: 'media',
          missionId: 'mission',
          deviceId: 'device-0050',
          mediaType: 'IMAGE',
          fileName: 'capture.jpg',
          contentType: 'image/jpeg',
          fileSize: 100,
          capturedAt: '2026-09-26T00:00:00Z',
          manualTaskId: 'task',
          status: 'MANUAL_UPLOAD_REQUIRED',
        }], totalPages: 1 }),
    )
    const result = await operatorMediaApi.reviewItems('mission')
    expect(result).toHaveLength(1)
    expect(result[0].localAvailable).toBe(false)
    expect(result[0].manualTaskId).toBe('task')
  })
})


describe('Staff media removal API contract', () => {
  it('posts the exact Mission/media identity, expected version and reason', async () => {
    vi.mocked(authenticatedFetch).mockResolvedValue(new Response(JSON.stringify({success:true,data:{mediaId:'media-1',removed:true,cleanupScheduled:true}}),{status:200}))
    await operatorMediaApi.removeStaffMedia('exact-mission','media-1',4,'Chọn nhầm')
    expect(authenticatedFetch).toHaveBeenLastCalledWith(expect.stringContaining('/api/operator/missions/exact-mission/media/media-1/removal'),expect.objectContaining({method:'POST',body:JSON.stringify({expectedVersion:4,reason:'Chọn nhầm'})}))
  })
})


describe('Staff upload identity after removal', () => {
  it('uses a stable intent for retries and a new intent for explicit reselection without changing the checksum', async () => {
    vi.mocked(authenticatedFetch).mockImplementation((_url, options) => {
      const body = JSON.parse(String(options?.body))
      return response({ ...plan('AVAILABLE'), mediaId: body.localMediaId })
    })
    const file = new File(['same drone capture'], 'same.jpg', { type: 'image/jpeg' })
    const time = '2026-11-10T01:00:00Z'
    const declaration = { captureTimeSource: 'METADATA' as const, captureTimeZone: 'UTC' }
    const first = await operatorMediaApi.uploadStaffFile('mission', 'device', file, time, undefined, declaration, 'selection-a')
    const retry = await operatorMediaApi.uploadStaffFile('mission', 'device', file, time, undefined, declaration, 'selection-a')
    const replacement = await operatorMediaApi.uploadStaffFile('mission', 'device', file, time, undefined, declaration, 'selection-b')
    const bodies = vi.mocked(authenticatedFetch).mock.calls.map(([, options]) => JSON.parse(String(options?.body)))
    expect(first).toBe('staff-selection-a'); expect(retry).toBe(first); expect(replacement).toBe('staff-selection-b')
    expect(bodies[0].checksumSha256).toBe(bodies[2].checksumSha256)
    expect(bodies[0].localMediaId).not.toContain(bodies[0].checksumSha256)
  })
})


describe('local captures with identical content', () => {
  const duplicate = () => Promise.resolve(new Response(JSON.stringify({
    success: false, code: 'MEDIA_DUPLICATE_CONTENT', message: 'Duplicate content',
  }), { status: 409 }))
  const libraryItem = (overrides: Partial<LocalMedia> = {}) => ({
    ...item, localMediaId: 'original-capture', backendMediaId: undefined,
    mediaId: 'existing-media', sourceType: 'DRONE_CAMERA',
    uploadChannel: 'FLIGHT_CONTROLLER', status: 'AVAILABLE', ...overrides,
  })
  const setupDuplicate = (rows: unknown[], state: string, replayState = state) => {
    let registrations = 0
    vi.mocked(authenticatedFetch).mockImplementation((url) => {
      const path = String(url)
      if (path.includes('/media-library?')) return response({ items: rows, totalPages: 1 })
      if (path.endsWith('/upload-status')) return response({ ...plan(state), mediaId: 'existing-media' })
      if (path.endsWith('/uploaded')) return response(null)
      if (path.endsWith('/upload-attempts')) return response({ ...plan('UPLOAD_PENDING'), mediaId: 'existing-media' })
      registrations++
      return registrations === 1 ? duplicate() : response({ ...plan(replayState), mediaId: 'existing-media' })
    })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ parts: [] }), { status: 200 })))
  }

  it.each(['AVAILABLE', 'VALIDATING', 'PENDING_MANAGER_APPROVAL'])(
    'reuses %s media identity for evidence without another transfer', async (state) => {
      setupDuplicate([libraryItem()], state)
      const attach = vi.fn().mockResolvedValue(undefined)
      await expect(operatorMediaApi.upload(item, false, attach)).resolves.toBe('existing-media')
      expect(attach).toHaveBeenCalledExactlyOnceWith('existing-media')
      expect(fetch).not.toHaveBeenCalled()
      expect(localStorage.getItem('odms.media-upload:mission:capture')).toBe('existing-media')
      expect(vi.mocked(authenticatedFetch).mock.calls.filter(([url]) => String(url).endsWith('/media-uploads'))).toHaveLength(1)
    },
  )

  it('resumes the original FC registration instead of creating another asset', async () => {
    setupDuplicate([libraryItem({ capturedAt: '2026-09-25T23:59:59Z' })], 'UPLOAD_PENDING')
    await expect(operatorMediaApi.upload(item)).resolves.toBe('existing-media')
    const registrations = vi.mocked(authenticatedFetch).mock.calls.filter(([url]) => String(url).endsWith('/media-uploads'))
    expect(registrations).toHaveLength(2)
    expect(JSON.parse(String(registrations[1][1]?.body))).toMatchObject({
      localMediaId: 'original-capture', capturedAt: '2026-09-25T23:59:59Z', checksumSha256: item.checksumSha256,
    })
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/local/capture/transfer'), expect.anything())
  })

  it('retries a failed FC asset using its existing identity', async () => {
    setupDuplicate([libraryItem()], 'RETRY_REQUIRED')
    await expect(operatorMediaApi.upload(item)).resolves.toBe('existing-media')
    expect(authenticatedFetch).toHaveBeenCalledWith(expect.stringContaining('/media/existing-media/upload-attempts'), expect.objectContaining({ method: 'POST' }))
  })

  it('preserves manual escalation and never automatically transfers it', async () => {
    setupDuplicate([libraryItem()], 'MANUAL_UPLOAD_REQUIRED')
    await expect(operatorMediaApi.upload(item)).rejects.toMatchObject({ code: 'MANUAL_UPLOAD_REQUIRED' })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('does not turn a Staff-file failure into an automatic FC attempt', async () => {
    setupDuplicate([libraryItem({ uploadChannel: 'STAFF_FILE' })], 'MANUAL_UPLOAD_REQUIRED')
    await expect(operatorMediaApi.upload(item)).rejects.toThrow('media hiện có')
    expect(fetch).not.toHaveBeenCalled()
    expect(vi.mocked(authenticatedFetch).mock.calls.filter(([url]) => String(url).endsWith('/media-uploads'))).toHaveLength(1)
  })

  it.each([
    { missionId: 'sibling-mission' }, { deviceId: 'other-device' },
    { checksumSha256: 'b'.repeat(64) }, { fileSize: 101 },
    { contentType: 'image/png' }, { mediaType: 'VIDEO' as const },
    { status: 'REMOVED' as const }, { status: 'REJECTED' as const },
  ])('does not reuse incompatible or removed media: %j', async (overrides) => {
    setupDuplicate([libraryItem(overrides)], 'AVAILABLE')
    const attach = vi.fn()
    await expect(operatorMediaApi.upload(item, false, attach)).rejects.toMatchObject({ code: 'MEDIA_DUPLICATE_CONTENT' })
    expect(attach).not.toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('fails closed if historical data has more than one matching asset', async () => {
    setupDuplicate([libraryItem(), { ...libraryItem(), mediaId: 'other-media' }], 'AVAILABLE')
    await expect(operatorMediaApi.upload(item)).rejects.toMatchObject({ code: 'MEDIA_DUPLICATE_CONTENT' })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('does not resolve permission errors as duplicates', async () => {
    vi.mocked(authenticatedFetch).mockResolvedValue(new Response(JSON.stringify({ success: false, code: 'FORBIDDEN', message: 'Forbidden' }), { status: 403 }))
    await expect(operatorMediaApi.upload(item)).rejects.toMatchObject({ status: 403 })
    expect(authenticatedFetch).toHaveBeenCalledOnce()
  })
})


describe('resolved local capture aliases in the Mission library', () => {
  it.each([true, false])('shows a resolved asset once, with the canonical file present: %s', async (canonicalPresent) => {
    const canonical: LocalMedia = { ...item, localMediaId: 'canonical', backendMediaId: 'existing-media' }
    const alias: LocalMedia = { ...item, localMediaId: 'alias', backendMediaId: 'existing-media' }
    const local = canonicalPresent ? [canonical, alias] : [alias]
    const list = vi.spyOn(operatorMediaApi, 'list').mockResolvedValue(local)
    const library = vi.spyOn(operatorMediaApi, 'workspaceLibrary').mockResolvedValue([
      { ...canonical, status: 'AVAILABLE', localAvailable: false, version: 4 },
    ])
    try {
      const result = await operatorMediaApi.reviewItems('mission')
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ backendMediaId: 'existing-media', status: 'AVAILABLE', localAvailable: true, version: 4 })
      expect(local).toHaveLength(canonicalPresent ? 2 : 1)
      expect(alias.localMediaId).toBe('alias')
    } finally {
      list.mockRestore()
      library.mockRestore()
    }
  })
})
