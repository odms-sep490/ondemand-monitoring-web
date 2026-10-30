import {
  type LocalMedia,
  operatorMediaApi,
} from '../../../media/api/operatorMediaApi'
import { resolveUploadState } from '../../../media/upload/resolveUploadState'
import { checklistExecutionApi } from '../../../mission/api/checklistExecutionApi'
import { checklistEvidenceApi } from '../../../mission/api/checklistEvidenceApi'
import type {
  EvidenceCandidate,
  MissionChecklistResponse,
} from '../../../mission/types/checklistExecution'
import {
  evidenceEligibleUploadStatuses,
  successfullyUploadedStatuses,
} from './uploadMediaHelpers'
import type { MediaFile } from '../../types/mission'
import { formatDeviceLabel } from '../../lib/deviceLabel'
import { missionResultActions } from '../../components/common/MissionResultActions'
import { operatorHref } from '../../routes'
import { missionApi } from '../../../mission/api/missionApi'
import { uploadMediaPageMessages } from './UploadMediaPage.messages'
import { useI18n } from '../../../../shared/i18n'
import type { Dispatch, SetStateAction, RefObject } from 'react'
import type { UseApiQueryState } from '../../../../shared/hooks/useApiQuery'
import type { MissionResult } from '../../../mission/types/mission'
import type { MissionPermissions } from '../../../mission/types/permissions'
import type { BackendMission } from '../../api/liveMission'

