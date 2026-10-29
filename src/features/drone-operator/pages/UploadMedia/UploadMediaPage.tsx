import { useEffect, useRef, useState } from 'react'

import { useI18n } from '../../../../shared/i18n'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { type LocalMedia } from '../../../media/api/operatorMediaApi'
import { operatorMissionMediaApi } from '../../../media/api/operatorMissionMediaApi'
import { MissionUploadedMedia } from '../../../media/components/MissionUploadedMedia'
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
import { successfullyUploadedStatuses } from './uploadMediaHelpers'
import { useLocalMediaList } from './useLocalMediaList'
import { useMediaWorkspace } from './useMediaWorkspace'
import { UploadMediaBar } from './components/UploadMediaBar'
import { ManagerContactNotice } from './components/ManagerContactNotice'
import { MediaToolbar } from './components/MediaToolbar'
import { MediaCard } from './components/MediaCard'
import { MediaFileTable } from './components/MediaFileTable'
import { PreviewLightbox } from './components/PreviewLightbox'

export function UploadMediaPage({ missionId }: { missionId?: string }) {
  return (
    <UploadMediaContent key={missionId ?? 'active'} missionId={missionId} />
  )
}

function UploadMediaContent({
  missionId: routeMissionId,
}: {
  missionId?: string
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
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null)
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
    setSelectedMediaId(null)
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

  return (
    <div className="odm-card upload-media-page" style={{ marginBottom: 0 }}>
      <FlightStepHeader
        title={t.stepTitle}
        missionId={missionLabel}
        idTitle={missionId ?? undefined}
        active={7}
        right={
          <span className="upload-media-device">{deviceLabel ?? '—'}</span>
        }
      />
      <div className="upload-media-body">
        <div className="upload-media-stack">
          <UploadMediaBar
            loadedMedia={loadedMedia}
            totalMedia={totalMedia}
            pendingMedia={pendingMedia}
            uploading={uploading}
            validating={validating}
            manual={manual}
            backRoute={backRoute}
            refreshWorkspace={refreshWorkspace}
            canManageMedia={canManageMedia}
            missionId={missionId}
            isBusy={isBusy}
            setUploadInfo={setUploadInfo}
            approvable={approvable}
            refresh={refresh}
            referenceCount={referenceCount}
            setBatchUploading={setBatchUploading}
            approve={approve}
          />
          {!missionId && !loading && <p role="alert">{t.restoringMission}</p>}
          {missionId && (
            <MissionResultActions
              missionId={missionId}
              status={missionStatus}
              monitoring={monitoring}
              busy={completionSubmitting || isBusy}
              onComplete={() => void runResultAction('complete')}
              onSubmit={() => void runResultAction('submit')}
            />
          )}
          {resultError ? (
            <p role="alert" className="upload-media-notice is-danger">
              {staffResultError(resultError)}
            </p>
          ) : null}
          {uploadInfo && (
            <p role="status" className="upload-media-notice is-success">
              {uploadInfo}
            </p>
          )}
          {error && (
            <p role="alert" className="upload-media-notice is-danger">
              {error}
            </p>
          )}
          {missionId && !canManageMedia && (
            <ManagerContactNotice
              permissions={permissions}
              inspector={inspector}
              showManagerContact={showManagerContact}
              activeMission={activeMission}
            />
          )}
          <div className="upload-media-workspace">
            <div className="upload-media-files">
              <section className="upload-media-panel" aria-label={t.mediaList}>
                <MediaToolbar
                  items={items}
                  filter={filter}
                  setFilter={setFilter}
                  sort={sort}
                  setSort={setSort}
                  view={view}
                  setView={setView}
                />
                {loading && items.length === 0 && (
                  <div
                    className="upload-media-loading"
                    role="status"
                    aria-label={t.loadingMedia}
                  >
                    <span className="upload-media-sr">{t.loadingMedia}</span>
                    <span aria-hidden="true" />
                    <span aria-hidden="true" />
                  </div>
                )}
                {!loading &&
                  !error &&
                  visibleItems.length === 0 &&
                  (items.length === 0 ? (
                    <div className="upload-media-empty" role="status">
                      <span
                        className="upload-media-empty-icon"
                        aria-hidden="true"
                      >
                        ▧
                      </span>
                      <strong>{t.emptyMedia}</strong>
                      <p>{t.emptyMediaHelp}</p>
                    </div>
                  ) : (
                    <div
                      className="upload-media-empty is-filtered"
                      role="status"
                    >
                      <p>{t.emptyFilteredMedia}</p>
                      <button
                        type="button"
                        className="odm-btn"
                        onClick={() => setFilter('all')}
                      >
                        {t.showAllMedia}
                      </button>
                    </div>
                  ))}
                {visibleItems.length > 0 && (
                  <div
                    className={`upload-media-grid${view === 'list' ? ' is-list' : ''}${view === 'grid' && visibleItems.length === 1 ? ' has-single-item' : ''}`}
                  >
                    {visibleItems.map((item) => {
                      const status = effectiveStatus(item)
                      const canApprove = approvable.includes(item)
                      const targetCount =
                        selectedTargets[item.localMediaId]?.length ?? 0
                      const canDiscard =
                        ['REVIEW_PENDING', 'UPLOAD_FAILED'].includes(
                          item.status,
                        ) || successfullyUploadedStatuses.has(status)
                      return (
                        <MediaCard
                          key={item.localMediaId}
                          item={item}
                          onOpenPreview={(selectedItem) => {
                            setSelectedMediaId(selectedItem.localMediaId)
                            setPreview(selectedItem)
                          }}
                          isSelected={selectedMediaId === item.localMediaId}
                          status={status}
                          canManageMedia={canManageMedia}
                          isBusy={isBusy}
                          approve={approve}
                          canApprove={canApprove}
                          busyId={busyId}
                          canDiscard={canDiscard}
                          discard={discard}
                          monitoring={monitoring}
                          targetCount={targetCount}
                          selectedTargets={selectedTargets}
                          setSelectedTargets={setSelectedTargets}
                          setBusyId={setBusyId}
                          attachSelected={attachSelected}
                          attachFailures={attachFailures}
                          uploadPc={uploadPc}
                        />
                      )
                    })}
                  </div>
                )}
              </section>
              {canManageMedia ? (
                <MediaFileTable
                  files={files}
                  busyId={busyId}
                  isBusy={isBusy}
                  items={items}
                  approve={approve}
                  effectiveStatus={effectiveStatus}
                />
              ) : null}
              {missionId ? (
                <div className="upload-media-uploaded">
                  <MissionUploadedMedia
                    missionId={missionId}
                    missionStatus={missionStatus}
                    approveMedia={
                      permissions.data?.canInspectDevice === true
                        ? (mediaId) =>
                            operatorMissionMediaApi.approve(missionId, mediaId)
                        : undefined
                    }
                    onChanged={refreshWorkspace}
                    refreshKey={checklistRevision}
                  />
                </div>
              ) : null}
            </div>
            {missionId && (
              <MonitoringChecklistSection
                key={missionId}
                missionId={missionId}
                data={monitoring.data?.checklist}
                loading={monitoring.loading && !monitoring.data}
                error={monitoring.error}
                resultKnown={actions.known}
                resultStatus={monitoring.data?.result?.approvalStatus}
                resultNote={monitoring.data?.result?.reviewNote}
                canExecute={
                  monitoring.data?.permissions.canExecuteMonitoringChecklist
                }
                canAssess={
                  monitoring.data?.permissions.canInspectDevice === true
                }
                canAttach={
                  monitoring.data?.permissions.canAttachChecklistEvidence
                }
                canDetach={
                  monitoring.data?.permissions.canDetachChecklistEvidence
                }
                refresh={refreshWorkspace}
                compact
                loadEvidenceCandidates={loadEvidenceCandidates}
                attachEvidenceCandidate={attachEvidenceCandidate}
              />
            )}
          </div>
        </div>
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
