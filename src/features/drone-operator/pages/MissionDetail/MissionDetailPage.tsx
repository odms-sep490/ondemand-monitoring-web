import { useEffect, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import {
  EmptyState,
  LoadingState,
} from '../../../../shared/components/odm/StateView'
import { useI18n } from '../../../../shared/i18n'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { ApiError } from '../../../../shared/api/httpClient'
import { missionApi } from '../../../mission/api/missionApi'
import { useMissionMonitoring } from '../../../mission/hooks/useMissionMonitoring'
import { MonitoringChecklistSection } from '../../../mission/components/MonitoringChecklistSection'
import { operatorApi } from '../../api/operatorApi'
import { setActiveMissionId } from '../../api/liveMission'
import { operatorHref } from '../../routes'
import { RejectDialog } from './components/RejectDialog'
import { missionDetailPageMessages } from './MissionDetailPage.messages'
import { SafeStopPanel } from '../../../manager/components/common/SafeStopPanel'
import '../../../manager/components/common/planning.css'
import {
  MissionResultActions,
  missionResultActions,
  staffResultError,
} from '../../components/common/MissionResultActions'
import { isAwaitingResponse } from './missionResponse'
import { MissionDashboard } from './components/MissionDashboard'
import { useMissionDetailActions } from './useMissionDetailActions'

// ─── Main screen ─────────────────────────────────────────────────────────────

export function MissionDetailPage({ missionId }: { missionId: string }) {
  return <MissionDetailContent key={missionId} missionId={missionId} />
}

function MissionDetailContent({ missionId }: { missionId: string }) {
  const { t } = useI18n(missionDetailPageMessages)
  const query = useApiQuery(
    (signal) => operatorApi.getMission(missionId, signal),
    [missionId],
  )
  const [showReject, setShowReject] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [resultSubmitting, setResultSubmitting] = useState(false)
  const [mediaRevision, setMediaRevision] = useState(0)
  const monitoring = useMissionMonitoring(missionId, undefined, {
    autoRefresh: false,
  })
  const awaitingResponse = Boolean(query.data && isAwaitingResponse(query.data))
  // Accept/reject only depends on assignment permissions, not post-flight data.
  const responsePermissions = useApiQuery(async () => {
    if (!awaitingResponse) return undefined
    const permissions = await missionApi.getPermissions(missionId)
    if (!permissions || typeof permissions.canRespond !== 'boolean') {
      throw new ApiError('Mission permissions unavailable', {
        code: 'MISSION_PERMISSIONS_UNAVAILABLE',
        status: 503,
        method: 'GET',
        path: `/api/missions/${missionId}/permissions`,
      })
    }
    return permissions
  }, [missionId, awaitingResponse])
  const resultApprovalStatus = monitoring.data?.result?.approvalStatus ?? null
  const monitoringKnown =
    !monitoring.loading && !monitoring.error && Boolean(monitoring.data)
  const actions = missionResultActions(
    missionId,
    query.data?.backendStatus ?? query.data?.status,
    monitoring,
  )
  const [actionError, setActionError] = useState<unknown>(null)

  useEffect(() => {
    setActiveMissionId(missionId)
  }, [missionId])

  useEffect(() => {
    const timer = window.setInterval(() => {
      query.reload()
      monitoring.reload()
      if (awaitingResponse) responsePermissions.reload()
    }, 5_000)
    return () => window.clearInterval(timer)
  }, [
    missionId,
    monitoring.reload,
    query.reload,
    responsePermissions.reload,
    awaitingResponse,
  ])

  if (query.loading && !query.data) return <LoadingState />
  if (query.error || !query.data || query.data.id !== missionId) {
    return (
      <EmptyState
        title={t.errorTitle}
        description={t.errorDescription}
        action={
          <a
            className="odm-btn odm-btn-p"
            href={operatorHref({ screen: 'missions' })}
          >
            {t.backToList}
          </a>
        }
      />
    )
  }

  const mission = query.data
  const {
    refreshWorkspace,
    handleAccept,
    handleStartWorkflow,
    handleReject,
    handleCompleteMission,
    handleSubmitResult,
  } = useMissionDetailActions({
    setActionError,
    setMediaRevision,
    query,
    monitoring,
    setSubmitting,
    mission,
    setShowReject,
    actions,
    submitting,
    resultSubmitting,
    setResultSubmitting,
  })

  return (
    <>
      <MissionDashboard
        mission={mission}
        submitting={submitting}
        actionError={
          actionError
            ? typeof actionError === 'string'
              ? actionError
              : staffResultError(actionError)
            : null
        }
        access={
          awaitingResponse
            ? !responsePermissions.loading && !responsePermissions.error
              ? responsePermissions.data
              : undefined
            : actions.known
              ? monitoring.data?.permissions
              : undefined
        }
        responseAccessLoading={responsePermissions.loading}
        responseAccessError={Boolean(responsePermissions.error)}
        resultActions={
          <MissionResultActions
            missionId={missionId}
            status={mission.backendStatus ?? mission.status}
            monitoring={monitoring}
            busy={submitting || resultSubmitting || query.loading}
            showComplete={false}
            showSubmit={false}
            onComplete={() => void handleCompleteMission()}
            onSubmit={() => void handleSubmitResult()}
          />
        }
        monitoringSection={
          <MonitoringChecklistSection
            missionId={mission.id}
            data={monitoring.data?.checklist}
            loading={monitoring.loading}
            error={monitoring.error}
            canExecute={
              monitoring.data?.permissions.canExecuteMonitoringChecklist
            }
            canAssess={monitoring.data?.permissions.canInspectDevice === true}
            canAttach={monitoring.data?.permissions.canAttachChecklistEvidence}
            canDetach={monitoring.data?.permissions.canDetachChecklistEvidence}
            resultStatus={resultApprovalStatus}
            resultNote={monitoring.data?.result?.reviewNote}
            resultKnown={monitoringKnown}
            refresh={refreshWorkspace}
            preview={isAwaitingResponse(mission)}
          />
        }
        resultApprovalStatus={resultApprovalStatus}
        refreshWorkspace={refreshWorkspace}
        mediaRevision={mediaRevision}
        onAccept={handleAccept}
        onStartWorkflow={handleStartWorkflow}
        onOpenReject={() => setShowReject(true)}
      />

      {!isAwaitingResponse(mission) &&
        actions.known &&
        monitoring.data?.permissions.canPrepareSafeStopPostflight === true && (
          <div className="odm-card">
            <p>
              Mission đã xác nhận an toàn nhưng chưa hoàn tất kiểm tra sau bay.
              Quyền bay vẫn bị khóa.
            </p>
            <button
              type="button"
              className="odm-btn"
              disabled={submitting}
              onClick={async () => {
                setSubmitting(true)
                setActionError(null)
                try {
                  await missionApi.startPostflight(mission.id)
                } catch (error) {
                  setActionError(error)
                } finally {
                  refreshWorkspace(false)
                  setSubmitting(false)
                }
              }}
            >
              Chuẩn bị kiểm tra sau bay
            </button>
          </div>
        )}
      <SafeStopPanel
        key={mission.id}
        missionId={mission.id}
        onChanged={() => {
          query.reload()
          monitoring.reload()
        }}
      />

      {showReject ? (
        <RejectDialog
          missionId={mission.id}
          submitting={submitting}
          onCancel={() => setShowReject(false)}
          onConfirm={handleReject}
        />
      ) : null}
    </>
  )
}