export function useMediaWorkspace({
  missionId,
  setBusyId,
  setError,
  uploadedMediaIds,
  setStatuses,
  setItems,
  itemsRef,
  selectedTargets,
  setAttachFailures,
  setChecklistRevision,
  monitoring,
  refresh,
  batchUploading,
  statuses,
  items,
  attemptNumbers,
  activeMission,
  permissions,
  busyId,
  completionSubmitting,
  filter,
  sort,
  setResultError,
  setCompletionSubmitting,
  setUploadInfo,
}: {
  missionId: string | null
  setBusyId: Dispatch<SetStateAction<string | null>>
  setError: Dispatch<SetStateAction<string | null>>
  uploadedMediaIds: RefObject<Record<string, string>>
  setStatuses: Dispatch<SetStateAction<Record<string, string>>>
  setItems: Dispatch<SetStateAction<LocalMedia[]>>
  itemsRef: RefObject<LocalMedia[]>
  selectedTargets: Record<string, string[]>
  setAttachFailures: Dispatch<SetStateAction<Record<string, string>>>
  setChecklistRevision: Dispatch<SetStateAction<number>>
  monitoring: UseApiQueryState<{
    checklist: MissionChecklistResponse
    result: MissionResult | null
    permissions: MissionPermissions
  }>
  refresh: (
    options?: { background?: boolean | undefined } | undefined,
  ) => Promise<void>
  batchUploading: boolean
  statuses: Record<string, string>
  items: LocalMedia[]
  attemptNumbers: Record<string, number>
  activeMission: {
    data: BackendMission | undefined
    missionId: string
    loading: boolean
    error: unknown
    allMissions: BackendMission[]
    postflightMissions: BackendMission[]
    selectMission: (id: string) => void
    reload: () => void
  }
  permissions: UseApiQueryState<MissionPermissions>
  busyId: string | null
  completionSubmitting: boolean
  filter: 'all' | 'pending' | 'uploaded'
  sort: 'newest' | 'oldest'
  setResultError: Dispatch<unknown>
  setCompletionSubmitting: Dispatch<SetStateAction<boolean>>
  setUploadInfo: Dispatch<SetStateAction<string | null>>
}) {
  const { t } = useI18n(uploadMediaPageMessages)
  async function approve(item: LocalMedia, manual = false) {
    if (!canManageMedia || !missionId) return false
    setBusyId(item.localMediaId)
    setError(null)
    try {
      const mediaId = await operatorMediaApi.upload(
        { ...item, missionId },
        manual,
      )
      uploadedMediaIds.current[item.localMediaId] = mediaId
      setStatuses((previous) => ({
        ...previous,
        [mediaId]: previous[mediaId] ?? 'VALIDATING',
      }))
      setItems((previous) => {
        const next = previous.map((entry) =>
          entry.localMediaId === item.localMediaId
            ? {
                ...entry,
                backendMediaId: mediaId,
                status: 'VALIDATING' as const,
              }
            : entry,
        )
        itemsRef.current = next
        return next
      })
      await attachSelected(item, mediaId)
      refreshWorkspace()
      return true
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.uploadFailed)
      return false
    } finally {
      setBusyId(null)
    }
  }

  async function attachSelected(
    item: LocalMedia,
    mediaId: string,
    explicitTargets?: string[],
  ) {
    const ids = explicitTargets ?? selectedTargets[item.localMediaId] ?? []
    if (!missionId || ids.length === 0) return true
    try {
      // Fetch fresh package/versions for an explicit attach retry, never re-transfer the file.
      const latest =
        await checklistExecutionApi.getMissionChecklistExecutions(missionId)
      const targets = ids.map((id) => {
        const row = latest.executions.find((execution) => execution.id === id)
        if (!row) throw new Error('Mục checklist không còn thuộc Mission này.')
        return { executionId: id, expectedVersion: row.version }
      })
      await checklistEvidenceApi.batch(missionId, mediaId, targets)
      setAttachFailures((previous) => {
        const next = { ...previous }
        delete next[item.localMediaId]
        return next
      })
      return true
    } catch (cause) {
      setAttachFailures((previous) => ({
        ...previous,
        [item.localMediaId]:
          cause instanceof Error ? cause.message : 'Không gắn được bằng chứng.',
      }))
      return false
    } finally {
      refreshWorkspace()
    }
  }

  async function loadEvidenceCandidates(page: number) {
    if (!missionId) return []
    const uploadedCandidates = (
      await checklistEvidenceApi.candidates(missionId, page)
    ).map((candidate) =>
      candidate.status === 'REJECTED'
        ? {
            ...candidate,
            attachable: false,
            eligibleForOperationalReadiness: false,
            eligibleForFinalApproval: false,
            ineligibilityReason: 'MEDIA_REJECTED' as const,
          }
        : candidate,
    )
    if (page > 0) return uploadedCandidates

    const backendIds = new Set(
      uploadedCandidates.map((candidate) => candidate.mediaId),
    )
    const localCandidates: EvidenceCandidate[] = itemsRef.current
      .filter(
        (item) =>
          (canManageMedia && item.localAvailable !== false) ||
          !item.backendMediaId ||
          !backendIds.has(item.backendMediaId),
      )
      .map((item) => {
        const status = effectiveStatus(item)
        const sourceEligible =
          item.sourceType === 'DRONE_CAMERA' ||
          item.sourceType === 'SATELLITE_SNAPSHOT' ||
          item.sourceType === 'MANUAL_UPLOAD'
        const attachable =
          canManageMedia &&
          status !== 'REJECTED' &&
          item.localAvailable !== false &&
          sourceEligible &&
          (item.mediaType === 'IMAGE' || item.mediaType === 'VIDEO')
        return {
          mediaId: `local:${item.localMediaId}`,
          fileName: item.fileName,
          mediaType: item.mediaType,
          contentType: item.contentType,
          status:
            status === 'REJECTED'
              ? 'REJECTED'
              : evidenceEligibleUploadStatuses.has(status)
                ? status === 'AVAILABLE'
                  ? 'AVAILABLE'
                  : 'PENDING_MANAGER_APPROVAL'
                : status === 'VALIDATING' || status === 'UPLOADING'
                  ? 'VALIDATING'
                  : 'UPLOAD_PENDING',
          sourceType: item.sourceType ?? null,
          capturedAt: item.capturedAt,
          validatedAt: null,
          attachable,
          eligibleForOperationalReadiness: false,
          eligibleForFinalApproval: false,
          ineligibilityReason:
            status === 'REJECTED'
              ? 'MEDIA_REJECTED'
              : attachable
                ? null
                : 'EVIDENCE_SOURCE_NOT_ELIGIBLE',
          previewUrl:
            item.localAvailable === false
              ? null
              : operatorMediaApi.previewUrl(item.localMediaId),
          urlExpiresAt: null,
          alreadyAttachedExecutionIds:
            uploadedCandidates.find(
              (candidate) => candidate.mediaId === item.backendMediaId,
            )?.alreadyAttachedExecutionIds ?? [],
        }
      })
    const localBackendIds = new Set(
      itemsRef.current
        .filter((item) => canManageMedia && item.localAvailable !== false)
        .map((item) => item.backendMediaId),
    )
    return [
      ...localCandidates,
      ...uploadedCandidates.filter(
        (item) => !localBackendIds.has(item.mediaId),
      ),
    ]
  }

  async function discard(item: LocalMedia) {
    if (!canManageMedia || batchUploading) return
    if (!window.confirm(t.confirmDiscard(item.fileName))) return
    setBusyId(item.localMediaId)
    try {
      await operatorMediaApi.discard(item.localMediaId)
      refreshWorkspace()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.deleteFailed)
    } finally {
      setBusyId(null)
    }
  }

  async function transferEvidenceCandidate(
    candidate: EvidenceCandidate,
    onPrepared: (mediaId: string) => Promise<void>,
  ) {
    if (!missionId || !permissions.data?.canUploadMedia)
      throw new Error('MEDIA_UPLOAD_NOT_ALLOWED')
    const item = itemsRef.current.find(
      (entry) =>
        `local:${entry.localMediaId}` === candidate.mediaId ||
        entry.backendMediaId === candidate.mediaId,
    )
    if (!item || item.localAvailable === false)
      throw new Error('LOCAL_MEDIA_UNAVAILABLE')
    try {
      await operatorMediaApi.upload(
        { ...item, missionId },
        false,
        async (id) => {
          uploadedMediaIds.current[item.localMediaId] = id
          setItems((previous) => {
            const next = previous.map((entry) =>
              entry.localMediaId === item.localMediaId
                ? { ...entry, backendMediaId: id }
                : entry,
            )
            itemsRef.current = next
            return next
          })
          await onPrepared(id)
        },
      )
    } finally {
      refreshWorkspace()
    }
  }

  async function transferEvidenceBackup(
    candidate: EvidenceCandidate,
    file: File,
    onPrepared: (mediaId: string) => Promise<void>,
  ) {
    if (!missionId || !permissions.data?.canUploadMedia)
      throw new Error('MEDIA_UPLOAD_NOT_ALLOWED')
    const latest = await operatorMediaApi.reviewItems(missionId)
    const item = latest.find(
      (entry) =>
        `local:${entry.localMediaId}` === candidate.mediaId ||
        entry.backendMediaId === candidate.mediaId,
    )
    if (!item) throw new Error('LOCAL_MEDIA_UNAVAILABLE')
    try {
      await operatorMediaApi.uploadPcBackup(
        { ...item, missionId },
        file,
        onPrepared,
      )
    } finally {
      refreshWorkspace()
    }
  }

  async function uploadPc(item: LocalMedia, file: File) {
    if (!canManageMedia || batchUploading || !missionId) return
    setBusyId(item.localMediaId)
    setError(null)
    try {
      const mediaId = await operatorMediaApi.uploadPcBackup(
        { ...item, missionId },
        file,
      )
      await attachSelected(item, mediaId)
      refreshWorkspace()
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Không upload được bản sao PC',
      )
    } finally {
      setBusyId(null)
    }
  }

  const effectiveStatus = (item: LocalMedia) =>
    resolveUploadState(
      item.status,
      item.backendMediaId ? statuses[item.backendMediaId] : undefined,
    )
  const approvable = items.filter(
    (item) =>
      item.localAvailable !== false &&
      [
        'REVIEW_PENDING',
        'UPLOAD_FAILED',
        'RETRY_REQUIRED',
        'UPLOAD_PENDING',
      ].includes(effectiveStatus(item)),
  )
  const files: MediaFile[] = items.map((item) => {
    const status = effectiveStatus(item)
    const uploadFinished = successfullyUploadedStatuses.has(status)
    const transferring = busyId === item.localMediaId
    return {
      id: item.localMediaId,
      name: item.fileName,
      type: item.mediaType === 'IMAGE' ? 'PHOTO' : 'VIDEO',
      sizeBytes: item.fileSize,
      // The API exposes state transitions, not byte-level transfer progress.
      progressPct: uploadFinished ? 100 : 0,
      attempt: item.backendMediaId
        ? (attemptNumbers[item.backendMediaId] ?? 0)
        : 0,
      maxAttempts: 3,
      status:
        transferring || status === 'UPLOADING'
          ? 'UPLOADING'
          : status === 'UPLOAD_FAILED' ||
              status === 'RETRY_REQUIRED' ||
              status === 'MANUAL_UPLOAD_REQUIRED'
            ? 'FAILED'
            : uploadFinished
              ? (status as MediaFile['status'])
              : 'PENDING_UPLOAD',
      manualTaskCreated: status === 'MANUAL_UPLOAD_REQUIRED',
      validationPending: status === 'VALIDATING',
    }
  })
  const uploaded = files.filter((item) =>
    successfullyUploadedStatuses.has(item.status),
  ).length
  const uploading = files.filter((item) => item.status === 'UPLOADING').length
  const validating = files.filter((item) => item.status === 'VALIDATING').length
  const manual = files.filter((item) => item.manualTaskCreated).length
  const deviceLabel = activeMission.data
    ? formatDeviceLabel(activeMission.data)
    : items[0]?.deviceId
  // Permissions and the Mission stay usable while a background reload runs; only a failure or a first load removes them.
  const canManageMedia =
    !permissions.error && permissions.data?.canUploadMedia === true
  const inspector = activeMission.data?.staffAssignments?.find(
    (assignment) => assignment.assignedRole === 'INSPECTOR',
  )
  const showManagerContact = permissions.data?.canInspectDevice === true
  const missionStatus =
    activeMission.error || activeMission.data?.id !== missionId
      ? undefined
      : activeMission.data?.status
  const actions = missionResultActions(
    missionId ?? '',
    missionStatus,
    monitoring,
  )
  const isBusy = !!busyId || batchUploading || completionSubmitting
  const visibleItems = items
    .filter((item) => {
      if (filter === 'all') return true
      const done = successfullyUploadedStatuses.has(effectiveStatus(item))
      return filter === 'uploaded' ? done : !done
    })
    .sort((a, b) => {
      const diff =
        (Date.parse(a.capturedAt) || 0) - (Date.parse(b.capturedAt) || 0)
      return sort === 'newest' ? -diff : diff
    })
  // Upload media is part of the active flight flow, so the back action should
  // consistently return the operator to the cockpit, including mission-scoped
  // upload pages.
  const backRoute = operatorHref({
    screen: 'flight',
    missionId: missionId ?? undefined,
  })

  function buildMissionResultPayload() {
    const mission = activeMission.data
    return {
      status: 'COMPLETED' as const,
      startedAt: null,
      endedAt: null,
      completedAt: new Date().toISOString(),
      summary: [
        `Mission ${mission?.missionCode ?? missionId} đã hoàn thành.`,
        `Thiết bị: ${deviceLabel ?? 'chưa rõ'}.`,
      ].join(' '),
      notes: 'Kết quả giám sát được gửi cho manager duyệt.',
    }
  }

  function refreshWorkspace(clearError = true) {
    if (clearError) setResultError(null)
    activeMission.reload()
    monitoring.reload()
    permissions.reload()
    setChecklistRevision((value) => value + 1)
    void refresh()
  }

  async function runResultAction(operation: 'complete' | 'submit') {
    if (
      !missionId ||
      completionSubmitting ||
      isBusy ||
      (operation === 'complete' ? !actions.completeReady : !actions.submitReady)
    )
      return
    setCompletionSubmitting(true)
    setResultError(null)
    setUploadInfo(null)
    try {
      if (operation === 'complete') {
        await missionApi.completeMission(missionId)
      } else {
        await missionApi.submitMissionResult(
          missionId,
          buildMissionResultPayload(),
        )
      }
    } catch (cause) {
      setResultError(cause)
    } finally {
      refreshWorkspace(false)
      setCompletionSubmitting(false)
    }
  }
  return {
    transferEvidenceCandidate,
    transferEvidenceBackup,
    approve,
    loadEvidenceCandidates,
    discard,
    uploadPc,
    effectiveStatus,
    approvable,
    files,
    uploaded,
    uploading,
    validating,
    manual,
    deviceLabel,
    canManageMedia,
    inspector,
    showManagerContact,
    missionStatus,
    actions,
    isBusy,
    visibleItems,
    backRoute,
    refreshWorkspace,
    runResultAction,
  }
}
