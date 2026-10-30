import { useEffect, useRef, useState } from 'react'

import { useI18n } from '../../../../shared/i18n'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useMissionEvidenceQueue } from '../../../mission/hooks/useMissionEvidenceQueue'
import { checklistEvidenceApi } from '../../../mission/api/checklistEvidenceApi'
import { operatorHref } from '../../routes'
import { QueueStatusPanel } from './components/QueueStatusPanel'
import type {
  EvidenceCandidate,
  MissionChecklistExecution,
} from '../../../mission/types/checklistExecution'
import { type LocalMedia } from '../../../media/api/operatorMediaApi'
import { operatorMissionMediaApi } from '../../../media/api/operatorMissionMediaApi'
import { missionApi } from '../../../mission/api/missionApi'
import {
  getActiveMissionId,
  markActiveMissionFlowStep,
  setActiveMissionId,
} from '../../api/liveMission'
import { useActiveMission } from '../../api/useActiveMission'
import { FlightStepHeader } from '../../components/common/FlightStepper'
import { uploadMediaPageMessages } from './UploadMediaPage.messages'
import { MonitoringChecklistSection } from '../../../mission/components/MonitoringChecklistSection'
import {
  MissionResultActions,
  staffResultError,
} from '../../components/common/MissionResultActions'
import './UploadMediaPage.css'
import { useMissionMonitoring } from '../../../mission/hooks/useMissionMonitoring'
import { finishedUploadStatuses } from './uploadMediaHelpers'
import { useLocalMediaList } from './useLocalMediaList'
import { useMediaWorkspace } from './useMediaWorkspace'
import { UploadMediaBar } from './components/UploadMediaBar'
import { ManagerContactNotice } from './components/ManagerContactNotice'
import { MediaToolbar } from './components/MediaToolbar'
import { MediaCard } from './components/MediaCard'
import { MediaFileTable } from './components/MediaFileTable'
import { PreviewLightbox } from './components/PreviewLightbox'

export function UploadMediaPage({
  missionId,
  mode = 'media',
}: {
  missionId?: string
  mode?: 'checklist' | 'media'
}) {
  return (
    <UploadMediaContent
      key={missionId ?? 'active'}
      missionId={missionId}
      mode={mode}
    />
  )
}

