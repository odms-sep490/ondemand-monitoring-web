import { resolveStaffUploadIntent } from '../upload/staffUploadIntent'
import { ApiError } from '../../../shared/api/httpClient'
import type { CaptureTimeDeclaration } from '../capture/captureTime'
import { env } from '../../../config/env'
import { authenticatedFetch } from '../../auth/api/authApi'
import { hashMediaFile, transferPcBackup, verifyPcBackup } from './pcMediaTransfer'
import {
  flushPendingFailureEvents,
  newEventId,
  recordUploadFailure,
} from './uploadFailureJournal'

const controllerUrl =
  import.meta.env.VITE_FLIGHT_CONTROL_API_URL ?? 'http://localhost:8090'

export type LocalMedia = {
  localMediaId: string
  missionId: string
  missionCode?: string
  deviceId?: string
  mediaType: 'IMAGE' | 'VIDEO'
  fileName: string
  contentType: string
  fileSize: number
  checksumSha256: string
  capturedAt: string
  captureTimeSource?: string | null
  captureTimeZone?: string | null
  sourceType?: string | null
  uploadChannel?: 'FLIGHT_CONTROLLER' | 'STAFF_FILE' | null
  attemptNumber?: number
  previewUrl?: string | null
  thumbnailUrl?: string | null
  failureCode?: string | null
  failureMessage?: string | null
  status:
    | 'REVIEW_PENDING'
    | 'UPLOADING'
    | 'UPLOAD_FAILED'
    | 'VALIDATING'
    | 'MANUAL_UPLOAD_REQUIRED'
    | 'UPLOAD_PENDING'
    | 'RETRY_REQUIRED'
    | 'PENDING_MANAGER_APPROVAL'
    | 'AVAILABLE'
    | 'REJECTED'
    | 'REMOVED'
  previewError?: string
  version?: number
  staffCreated?: boolean
  backendMediaId?: string
  manualTaskId?: string
  reason?: string
  localAvailable?: boolean
}

type UploadPlan = {
  mediaId: string
  attemptId: string
  status: string
  uploadMethod: 'PUT' | 'MULTIPART' | null
  uploadUrl: string | null
  uploadHeaders: Record<string, string[]>
  partSizeBytes: number
  partCount: number
  attemptNumber: number
  manualTaskId?: string
  uploadChannel?: 'FLIGHT_CONTROLLER' | 'STAFF_FILE' | null
  failureCode?: string | null
  failureMessage?: string | null
}

class RetryableTransferError extends Error {}

/**
 * Total automatic transfers allowed in one upload operation. The Backend raises a Staff
 * Manual Upload ticket only after MORE THAN three actual failed transfers, so this must be 4
 * or the fourth failure can never be reached from a single operation.
 */
const MAX_TRANSFER_ATTEMPTS = 4

/**
 * Sends a journalled failure event and returns the resulting upload plan.
 * Falls back to the legacy synchronous shape so the existing status-driven flow is unchanged.
 */
async function reportJournaledFailure(
  event: Parameters<typeof recordUploadFailure>[0],
  attemptPath: string,
): Promise<UploadPlan | null> {
  const ack = await backend<{
    durablyAccepted?: boolean
    retryLater?: boolean
    mediaId?: string
    status?: string
  }>(`${attemptPath}/failures`, 'POST', {
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
  })
  if (!ack?.durablyAccepted) return null
  return {
    mediaId: ack.mediaId ?? event.mediaId,
    status: ack.status ?? '',
  } as UploadPlan
}
const activeUploads = new Map<string, Promise<string>>()
const delay = (milliseconds: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds))
const terminalUploadedStatuses = new Set([
  'AVAILABLE',
  'VALIDATING',
  'PENDING_MANAGER_APPROVAL',
])
function sameContentScope(left: LocalMedia, right: LocalMedia): boolean {
  return left.missionId === right.missionId && left.deviceId === right.deviceId &&
    Boolean(left.checksumSha256) && left.checksumSha256.toLowerCase() === right.checksumSha256.toLowerCase() &&
    left.fileSize === right.fileSize && left.contentType === right.contentType && left.mediaType === right.mediaType
}

