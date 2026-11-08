import { useCallback, useEffect, useMemo } from 'react'
import type { Mission } from '../../../types/omss'
import { useI18n } from '../../../../../shared/i18n'
import { useMissionMonitoring } from '../../../../mission/hooks/useMissionMonitoring'
import { MonitoringChecklistSection } from '../../../../mission/components/MonitoringChecklistSection'
import { useMissionEvidenceQueue } from '../../../../mission/hooks/useMissionEvidenceQueue'
import { checklistEvidenceApi } from '../../../../mission/api/checklistEvidenceApi'
import { operatorMediaApi } from '../../../../media/api/operatorMediaApi'
import type {
  EvidenceCandidate,
  EvidenceMediaStatus,
} from '../../../../mission/types/checklistExecution'
import { operatorHref } from '../../../routes'
import { inFlightControlMessages } from './InFlightControl.messages'
import { GlassPanel } from './GlassPanel'
import './MissionChecklistPanel.css'

const evidenceUploadStatus = (
  status: string,
): EvidenceMediaStatus => {
  if (status === 'REVIEW_PENDING') return 'UPLOAD_PENDING'
  if (status === 'UPLOAD_FAILED') return 'RETRY_REQUIRED'
  return status as EvidenceMediaStatus
}

const evidenceQueueStageLabel: Record<string, string> = {
  QUEUED: 'Đang chờ tải lên',
  PREPARING: 'Đang chuẩn bị media',
  TRANSFERRING: 'Đang tải media lên',
  ATTACHING: 'Đang gắn vào checklist',
  VALIDATING: 'Đang xác thực media',
}

function evidenceQueueErrorMessage(errorCode?: string) {
  if (errorCode === 'MANUAL_UPLOAD_REQUIRED')
    return 'Media cần tải lên thủ công trước khi gắn.'
  if (errorCode === 'LOCAL_MEDIA_UNAVAILABLE')
    return 'Không tìm thấy tệp gốc trên thiết bị.'
  if (errorCode === 'MEDIA_UPLOAD_NOT_ALLOWED')
    return 'Tài khoản hiện không có quyền tải media lên.'
  return 'Không thể tải hoặc gắn media. Hãy thử lại.'
}

function formatScheduledAt(value: string | undefined, locale: string) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date)
}