function UploadMediaContent({
  missionId: routeMissionId,
  mode,
}: {
  missionId?: string
  mode: 'checklist' | 'media'
}) {
  const { t } = useI18n(uploadMediaPageMessages)
  const [fallbackMissionId] = useState(() => getActiveMissionId())
  const missionId = routeMissionId ?? fallbackMissionId
  const activeMission = useActiveMission(missionId ?? undefined)
  const permissions = useApiQuery(
    () =>
      missionId
        ? missionApi.getPermissions(missionId)
        : Promise.reject(new Error('Select a mission first.')),
    [missionId, activeMission.data?.status],
  )
  const [items, setItems] = useState<LocalMedia[]>([])
  const [statuses, setStatuses] = useState<Record<string, string>>({})
  const [attemptNumbers, setAttemptNumbers] = useState<Record<string, number>>(
    {},
  )
  const [busyId, setBusyId] = useState<string | null>(null)
  const [batchUploading, setBatchUploading] = useState(false)
  const [checklistRevision, setChecklistRevision] = useState(0)
  const monitoring = useMissionMonitoring(missionId ?? '', checklistRevision, {
    autoRefresh: false,
  })
  const [selectedTargets, setSelectedTargets] = useState<
    Record<string, string[]>
  >({})
  const [attachFailures, setAttachFailures] = useState<Record<string, string>>(
    {},
  )
  const [preview, setPreview] = useState<LocalMedia | null>(null)
  const previewDialog = useRef<HTMLDialogElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  // Reference images (Mapillary) are stored by the backend directly, so they are already "uploaded".
  const [referenceCount, setReferenceCount] = useState(0)
  const [uploadInfo, setUploadInfo] = useState<string | null>(null)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest')
  const [filter, setFilter] = useState<'all' | 'pending' | 'uploaded'>('all')
  const [completionSubmitting, setCompletionSubmitting] = useState(false)
  const [resultError, setResultError] = useState<unknown>(null)
  const itemsRef = useRef<LocalMedia[]>([])
  const uploadedMediaIds = useRef<Record<string, string>>({})
  useEffect(() => {
    setSelectedTargets({})
    setAttachFailures({})
    setItems([])
    itemsRef.current = []
    uploadedMediaIds.current = {}
  }, [missionId])
  useEffect(() => {
    if (preview) previewDialog.current?.showModal()
  }, [preview])

  useEffect(() => {
    if (!missionId) return
    setActiveMissionId(missionId)
    markActiveMissionFlowStep(missionId, 5)
  }, [missionId])

  const { refresh } = useLocalMediaList({
    autoRefresh: true,
    missionId,
    setLoading,
    permissions,
    activeMission,
    itemsRef,
    setAttemptNumbers,
    setStatuses,
    uploadedMediaIds,
    setItems,
    setError,
    setReferenceCount,
    items,
    statuses,
    setChecklistRevision,
  })

  const {
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
  } = useMediaWorkspace({
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
  })

  const totalMedia = files.length + referenceCount
  const loadedMedia = uploaded + referenceCount
  const pendingMedia = Math.max(0, totalMedia - loadedMedia)
  const missionLabel =
    activeMission.data?.missionCode ?? missionId ?? t.openingMission

  const [backendPage, setBackendPage] = useState(0)
  const backend = useApiQuery(async () => {
    if (!missionId) return null
    return operatorMissionMediaApi.list(missionId, backendPage)
  }, [missionId, checklistRevision, backendPage])
  const queue = useMissionEvidenceQueue(
    missionId ?? '',
    permissions.data?.canUploadMedia ? transferEvidenceCandidate : undefined,
    permissions.data?.canUploadMedia ? transferEvidenceBackup : undefined,
  )
  const preparedIdentities = queue.jobs
    .map(
      (job) => `${job.payload.candidate.mediaId}:${job.payload.mediaId ?? ''}`,
    )
    .join('|')
  useEffect(() => {
    const identities = new Map(
      queue.jobs
        .filter(
          (job) =>
            job.payload.candidate.mediaId.startsWith('local:') &&
            job.payload.mediaId,
        )
        .map((job) => [
          job.payload.candidate.mediaId.slice(6),
          job.payload.mediaId!,
        ]),
    )
    identities.forEach((id, localId) => {
      uploadedMediaIds.current[localId] = id
    })
    setItems((previous) => {
      if (
        !previous.some(
          (item) =>
            identities.has(item.localMediaId) &&
            item.backendMediaId !== identities.get(item.localMediaId),
        )
      )
        return previous
      const next = previous.map((item) =>
        identities.has(item.localMediaId)
          ? { ...item, backendMediaId: identities.get(item.localMediaId) }
          : item,
      )
      itemsRef.current = next
      return next
    })
  }, [preparedIdentities, items, queue.jobs])
  const refreshRef = useRef(refreshWorkspace)
  refreshRef.current = refreshWorkspace
  const finished = queue.jobs
    .filter((job) => job.stage === 'DONE' || job.stage === 'FAILED')
    .map((job) => `${job.id}:${job.stage}`)
    .join('|')
  useEffect(() => {
    if (finished) refreshRef.current(false)
  }, [finished])
  const remoteItems = (backend.data?.items ?? [])
    .filter(
      (remote) =>
        !items.some((local) => local.backendMediaId === remote.mediaId),
    )
    .filter(
      (remote) =>
        filter === 'all' ||
        (filter === 'uploaded'
          ? finishedUploadStatuses.has(remote.status ?? 'UNKNOWN')
          : !finishedUploadStatuses.has(remote.status ?? 'UNKNOWN')),
    )
  async function attachTargets(item: LocalMedia, ids: string[]) {
    if (
      permissions.data?.canUploadMedia !== true &&
      (!item.backendMediaId ||
        !finishedUploadStatuses.has(effectiveStatus(item)))
    )
      throw new Error(t.uploadPermissionNote)
    if (
      item.localAvailable === false &&
      !finishedUploadStatuses.has(effectiveStatus(item)) &&
      effectiveStatus(item) !== 'VALIDATING'
    )
      throw new Error(t.localUnavailable)
    const candidate: EvidenceCandidate = {
      mediaId:
        item.localAvailable !== false
          ? `local:${item.localMediaId}`
          : item.backendMediaId!,
      fileName: item.fileName,
      mediaType: item.mediaType,
      contentType: item.contentType,
      sourceType: item.sourceType ?? null,
      capturedAt: item.capturedAt,
      validatedAt: null,
      status: null,
      attachable: true,
      eligibleForOperationalReadiness: false,
      eligibleForFinalApproval: false,
      ineligibilityReason: null,
      previewUrl: null,
      urlExpiresAt: null,
      alreadyAttachedExecutionIds: [],
    }
    for (const id of ids) {
      const execution = monitoring.data?.checklist.executions.find(
        (row) => row.id === id,
      )
      if (!execution) throw new Error(t.missingChecklistItem)
      await queue.add(execution, [candidate])
    }
  }
  async function detach(executionId: string, mediaId: string) {
    const row = monitoring.data?.checklist.executions.find(
      (item) => item.id === executionId,
    )
    const link = row?.evidence?.find((item) => item.mediaId === mediaId)
    if (!row || !link || !missionId) throw new Error(t.missingChecklistItem)
    await checklistEvidenceApi.detach(
      missionId,
      row.id,
      link.evidenceId,
      row.version,
    )
    await queue.forget(row.id, mediaId)
    refreshWorkspace()
  }
  const checklist = missionId ? (
    <MonitoringChecklistSection
      missionId={missionId}
      data={monitoring.data?.checklist}
      loading={monitoring.loading && !monitoring.data}
      error={monitoring.error}
      resultKnown={actions.known}
      resultStatus={monitoring.data?.result?.approvalStatus}
      resultNote={monitoring.data?.result?.reviewNote}
      canExecute={
        monitoring.data?.permissions.canExecuteMonitoringChecklist &&
        !queue.busy
      }
      canAssess={
        monitoring.data?.permissions.canInspectDevice === true && !queue.busy
      }
      canAttach={monitoring.data?.permissions.canAttachChecklistEvidence}
      canDetach={
        monitoring.data?.permissions.canDetachChecklistEvidence && !queue.busy
      }
      refresh={refreshWorkspace}
      loadEvidenceCandidates={loadEvidenceCandidates}
      attachEvidenceCandidates={async (
        selected: EvidenceCandidate[],
        row: MissionChecklistExecution,
      ) => queue.add(row, selected)}
      evidenceDetached={async (executionId: string, mediaId: string) =>
        queue.forget(executionId, mediaId)
      }
    />
  ) : null
  return (
    <div className="odm-card upload-media-page" style={{ marginBottom: 0 }}>
      <FlightStepHeader
        title={mode === 'checklist' ? t.checklistTitle : t.mediaTitle}
        missionId={missionLabel}
        idTitle={missionId ?? undefined}
        active={7}
        right={
          <span className="upload-media-device">{deviceLabel ?? '—'}</span>
        }
      />
      <div className="upload-media-body">
        <nav className="mission-evidence-nav" aria-label={t.workspaceNav}>
          <div>
            <a
              className={mode === 'checklist' ? 'is-active' : ''}
              aria-current={mode === 'checklist' ? 'page' : undefined}
              href={operatorHref({
                screen: 'checklist',
                missionId: missionId ?? undefined,
              })}
            >
              {t.checklistTitle}
            </a>
            <a
              className={mode === 'media' ? 'is-active' : ''}
              aria-current={mode === 'media' ? 'page' : undefined}
              href={operatorHref({
                screen: 'upload',
                missionId: missionId ?? undefined,
              })}
            >
              {t.mediaTitle}
            </a>
          </div>
          <a href={backRoute}>{t.backToCockpit}</a>
        </nav>
        <QueueStatusPanel
          jobs={queue.jobs}
          retry={queue.retry}
          remove={queue.remove}
          backup={queue.retryBackup}
          onRefresh={refreshWorkspace}
        />
        {missionId && (
          <MissionResultActions
            missionId={missionId}
            status={missionStatus}
            monitoring={monitoring}
            busy={completionSubmitting || isBusy || queue.busy}
            onComplete={() => void runResultAction('complete')}
            onSubmit={() => void runResultAction('submit')}
          />
        )}
        {Boolean(resultError) && (
          <p role="alert" className="upload-media-notice is-danger">
            {staffResultError(resultError)}
          </p>
        )}
        {error && (
          <p role="alert" className="upload-media-notice is-danger">
            {error}
          </p>
        )}
        {uploadInfo && <p role="status">{uploadInfo}</p>}
        {mode === 'checklist' ? (
          checklist
        ) : (
          <section className="upload-media-panel" aria-label={t.mediaTitle}>
            <p className="upload-media-help">{t.autoAttachHint}</p>
            <MediaToolbar
              items={items}
              filter={filter}
              setFilter={setFilter}
              sort={sort}
              setSort={setSort}
              view={view}
              setView={setView}
            />
            {loading && <p role="status">{t.loadingMedia}</p>}
            {Boolean(backend.error) && (
              <p role="alert">
                {t.mediaLibraryFailed}
                <button
                  type="button"
                  className="odm-btn"
                  onClick={backend.reload}
                >
                  {t.refresh}
                </button>
              </p>
            )}
            {!loading && !visibleItems.length && !remoteItems.length && (
              <p className="upload-media-empty">{t.emptyMedia}</p>
            )}
            <div
              className={`upload-media-grid${view === 'list' ? ' is-list' : ''}`}
            >
              {[
                ...visibleItems.map((item) => ({
                  item,
                  remote: undefined as string | undefined,
                })),
                ...remoteItems.map((remote) => ({
                  item: {
                    localMediaId: `backend:${remote.mediaId}`,
                    backendMediaId: remote.mediaId,
                    missionId: missionId!,
                    deviceId: remote.deviceId,
                    mediaType: remote.mediaType,
                    fileName: remote.fileName,
                    contentType: remote.contentType,
                    fileSize: remote.fileSize,
                    checksumSha256: '',
                    capturedAt: remote.capturedAt,
                    status: remote.status,
                    sourceType: remote.sourceType,
                    localAvailable: false,
                  } as LocalMedia,
                  remote: remote.downloadUrl ?? undefined,
                })),
              ].map(({ item, remote }) => (
                <MediaCard
                  key={item.localMediaId}
                  item={item}
                  remotePreviewUrl={remote}
                  setPreview={setPreview}
                  status={effectiveStatus(item)}
                  canManageMedia={
                    canManageMedia && !item.localMediaId.startsWith('backend:')
                  }
                  isBusy={isBusy || queue.busy}
                  approve={approve}
                  canApprove={approvable.includes(item)}
                  busyId={busyId}
                  canDiscard={
                    ['REVIEW_PENDING', 'UPLOAD_FAILED'].includes(item.status) ||
                    finishedUploadStatuses.has(effectiveStatus(item))
                  }
                  discard={discard}
                  monitoring={monitoring}
                  selectedTargets={selectedTargets}
                  setSelectedTargets={setSelectedTargets}
                  attachTargets={attachTargets}
                  detachTarget={
                    monitoring.data?.permissions.canDetachChecklistEvidence
                      ? detach
                      : undefined
                  }
                  attachFailures={attachFailures}
                  uploadPc={uploadPc}
                  automaticAttach
                  reviewMedia={
                    permissions.data?.canInspectDevice ||
                    permissions.data?.canSubmitMissionResult
                      ? async (mediaId) => {
                          if (!missionId) return
                          setBusyId(mediaId)
                          try {
                            await operatorMissionMediaApi.approve(
                              missionId,
                              mediaId,
                            )
                            setUploadInfo(t.evidenceApproved)
                            refreshWorkspace(false)
                          } catch (cause) {
                            setError(
                              cause instanceof Error
                                ? cause.message
                                : t.reviewFailed,
                            )
                          } finally {
                            setBusyId(null)
                          }
                        }
                      : undefined
                  }
                />
              ))}
            </div>
            {backend.data && backend.data.totalPages > 1 && (
              <div className="mission-evidence-pagination">
                <button
                  className="odm-btn"
                  disabled={backend.loading || backendPage === 0}
                  onClick={() => setBackendPage((page) => page - 1)}
                >
                  {t.previousPage}
                </button>
                <span>
                  {backendPage + 1}/{backend.data.totalPages}
                </span>
                <button
                  className="odm-btn"
                  disabled={backend.loading || backend.data.last}
                  onClick={() => setBackendPage((page) => page + 1)}
                >
                  {t.nextPage}
                </button>
              </div>
            )}
          </section>
        )}
        <details className="upload-media-table-wrap">
          <summary>{t.transferDetails}</summary>
          <UploadMediaBar
            loadedMedia={loadedMedia}
            totalMedia={totalMedia}
            pendingMedia={pendingMedia}
            uploading={uploading}
            manual={manual}
            backRoute={backRoute}
            refreshWorkspace={refreshWorkspace}
            canManageMedia={canManageMedia}
            missionId={missionId}
            isBusy={isBusy || queue.busy}
            setUploadInfo={setUploadInfo}
            approvable={approvable}
            refresh={refresh}
            referenceCount={referenceCount}
            setBatchUploading={setBatchUploading}
            approve={approve}
          />
          {canManageMedia && (
            <MediaFileTable
              files={files}
              busyId={busyId}
              isBusy={isBusy || queue.busy}
              items={items}
              approve={approve}
              effectiveStatus={effectiveStatus}
            />
          )}
        </details>
        {missionId && !canManageMedia && (
          <ManagerContactNotice
            permissions={permissions}
            inspector={inspector}
            showManagerContact={showManagerContact}
            activeMission={activeMission}
          />
        )}
      </div>
      {preview && (
        <PreviewLightbox
          previewDialog={previewDialog}
          setPreview={setPreview}
          preview={preview}
        />
      )}
    </div>
  )
}
