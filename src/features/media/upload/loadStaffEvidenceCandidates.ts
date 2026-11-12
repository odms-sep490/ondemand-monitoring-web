import { ApiError } from '../../../shared/api/httpClient'
import { checklistEvidenceApi } from '../../mission/api/checklistEvidenceApi'
import type {
  EvidenceCandidate,
  EvidenceCandidatePage,
  EvidenceMediaStatus,
  MissionChecklistExecution,
} from '../../mission/types/checklistExecution'
import { operatorMediaApi, type LocalMedia } from '../api/operatorMediaApi'
import { withStaffLocalPreviews } from './staffEvidencePresentation'

type Options = {
  missionId: string
  missionAliases?: string[]
  page: number
  canUploadMedia: boolean
  executions: MissionChecklistExecution[]
  signal?: AbortSignal
}
const uploadStatus = (status: LocalMedia['status']): EvidenceMediaStatus =>
  status === 'REVIEW_PENDING'
    ? 'UPLOAD_PENDING'
    : status === 'UPLOAD_FAILED'
      ? 'RETRY_REQUIRED'
      : status === 'REMOVED'
        ? 'REJECTED'
        : status

/** Read-only source aggregation. Only the evidence confirmation starts a transfer. */
export async function loadStaffEvidenceCandidates({
  missionId,
  missionAliases = [],
  page,
  canUploadMedia,
  executions,
  signal,
}: Options): Promise<EvidenceCandidatePage> {
  signal?.throwIfAborted()
  const remoteSignal = signal
    ? AbortSignal.any([signal, AbortSignal.timeout(10000)])
    : AbortSignal.timeout(10000)
  const [uploaded, local] = await Promise.allSettled([
    checklistEvidenceApi
      .candidates(missionId, page, remoteSignal)
      .then((items) => {
        if (!Array.isArray(items))
          throw new Error('Invalid backend candidate response')
        return items
      }),
    operatorMediaApi.list(missionId, missionAliases),
  ])
  signal?.throwIfAborted()
  // Source fallback must not conceal a revoked Mission/session permission.
  if (
    uploaded.status === 'rejected' &&
    uploaded.reason instanceof ApiError &&
    [401, 403].includes(uploaded.reason.status ?? 0)
  )
    throw uploaded.reason
  if (uploaded.status === 'rejected' && local.status === 'rejected')
    throw new AggregateError(
      [uploaded.reason, local.reason],
      'Media sources unavailable',
    )

  const unavailableSources: EvidenceCandidatePage['unavailableSources'] = []
  if (uploaded.status === 'rejected') unavailableSources.push('uploaded')
  if (local.status === 'rejected') unavailableSources.push('local')
  const remote = uploaded.status === 'fulfilled' ? uploaded.value : []
  const keys = new Set([missionId, ...missionAliases])
  const captures = (local.status === 'fulfilled' ? local.value : []).filter(
    (item) =>
      keys.has(item.missionId) &&
      item.status !== 'REMOVED' &&
      item.localAvailable !== false &&
      item.uploadChannel !== 'STAFF_FILE',
  )
  const registeredIds = new Set(remote.map((item) => item.mediaId))
  const seen = new Set<string>()
  const localCandidates: EvidenceCandidate[] =
    page === 0
      ? captures
          .filter(
            (item) =>
              !item.backendMediaId ||
              (uploaded.status === 'rejected' &&
                !registeredIds.has(item.backendMediaId)),
          )
          .sort(
            (a, b) =>
              new Date(b.capturedAt).getTime() -
              new Date(a.capturedAt).getTime(),
          )
          .flatMap((item): EvidenceCandidate[] => {
            // Known backend media must never be uploaded again as a new local capture.
            const id = item.backendMediaId ?? `local:${item.localMediaId}`
            if (seen.has(id)) return []
            seen.add(id)
            const sourceEligible = item.sourceType === 'DRONE_CAMERA'
            const attachable =
              !item.backendMediaId &&
              canUploadMedia &&
              sourceEligible &&
              item.status !== 'REMOVED' &&
              item.status !== 'REJECTED'
            const alreadyAttachedExecutionIds = executions
              .filter(
                (execution) =>
                  item.backendMediaId &&
                  execution.evidence?.some(
                    (link) => link.mediaId === item.backendMediaId,
                  ),
              )
              .map((execution) => execution.id)
            return [
              {
                mediaId: id,
                fileName: item.fileName,
                mediaType: item.mediaType,
                contentType: item.contentType,
                status: uploadStatus(item.status),
                sourceType: item.sourceType ?? null,
                capturedAt: item.capturedAt,
                validatedAt: null,
                attachable,
                eligibleForOperationalReadiness: false,
                eligibleForFinalApproval: false,
                ineligibilityReason: attachable
                  ? null
                  : item.backendMediaId
                    ? 'MEDIA_NOT_VALIDATED'
                    : 'EVIDENCE_SOURCE_NOT_ELIGIBLE',
                previewUrl: operatorMediaApi.previewUrl(item.localMediaId),
                localThumbnailUrl: item.localThumbnailUrl,
                urlExpiresAt: null,
                alreadyAttachedExecutionIds,
              },
            ]
          })
      : []
  return {
    items: [
      ...localCandidates,
      ...withStaffLocalPreviews(remote, captures, missionId),
    ],
    unavailableSources,
    // Local captures do not manufacture backend pages when there are 50+ files.
    hasMore: uploaded.status === 'fulfilled' && remote.length >= 50,
  }
}