const referenceKey = (item: Pick<LocalMedia, 'missionId' | 'localMediaId'>) =>
  `odms.media-upload:${item.missionId}:${item.localMediaId}`

function storedMediaId(item: LocalMedia): string | undefined {
  try {
    return window.localStorage.getItem(referenceKey(item)) ?? undefined
  } catch {
    return undefined
  }
}

async function backend<T>(
  path: string,
  method = 'GET',
  body?: unknown,
): Promise<T> {
  const response = await authenticatedFetch(`${env.apiBaseUrl}/api${path}`, {
    method,
    headers:
      body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const payload = await response.json().catch(() => undefined)
  if (!response.ok || !payload?.success) {
    throw new ApiError(payload?.message ?? `Backend HTTP ${response.status}`, { status: response.status, code: payload?.code, method, path })
  }
  return payload.data as T
}

async function controller<T>(
  path: string,
  method = 'GET',
  body?: unknown,
): Promise<T> {
  const response = await fetch(`${controllerUrl}${path}`, {
    method,
    signal: AbortSignal.timeout(path.endsWith('/transfer') ? 1800000 : 10000),
    headers:
      body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const payload = await response.json().catch(() => undefined)
  if (!response.ok)
    throw new Error(
      payload?.error ?? `Flight Controller HTTP ${response.status}`,
    )
  return payload as T
}

export const operatorMediaApi = {
  controllerUrl,
  /** Replays journalled upload failures; safe to call on reconnect or on demand. */
  flushPendingFailureEvents,
  previewUrl(id: string) {
    return `${controllerUrl}/api/media/local/${encodeURIComponent(id)}/preview`
  },
  async list(
    missionId: string,
    missionAliases: string[] = [],
  ): Promise<LocalMedia[]> {
    const params = new URLSearchParams()
    params.set('missionId', missionId)
    missionAliases
      .filter(Boolean)
      .forEach((alias) => params.append('missionAlias', alias))
    const response = await controller<{ media: LocalMedia[] }>(
      `/api/media/local?${params.toString()}`,
    )
    const keys = new Set([missionId, ...missionAliases].filter(Boolean))
    return response.media
      .filter(
        (item) =>
          keys.has(item.missionId) ||
          (item.missionCode ? keys.has(item.missionCode) : false),
      )
      .map((item) => ({
        ...item,
        backendMediaId: item.backendMediaId ?? storedMediaId(item),
      }))
  },
  async manualTasks(missionId: string) {
    try {
      return await backend<LocalMedia[]>(
        `/missions/${encodeURIComponent(missionId)}/manual-media-uploads`,
      )
    } catch {
      return []
    }
  },
  async workspaceLibrary(missionId: string): Promise<LocalMedia[]> {
    const collected: LocalMedia[] = []
    for (let page = 0; ; page++) {
      const response = await backend<{
        items: Array<{
          mediaId: string; version?: number; staffCreated?: boolean; missionId: string; deviceId: string
          mediaType: 'IMAGE' | 'VIDEO'; sourceType?: string | null
          fileName: string; contentType: string; fileSize: number; capturedAt: string
          captureTimeSource?: string | null; captureTimeZone?: string | null
          status: LocalMedia['status']; localMediaId?: string | null
          checksumSha256?: string | null; uploadChannel?: LocalMedia['uploadChannel']
          attemptNumber?: number | null; failureCode?: string | null
          failureMessage?: string | null; manualTaskId?: string | null
          previewUrl?: string | null; thumbnailUrl?: string | null
        }>
        totalPages: number
      }>(`/operator/missions/${encodeURIComponent(missionId)}/media/media-library?page=${page}&size=100`)
      collected.push(...response.items.map((item) => ({
        localMediaId: item.localMediaId ?? `backend:${item.mediaId}`,
        backendMediaId: item.mediaId,
        version: item.version,
        staffCreated: item.staffCreated,
        missionId: item.missionId,
        deviceId: item.deviceId,
        mediaType: item.mediaType,
        sourceType: item.sourceType,
        fileName: item.fileName,
        contentType: item.contentType,
        fileSize: item.fileSize,
        checksumSha256: item.checksumSha256 ?? '',
        capturedAt: item.capturedAt,
        captureTimeSource: item.captureTimeSource,
        captureTimeZone: item.captureTimeZone,
        status: item.status,
        uploadChannel: item.uploadChannel,
        attemptNumber: item.attemptNumber ?? undefined,
        failureCode: item.failureCode,
        failureMessage: item.failureMessage,
        manualTaskId: item.manualTaskId ?? undefined,
        previewUrl: item.previewUrl,
        thumbnailUrl: item.thumbnailUrl,
        localAvailable: false,
      })))
      if (page + 1 >= response.totalPages) break
    }
    return collected
  },
  async reviewItems(
    missionId: string,
    missionAliases: string[] = [],
  ): Promise<LocalMedia[]> {
    const [local, library] = await Promise.all([
      operatorMediaApi.list(missionId, missionAliases).catch(() => [] as LocalMedia[]),
      operatorMediaApi.workspaceLibrary(missionId),
    ])
    const localById = new Map(local.map((item) => [item.localMediaId, item]))
    const merged = library.map((item) => {
      const localItem = localById.get(item.localMediaId) ?? local.find((capture) =>
        capture.backendMediaId === item.backendMediaId && sameContentScope(capture, item),
      )
      return localItem
        ? { ...item, ...localItem, backendMediaId: item.backendMediaId, status: item.status,
            manualTaskId: item.manualTaskId, previewUrl: item.previewUrl,
            thumbnailUrl: item.thumbnailUrl, uploadChannel: item.uploadChannel,
            version: item.version, staffCreated: item.staffCreated,
            localAvailable: true }
        : item
    })
    const known = new Set(merged.map((item) => item.localMediaId))
    const registered = new Map(library.map((item) => [item.backendMediaId, item]))
    return [...merged, ...local.filter((item) => {
      if (known.has(item.localMediaId)) return false
      const existing = item.backendMediaId ? registered.get(item.backendMediaId) : undefined
      // Keep every file in the local manifest, but show one card per resolved asset.
      return !existing || !sameContentScope(item, existing)
    })]
  },
  async uploadPcBackup(
    item: LocalMedia,
    file: File,
    onPrepared?: (mediaId: string) => Promise<void>,
  ): Promise<string> {
    if (!item.backendMediaId || !item.manualTaskId)
      throw new Error('Không có manual task cho media này.')
    const key = `${item.missionId}:${item.localMediaId}`
    if (activeUploads.has(key))
      throw new Error('Media đang được upload. Vui lòng chờ.')
    const operation = (async () => {
      const checksumSha256 = await verifyPcBackup(file, item)
      await onPrepared?.(item.backendMediaId!)
      const mediaPath = `/media/${encodeURIComponent(item.backendMediaId!)}`
      const plan = await backend<UploadPlan>(
        `${mediaPath}/manual-file-upload`,
        'POST',
        {
          fileSize: file.size,
          contentType: item.contentType,
          checksumSha256,
        },
      )
      if (terminalUploadedStatuses.has(plan.status)) return plan.mediaId
      const attemptPath = `${mediaPath}/upload-attempts/${encodeURIComponent(plan.attemptId)}`
      let parts: Array<{ partNumber: number; eTag: string }>
      try {
        parts = await transferPcBackup(file, plan, (partNumber) =>
          backend<UploadPlan>(`${attemptPath}/parts/${partNumber}/url`, 'POST'),
        )
      } catch (error) {
        const event = {
          eventId: newEventId(), missionId: item.missionId, mediaId: plan.mediaId,
          attemptId: plan.attemptId, attemptNumber: plan.attemptNumber,
          localMediaId: item.localMediaId, category: 'TRANSFER_FAILED' as const,
          occurredAt: new Date().toISOString(), code: 'STAFF_FILE_TRANSFER_FAILED',
          message: error instanceof Error ? error.message.slice(0, 400) : 'Staff file transfer failed',
          checksumSha256,
        }
        await recordUploadFailure(event)
        try {
          await reportJournaledFailure(event, attemptPath)
        } catch {
          throw new Error('Không gửi được báo cáo lỗi; sự kiện đã lưu để gửi lại khi có mạng.', { cause: error })
        }
        throw error
      }
      // An ambiguous completion response is not a failed transfer; retain it for reconciliation.
      try {
        await backend(
          plan.uploadMethod === 'MULTIPART' ? `${attemptPath}/complete-multipart` : `${attemptPath}/uploaded`,
          'POST', plan.uploadMethod === 'MULTIPART' ? { parts } : undefined,
        )
      } catch (ackError) {
        const event = {
          eventId: newEventId(), missionId: item.missionId, mediaId: plan.mediaId,
          attemptId: plan.attemptId, attemptNumber: plan.attemptNumber,
          localMediaId: item.localMediaId, category: 'TRANSFER_ACK_LOST' as const,
          occurredAt: new Date().toISOString(), code: 'TRANSFER_ACK_LOST',
          message: ackError instanceof Error ? ackError.message.slice(0, 400) : 'Acknowledgement lost',
          checksumSha256,
        }
        await recordUploadFailure(event)
        await flushPendingFailureEvents().catch(() => 0)
      }
      return plan.mediaId
    })()
    activeUploads.set(key, operation)
    try {
      return await operation
    } finally {
      activeUploads.delete(key)
    }
  },
  async uploadStaffFile(
    missionId: string,
    deviceId: string,
    file: File,
    capturedAt: string,
    onPrepared?: (mediaId: string, item: LocalMedia) => Promise<void>,
    declaration: CaptureTimeDeclaration = { captureTimeSource: 'STAFF_CONFIRMED', captureTimeZone: 'Asia/Ho_Chi_Minh', captureTimeConfirmationReason: 'Staff confirmed capture time' },
    uploadIntentId?: string,
  ): Promise<string> {
    if (!capturedAt || !Number.isFinite(Date.parse(capturedAt))) {
      throw new Error('Vui lòng xác nhận thời gian chụp/quay của tệp.')
    }
    const contentType = file.type || (
      /\.png$/i.test(file.name) ? 'image/png' : /\.mp4$/i.test(file.name) ? 'video/mp4' : 'image/jpeg'
    )
    if (!['image/jpeg', 'image/png', 'video/mp4'].includes(contentType)) {
      throw new Error('Chỉ hỗ trợ ảnh JPEG/PNG và video MP4 được chụp bằng drone.')
    }
    if (file.size <= 0) throw new Error('Tệp không có dữ liệu.')
    const mediaType = contentType === 'video/mp4' ? 'VIDEO' : 'IMAGE'
    const checksumSha256 = await hashMediaFile(file)
    const localMediaId = `staff-${resolveStaffUploadIntent(file, uploadIntentId)}`
    const item: LocalMedia = {
      localMediaId, missionId, deviceId, mediaType, fileName: file.name,
      contentType, fileSize: file.size, checksumSha256,
      capturedAt: new Date(capturedAt).toISOString(),
      sourceType: 'DRONE_CAMERA', uploadChannel: 'STAFF_FILE', status: 'UPLOAD_PENDING', localAvailable: false,
    }
    const key = `staff:${missionId}:${deviceId}:${checksumSha256}`
    if (activeUploads.has(key)) throw new Error('Tệp này đang được tải lên.')
    const operation = (async () => {
      const plan = await backend<UploadPlan>(
        `/missions/${encodeURIComponent(missionId)}/staff-media-uploads`,
        'POST',
        { deviceId, localMediaId, mediaType, fileName: file.name, contentType,
          fileSize: file.size, checksumSha256, capturedAt: item.capturedAt, sourceType: 'DRONE_CAMERA', ...declaration },
      )
      await onPrepared?.(plan.mediaId, { ...item, backendMediaId: plan.mediaId, status: plan.status as LocalMedia['status'] })
      if (terminalUploadedStatuses.has(plan.status)) return plan.mediaId
      if (!plan.attemptId || !plan.uploadMethod) throw new Error('Không có phiên tải lên hợp lệ từ Backend.')
      const attemptPath = `/media/${encodeURIComponent(plan.mediaId)}/upload-attempts/${encodeURIComponent(plan.attemptId)}`
      let parts: Array<{ partNumber: number; eTag: string }>
      try {
        parts = await transferPcBackup(file, plan, (partNumber) =>
          backend<UploadPlan>(`${attemptPath}/parts/${partNumber}/url`, 'POST'),
        )
      } catch (cause) {
        const event = {
          eventId: newEventId(), missionId, mediaId: plan.mediaId, attemptId: plan.attemptId,
          attemptNumber: plan.attemptNumber, localMediaId, category: 'TRANSFER_FAILED' as const,
          occurredAt: new Date().toISOString(), code: 'STAFF_FILE_TRANSFER_FAILED',
          message: cause instanceof Error ? cause.message.slice(0, 400) : 'Staff file transfer failed',
          checksumSha256,
        }
        await recordUploadFailure(event)
        try { await reportJournaledFailure(event, attemptPath) }
        catch { throw new Error('Không gửi được báo cáo lỗi; sự kiện đã lưu để gửi lại khi có mạng.', { cause }) }
        throw cause
      }
      try {
        await backend(plan.uploadMethod === 'MULTIPART' ? `${attemptPath}/complete-multipart` : `${attemptPath}/uploaded`,
          'POST', plan.uploadMethod === 'MULTIPART' ? { parts } : undefined)
      } catch (cause) {
        const event = {
          eventId: newEventId(), missionId, mediaId: plan.mediaId, attemptId: plan.attemptId,
          attemptNumber: plan.attemptNumber, localMediaId, category: 'TRANSFER_ACK_LOST' as const,
          occurredAt: new Date().toISOString(), code: 'TRANSFER_ACK_LOST',
          message: cause instanceof Error ? cause.message.slice(0, 400) : 'Acknowledgement lost',
          checksumSha256,
        }
        await recordUploadFailure(event)
        await flushPendingFailureEvents().catch(() => 0)
      }
      return plan.mediaId
    })()
    activeUploads.set(key, operation)
    try { return await operation } finally { activeUploads.delete(key) }
  },
  removeStaffMedia(missionId: string, mediaId: string, expectedVersion: number, reason: string) {
    return backend<{ mediaId: string; removed: boolean; cleanupScheduled: boolean }>(
      `/operator/missions/${encodeURIComponent(missionId)}/media/${encodeURIComponent(mediaId)}/removal`,
      'POST', { expectedVersion, reason },
    )
  },
  discard(id: string) {
    return controller(
      `/api/media/local/${encodeURIComponent(id)}/discard`,
      'POST',
    )
  },
  upload(
    item: LocalMedia,
    manual = false,
    onPrepared?: (mediaId: string) => Promise<void>,
  ): Promise<string> {
    const key = `${item.missionId}:${item.localMediaId}`
    const active = activeUploads.get(key)
    if (active)
      return active.then(async (mediaId) => {
        await onPrepared?.(mediaId)
        return mediaId
      })
    const operation = (async () => {
      // MAX_TRANSFER_ATTEMPTS is the number of TOTAL automatic transfers one upload operation
      // may perform, not a retry count. The Backend escalates a Staff Manual Upload ticket
      // only after MORE THAN three actual failed transfers, so this must reach the fourth
      // transfer or the escalation could never be reached from a single operation.
      for (let attempt = 1; attempt <= MAX_TRANSFER_ATTEMPTS; attempt++) {
        try {
          // A success returns immediately: retries stop at the first successful transfer.
          return await operatorMediaApi.transfer(item, manual, onPrepared)
        } catch (error) {
          // Only a backend-confirmed transfer failure permits another transfer.
          // Authorization/acknowledgement errors never consume a transfer attempt.
          const isLast = attempt === MAX_TRANSFER_ATTEMPTS
          if (manual || !(error instanceof RetryableTransferError) || isLast)
            throw error
          await delay(
            2000 * 2 ** (attempt - 1) + Math.floor(Math.random() * 500),
          )
        }
      }
      throw new Error('Automatic upload attempts exhausted')
    })()
    activeUploads.set(key, operation)
    void operation
      .finally(() => activeUploads.delete(key))
      .catch(() => undefined)
    return operation
  },
  async transfer(
    item: LocalMedia,
    manual: boolean,
    onPrepared?: (mediaId: string) => Promise<void>,
  ): Promise<string> {
    if (item.sourceType && item.sourceType !== 'DRONE_CAMERA') {
      throw new Error('Tệp mới phải có nguồn capture từ camera của drone.')
    }
    const missionId = encodeURIComponent(item.missionId)
    const preparePath = `/missions/${missionId}/media-uploads`
    const metadata = {
      deviceId: item.deviceId,
      localMediaId: item.localMediaId,
      mediaType: item.mediaType,
      fileName: item.fileName,
      contentType: item.contentType,
      fileSize: item.fileSize,
      checksumSha256: item.checksumSha256,
      capturedAt: item.capturedAt,
      sourceType: 'DRONE_CAMERA',
    }
    let plan: UploadPlan
    try {
      plan = await backend<UploadPlan>(preparePath, 'POST', metadata)
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 409 || error.code !== 'MEDIA_DUPLICATE_CONTENT')
        throw error
      // Resolve only through the authorized exact-Mission library. Names and capture
      // timestamps are not content identity, and a checksum alone is not permission.
      const matches = (await operatorMediaApi.workspaceLibrary(item.missionId)).filter((existing) =>
        sameContentScope(existing, item) && existing.sourceType === 'DRONE_CAMERA' &&
        existing.status !== 'REMOVED' && existing.status !== 'REJECTED' && existing.backendMediaId,
      )
      if (matches.length !== 1) throw error
      const existing = matches[0]
      plan = await operatorMediaApi.status(existing.backendMediaId!)
      if (plan.mediaId !== existing.backendMediaId)
        throw new Error('Không xác định được media trùng trong Mission. Hãy làm mới thư viện.', { cause: error })
      if (!terminalUploadedStatuses.has(plan.status)) {
        if (existing.uploadChannel !== 'FLIGHT_CONTROLLER') {
          throw new Error('Ảnh này đã có trong thư viện. Hãy tiếp tục upload hoặc khôi phục tại media hiện có.', { cause: error })
        }
        // Replay the original registration to resume its attempt; retain its capture
        // metadata and channel, while transferring the identical local bytes.
        plan = await backend<UploadPlan>(preparePath, 'POST', {
          ...metadata, localMediaId: existing.localMediaId,
          capturedAt: existing.capturedAt,
        })
        if (plan.mediaId !== existing.backendMediaId)
          throw new Error('Media đã thay đổi. Hãy làm mới thư viện trước khi thử lại.', { cause: error })
      }
    }
    // Persist only the correlation ID, never credentials or signed URLs.
    try {
      window.localStorage.setItem(referenceKey(item), plan.mediaId)
    } catch {
      /* Storage may be disabled. */
    }
    await onPrepared?.(plan.mediaId)
    const mediaPath = `/media/${encodeURIComponent(plan.mediaId)}`
    if (terminalUploadedStatuses.has(plan.status)) return plan.mediaId
    if (plan.status === 'MANUAL_UPLOAD_REQUIRED' && !manual) {
      // The backend is the single source of truth for how many failures were tolerated;
      // do not restate a hard-coded attempt count here.
      throw Object.assign(
        new Error(
          'Số lần tải lên tự động đã hết. Hãy chọn upload thủ công; bản gốc vẫn được giữ trên Flight Controller.',
        ),
        { code: 'MANUAL_UPLOAD_REQUIRED' },
      )
    }
    if (
      plan.status === 'RETRY_REQUIRED' ||
      plan.status === 'MANUAL_UPLOAD_REQUIRED'
    ) {
      const retryPath =
        plan.status === 'MANUAL_UPLOAD_REQUIRED'
          ? `${mediaPath}/manual-upload-attempts`
          : `${mediaPath}/upload-attempts`
      plan = await backend<UploadPlan>(retryPath, 'POST')
    }
    if (!plan.uploadMethod || !plan.attemptId)
      throw new Error('No upload attempt available')
    const attemptPath = `${mediaPath}/upload-attempts/${encodeURIComponent(plan.attemptId)}`
    const partUrls: Array<{
      partNumber: number
      uploadUrl: string
      uploadHeaders: Record<string, string[]>
    }> = []
    if (plan.uploadMethod === 'MULTIPART') {
      for (let partNumber = 1; partNumber <= plan.partCount; partNumber++) {
        const part = await backend<UploadPlan>(
          `${attemptPath}/parts/${partNumber}/url`,
          'POST',
        )
        if (!part.uploadUrl)
          throw new Error(`Missing signed URL for part ${partNumber}`)
        partUrls.push({
          partNumber,
          uploadUrl: part.uploadUrl,
          uploadHeaders: part.uploadHeaders,
        })
      }
    }
    let transferred: { parts: Array<{ partNumber: number; eTag: string }> }
    try {
      transferred = await controller<{
        parts: Array<{ partNumber: number; eTag: string }>
      }>(
        `/api/media/local/${encodeURIComponent(item.localMediaId)}/transfer`,
        'POST',
        { ...plan, partUrls },
      )
    } catch (error) {
      // Journal the genuine failed transfer BEFORE reporting it, so a lost response or a
      // Backend outage cannot lose failure history. Replay is idempotent on eventId.
      const event = {
        eventId: newEventId(),
        missionId: item.missionId,
        mediaId: plan.mediaId,
        attemptId: plan.attemptId,
        attemptNumber: plan.attemptNumber,
        localMediaId: item.localMediaId,
        category: 'TRANSFER_FAILED' as const,
        occurredAt: new Date().toISOString(),
        code: 'TRANSFER_FAILED',
        message:
          error instanceof Error
            ? error.message.slice(0, 400)
            : 'Transfer failed',
        checksumSha256: item.checksumSha256,
      }
      await recordUploadFailure(event)
      let failure: UploadPlan | null
      try {
        failure = await reportJournaledFailure(event, attemptPath)
      } catch {
        // Backend unreachable: the event stays queued for replay and must not be discarded.
        throw new Error(
          'Không gửi được báo cáo lỗi tải lên; sự kiện đã được lưu và sẽ gửi lại khi có mạng.',
          { cause: error },
        )
      }
      if (!failure) {
        throw new RetryableTransferError(
          error instanceof Error ? error.message : 'Transfer failed',
        )
      }
      if (terminalUploadedStatuses.has(failure.status)) return plan.mediaId
      if (failure.status === 'RETRY_REQUIRED') {
        throw new RetryableTransferError(
          error instanceof Error ? error.message : 'Transfer failed',
        )
      }
      // `failure.status` is MANUAL_UPLOAD_REQUIRED here, which is the backend's own
      // signal that the automatic retry budget is spent and a Staff ticket exists.
      throw Object.assign(
        new Error(
          `Upload thất bại: ${failure.status === 'MANUAL_UPLOAD_REQUIRED' ? 'Task upload thủ công đã được tạo' : 'cần thử lại'}; bản gốc vẫn được giữ trên Flight Controller.`,
          { cause: error },
        ),
        { code: failure.status },
      )
    }
    // An acknowledgement failure is not an S3 transfer failure. The object may
    // already be in S3 (and its ObjectCreated event may already be processing).
    try {
      if (plan.uploadMethod === 'MULTIPART') {
        await backend(`${attemptPath}/complete-multipart`, 'POST', {
          parts: transferred.parts,
        })
      } else {
        await backend(`${attemptPath}/uploaded`, 'POST')
      }
    } catch (ackError) {
      // The bytes may already be in storage, so this must NOT be recorded as a failed
      // transfer. Journal it as TRANSFER_ACK_LOST and let the Backend re-inspect the object.
      await recordUploadFailure({
        eventId: newEventId(),
        missionId: item.missionId,
        mediaId: plan.mediaId,
        attemptId: plan.attemptId,
        attemptNumber: plan.attemptNumber,
        localMediaId: item.localMediaId,
        category: 'TRANSFER_ACK_LOST',
        occurredAt: new Date().toISOString(),
        code: 'TRANSFER_ACK_LOST',
        message:
          ackError instanceof Error
            ? ackError.message.slice(0, 400)
            : 'Acknowledgement lost',
        checksumSha256: item.checksumSha256,
      })
      await flushPendingFailureEvents().catch(() => 0)
      return plan.mediaId
    }
    return plan.mediaId
  },
  status(mediaId: string) {
    return backend<UploadPlan>(
      `/media/${encodeURIComponent(mediaId)}/upload-status`,
    )
  },
}
