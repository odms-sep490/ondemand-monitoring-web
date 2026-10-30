import { env } from '../../../config/env'
import { authenticatedFetch } from '../../auth/api/authApi'
import { transferPcBackup, verifyPcBackup } from './pcMediaTransfer'
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
  sourceType?: 'DRONE_CAMERA' | 'SATELLITE_SNAPSHOT' | 'MANUAL_UPLOAD' | null
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
  previewError?: string
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
    throw new Error(payload?.message ?? `Backend HTTP ${response.status}`)
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
  async reviewItems(
    missionId: string,
    missionAliases: string[] = [],
  ): Promise<LocalMedia[]> {
    const [local, tasks] = await Promise.all([
      operatorMediaApi
        .list(missionId, missionAliases)
        .catch(() => [] as LocalMedia[]),
      operatorMediaApi.manualTasks(missionId),
    ])
    const merged = new Map(
      local.map((item) => [
        item.localMediaId,
        { ...item, localAvailable: true },
      ]),
    )
    for (const task of tasks) {
      merged.set(task.localMediaId, {
        ...merged.get(task.localMediaId),
        ...task,
        localAvailable: merged.has(task.localMediaId),
      })
    }
    return [...merged.values()]
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
        const result = await backend<UploadPlan>(
          `${attemptPath}/failures`,
          'POST',
          {
            code: 'PC_TRANSFER_FAILED',
            message:
              error instanceof Error
                ? error.message.slice(0, 400)
                : 'PC transfer failed',
          },
        )
        if (terminalUploadedStatuses.has(result.status)) return plan.mediaId
        throw error
      }
      // An ambiguous completion response is not a failed transfer; retain this attempt for recovery.
      await backend(
        plan.uploadMethod === 'MULTIPART'
          ? `${attemptPath}/complete-multipart`
          : `${attemptPath}/uploaded`,
        'POST',
        plan.uploadMethod === 'MULTIPART' ? { parts } : undefined,
      )
      return plan.mediaId
    })()
    activeUploads.set(key, operation)
    try {
      return await operation
    } finally {
      activeUploads.delete(key)
    }
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
    const missionId = encodeURIComponent(item.missionId)
    const preparePath = `/missions/${missionId}/media-uploads`
    let plan = await backend<UploadPlan>(preparePath, 'POST', {
      deviceId: item.deviceId,
      localMediaId: item.localMediaId,
      mediaType: item.mediaType,
      fileName: item.fileName,
      contentType: item.contentType,
      fileSize: item.fileSize,
      checksumSha256: item.checksumSha256,
      capturedAt: item.capturedAt,
      sourceType: item.sourceType ?? null,
    })
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