export function MissionChecklistPanel({
  mission,
  progress,
}: {
  mission: Mission
  progress: number
}) {
  const { t, locale } = useI18n(inFlightControlMessages)
  const missionId = mission.backendId ?? mission.id
  const missionAliases = useMemo(
    () => (mission.id !== missionId ? [mission.id] : []),
    [mission.id, missionId],
  )
  const monitoring = useMissionMonitoring(missionId)
  const canUploadMedia =
    monitoring.data?.permissions.canUploadMedia === true
  const transferLocalEvidence = useCallback(
    async (
      candidate: EvidenceCandidate,
      onPrepared: (mediaId: string) => Promise<void>,
    ) => {
      if (!canUploadMedia) throw new Error('MEDIA_UPLOAD_NOT_ALLOWED')
      const localId = candidate.mediaId.startsWith('local:')
        ? candidate.mediaId.slice('local:'.length)
        : undefined
      if (!localId) throw new Error('LOCAL_MEDIA_UNAVAILABLE')
      const media = await operatorMediaApi.list(missionId, missionAliases)
      const item = media.find((entry) => entry.localMediaId === localId)
      if (!item || item.localAvailable === false)
        throw new Error('LOCAL_MEDIA_UNAVAILABLE')
      await operatorMediaApi.upload({ ...item, missionId }, false, onPrepared)
    },
    [canUploadMedia, missionAliases, missionId],
  )
  const evidenceQueue = useMissionEvidenceQueue(
    missionId,
    canUploadMedia ? transferLocalEvidence : undefined,
  )
  const loadEvidenceCandidates = useCallback(
    async (page: number): Promise<EvidenceCandidate[]> => {
      const [uploadedCandidates, localMedia] = await Promise.all([
        checklistEvidenceApi.candidates(missionId, page),
        page === 0
          ? operatorMediaApi
              .list(missionId, missionAliases)
              .catch(() => [])
          : Promise.resolve([]),
      ])
      if (page > 0) return uploadedCandidates

      const uploadedIds = new Set(
        uploadedCandidates.map((candidate) => candidate.mediaId),
      )
      const localCandidates = localMedia
        .filter(
          (media) =>
            !media.backendMediaId || !uploadedIds.has(media.backendMediaId),
        )
        .sort(
          (a, b) =>
            new Date(b.capturedAt).getTime() -
            new Date(a.capturedAt).getTime(),
        )
        .map((media): EvidenceCandidate => {
          const sourceEligible =
            media.sourceType === 'DRONE_CAMERA' ||
            media.sourceType === 'SATELLITE_SNAPSHOT' ||
            media.sourceType === 'MANUAL_UPLOAD'
          const attachable =
            canUploadMedia &&
            sourceEligible &&
            media.status !== 'REJECTED' &&
            media.localAvailable !== false
          const backendCandidate = uploadedCandidates.find(
            (candidate) => candidate.mediaId === media.backendMediaId,
          )
          const alreadyAttachedExecutionIds =
            backendCandidate?.alreadyAttachedExecutionIds ??
            (monitoring.data?.checklist.executions ?? [])
              .filter((execution) =>
                execution.evidence?.some(
                  (evidence) => evidence.mediaId === media.backendMediaId,
                ),
              )
              .map((execution) => execution.id)
          return {
            mediaId: `local:${media.localMediaId}`,
            fileName: media.fileName,
            mediaType: media.mediaType,
            contentType: media.contentType,
            status: evidenceUploadStatus(media.status),
            sourceType: media.sourceType ?? null,
            capturedAt: media.capturedAt,
            validatedAt: null,
            attachable,
            eligibleForOperationalReadiness: false,
            eligibleForFinalApproval: false,
            ineligibilityReason:
              media.status === 'REJECTED'
                ? 'MEDIA_REJECTED'
                : attachable
                  ? null
                  : 'EVIDENCE_SOURCE_NOT_ELIGIBLE',
            previewUrl:
              media.localAvailable === false
                ? null
                : operatorMediaApi.previewUrl(media.localMediaId),
            urlExpiresAt: null,
            alreadyAttachedExecutionIds,
          }
        })
      return [...localCandidates, ...uploadedCandidates]
    },
    [canUploadMedia, missionAliases, missionId, monitoring.data?.checklist],
  )
  const finishedEvidenceJobs = evidenceQueue.jobs
    .filter((job) => job.stage === 'DONE' || job.stage === 'FAILED')
    .map((job) => `${job.id}:${job.stage}`)
    .join('|')
  useEffect(() => {
    if (finishedEvidenceJobs) void monitoring.reload()
  }, [finishedEvidenceJobs, monitoring.reload])
  const visibleEvidenceJobs = evidenceQueue.jobs.filter(
    (job) => job.stage !== 'DONE',
  )
  const values = [
    [t.missionPanel.mission, mission.id],
    [t.missionPanel.service, mission.serviceLabel],
    [t.missionPanel.location, mission.location],
    [t.missionPanel.scheduled, formatScheduledAt(mission.scheduledAt, locale)],
    [t.missionPanel.duration, t.missionPanel.minutes(mission.estimatedMinutes)],
    [t.missionPanel.maxAltitude, `${mission.maxAltitudeM.toFixed(0)} m`],
  ] as const

  return (
    <aside
      className="mission-control-side mission-checklist-side"
      aria-label={t.missionPanel.title}
      style={{
        gridColumn: 3,
        gridRow: '1 / 3',
        minWidth: 0,
        minHeight: 0,
        height: '100%',
        maxHeight: '100%',
        overflowX: 'hidden',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        paddingRight: 4,
        scrollbarGutter: 'stable',
      }}
    >
      <GlassPanel style={{ padding: 10, flexShrink: 0 }}>
        <h2 style={{ margin: '0 0 10px', color: '#e5edf8', fontSize: 14, fontWeight: 850 }}>
          {mission.title || mission.orderTitle || mission.id}
        </h2>
        <dl style={{ display: 'grid', gap: 5, margin: 0 }}>
          {values.map(([label, value]) => (
            <div
              key={label}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(74px, auto) minmax(0, 1fr)',
                gap: 10,
                alignItems: 'start',
                fontSize: 11,
              }}
            >
              <dt style={{ color: '#94a3b8' }}>{label}</dt>
              <dd
                style={{
                  minWidth: 0,
                  margin: 0,
                  color: '#e5edf8',
                  fontWeight: 750,
                  overflowWrap: 'anywhere',
                  textAlign: 'right',
                }}
              >
                {value || '—'}
              </dd>
            </div>
          ))}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              color: '#94a3b8',
              fontSize: 12,
            }}
          >
            <dt>{t.missionPanel.progress}</dt>
            <dd style={{ margin: 0, color: '#4ade80', fontWeight: 850 }}>
              {progress.toFixed(1)}%
            </dd>
          </div>
        </dl>
        {mission.notes && (
          <p
            style={{
              margin: '10px 0 0',
              color: '#cbd5e1',
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            {mission.notes}
          </p>
        )}
      </GlassPanel>

      <div
        className="mission-checklist-surface"
      >
        <MonitoringChecklistSection
          missionId={missionId}
          data={monitoring.data?.checklist}
          loading={monitoring.loading}
          error={monitoring.error}
          canExecute={
            monitoring.data?.permissions.canExecuteMonitoringChecklist === true
          }
          canAttach={
            monitoring.data?.permissions.canAttachChecklistEvidence === true
          }
          resultStatus={monitoring.data?.result?.approvalStatus ?? null}
          resultNote={monitoring.data?.result?.reviewNote}
          resultKnown={!monitoring.loading && !monitoring.error}
          refresh={monitoring.reload}
          loadEvidenceCandidates={loadEvidenceCandidates}
          attachEvidenceCandidates={(items, execution) =>
            evidenceQueue.addAndWait(execution, items)
          }
          compact
          compactTitle={t.missionPanel.checklist}
          hideImplementationHints
          hideAssessment
          completionOnly
        />
        {visibleEvidenceJobs.length > 0 && (
          <div className="mission-checklist-upload-status" aria-live="polite">
            {visibleEvidenceJobs.map((job) => (
              <div
                key={job.id}
                className={
                  job.stage === 'FAILED' ? 'is-error' : 'is-progress'
                }
                role={job.stage === 'FAILED' ? 'alert' : 'status'}
              >
                <span>
                  <strong>{job.payload.candidate.fileName}</strong>
                  {job.stage === 'FAILED'
                    ? ` · ${evidenceQueueErrorMessage(job.errorCode)}`
                    : ` · ${evidenceQueueStageLabel[job.stage] ?? 'Đang xử lý'}`}
                </span>
                {job.stage === 'FAILED' && (
                  <>
                    <button
                      type="button"
                      className="odm-btn odm-btn-sm"
                      onClick={() =>
                        void evidenceQueue.retry(job.id).catch(() =>
                          monitoring.reload(),
                        )
                      }
                    >
                      Thử lại
                    </button>
                    {job.errorCode === 'MANUAL_UPLOAD_REQUIRED' && (
                      <a
                        href={operatorHref({ screen: 'upload', missionId })}
                      >
                        Mở thư viện media
                      </a>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}
