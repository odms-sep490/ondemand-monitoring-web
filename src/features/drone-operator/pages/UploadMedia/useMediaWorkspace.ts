import {
  type LocalMedia,
  operatorMediaApi,
} from '../../../media/api/operatorMediaApi'
import { checklistExecutionApi } from '../../../mission/api/checklistExecutionApi'
import { checklistEvidenceApi } from '../../../mission/api/checklistEvidenceApi'
import type {
  EvidenceCandidate,
  MissionChecklistExecution,
} from '../../../mission/types/checklistExecution'
import { finishedUploadStatuses } from './uploadMediaHelpers'
import type { MediaFile } from '../../types/mission'
import { formatDeviceLabel } from '../../lib/deviceLabel'
import { missionResultActions } from '../../components/common/MissionResultActions'
import { operatorHref } from '../../routes'
import { missionApi } from '../../../mission/api/missionApi'
import { uploadMediaPageMessages } from './UploadMediaPage.messages'
import { useI18n } from '../../../../shared/i18n'
import type { Dispatch, SetStateAction, RefObject } from 'react'
import type { UseApiQueryState } from '../../../../shared/hooks/useApiQuery'
import type { MissionChecklistResponse } from '../../../mission/types/checklistExecution'
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

  async function attachSelected(item: LocalMedia, mediaId: string) {
    const ids = selectedTargets[item.localMediaId] ?? []
    if (!missionId || ids.length === 0) return
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
    } catch (cause) {
      setAttachFailures((previous) => ({
        ...previous,
        [item.localMediaId]:
          cause instanceof Error ? cause.message : 'Không gắn được bằng chứng.',
      }))
    } finally {
      refreshWorkspace()
    }
  }

  async function loadEvidenceCandidates(page: number) {
    if (!missionId) return []
    const uploadedCandidates = await checklistEvidenceApi.candidates(
      missionId,
      page,
    )
    if (page > 0) return uploadedCandidates

    const backendIds = new Set(
      uploadedCandidates.map((candidate) => candidate.mediaId),
    )
    const localCandidates: EvidenceCandidate[] = itemsRef.current
      .filter(
        (item) => !item.backendMediaId || !backendIds.has(item.backendMediaId),
      )
      .map((item) => {
        const status = effectiveStatus(item)
        const sourceEligible =
          item.sourceType === 'DRONE_CAMERA' ||
          item.sourceType === 'SATELLITE_SNAPSHOT'
        const attachable =
          canManageMedia &&
          item.localAvailable !== false &&
          sourceEligible &&
          (item.mediaType === 'IMAGE' || item.mediaType === 'VIDEO')
        return {
          mediaId: `local:${item.localMediaId}`,
          fileName: item.fileName,
          mediaType: item.mediaType,
          contentType: item.contentType,
          status: finishedUploadStatuses.has(status)
            ? status === 'AVAILABLE'
              ? 'AVAILABLE'
              : 'PENDING_MANAGER_APPROVAL'
            : status === 'VALIDATING'
              ? 'VALIDATING'
              : 'UPLOAD_PENDING',
          sourceType: item.sourceType ?? null,
          capturedAt: item.capturedAt,
          validatedAt: null,
          attachable,
          eligibleForOperationalReadiness: false,
          eligibleForFinalApproval: false,
          ineligibilityReason: attachable
            ? null
            : 'EVIDENCE_SOURCE_NOT_ELIGIBLE',
          previewUrl:
            item.localAvailable === false
              ? null
              : operatorMediaApi.previewUrl(item.localMediaId),
          urlExpiresAt: null,
          alreadyAttachedExecutionIds: [],
        }
      })
    return [...localCandidates, ...uploadedCandidates]
  }

  async function attachEvidenceCandidate(
    candidate: EvidenceCandidate,
    execution: MissionChecklistExecution,
  ) {
    if (!missionId) return
    let mediaId = candidate.mediaId

    if (candidate.mediaId.startsWith('local:')) {
      const localId = candidate.mediaId.slice('local:'.length)
      const item = itemsRef.current.find(
        (entry) => entry.localMediaId === localId,
      )
      if (!item) throw new Error('Media local không còn khả dụng.')

      mediaId = item.backendMediaId ?? ''
      if (!mediaId) {
        setBusyId(item.localMediaId)
        mediaId = await operatorMediaApi.upload({ ...item, missionId }, false)
        uploadedMediaIds.current[item.localMediaId] = mediaId
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
      }
    }

    try {
      const latest =
        await checklistExecutionApi.getMissionChecklistExecutions(missionId)
      const current = latest.executions.find((item) => item.id === execution.id)
      if (!current)
        throw new Error('Mục checklist không còn thuộc Mission này.')
      await checklistEvidenceApi.attach(
        missionId,
        current.id,
        mediaId,
        current.version,
      )
      setChecklistRevision((value) => value + 1)
      monitoring.reload()
      await refresh()
    } finally {
      setBusyId(null)
    }
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
    (item.backendMediaId && statuses[item.backendMediaId]) || item.status
  const approvable = items.filter(
    (item) =>
      item.localAvailable !== false &&
      ['REVIEW_PENDING', 'UPLOAD_FAILED', 'RETRY_REQUIRED'].includes(
        effectiveStatus(item),
      ),
  )
  const files: MediaFile[] = items.map((item) => {
    const status = effectiveStatus(item)
    const uploadFinished = finishedUploadStatuses.has(status)
    return {
      id: item.localMediaId,
      name: item.fileName,
      type: item.mediaType === 'IMAGE' ? 'PHOTO' : 'VIDEO',
      sizeBytes: item.fileSize,
      progressPct: uploadFinished
        ? 100
        : status === 'VALIDATING'
          ? 90
          : status === 'UPLOADING'
            ? 50
            : 0,
      attempt: item.backendMediaId
        ? (attemptNumbers[item.backendMediaId] ?? 0)
        : 0,
      maxAttempts: 3,
      status: uploadFinished
        ? 'UPLOADED'
        : status === 'UPLOADING' || status === 'VALIDATING'
          ? 'UPLOADING'
          : status === 'UPLOAD_FAILED' ||
              status === 'RETRY_REQUIRED' ||
              status === 'MANUAL_UPLOAD_REQUIRED'
            ? 'FAILED'
            : 'PENDING_UPLOAD',
      manualTaskCreated: status === 'MANUAL_UPLOAD_REQUIRED',
      validationPending: status === 'VALIDATING',
    }
  })
  const uploaded = files.filter((item) => item.status === 'UPLOADED').length
  const uploading = files.filter((item) => item.status === 'UPLOADING').length
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
      const done = finishedUploadStatuses.has(effectiveStatus(item))
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
    approve,
    attachSelected,
    loadEvidenceCandidates,
    attachEvidenceCandidate,
    discard,
    uploadPc,
    effectiveStatus,
    approvable,
    files,
    uploaded,
    uploading,
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
