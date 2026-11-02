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
import { CancelMissionDialog } from './components/CancelMissionDialog'
import { missionDetailPageMessages } from './MissionDetailPage.messages'
import {
  MissionResultActions,
  missionResultActions,
  staffResultError,
} from '../../components/common/MissionResultActions'
import { isAwaitingResponse } from './missionResponse'
import { MissionDashboard } from './components/MissionDashboard'
import { useMissionDetailActions } from './useMissionDetailActions'
import { fetchLatestWeatherCheck } from './checkData'
import type { WeatherPreflightStatus } from './types'

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
  const [showCancelMission, setShowCancelMission] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [resultSubmitting, setResultSubmitting] = useState(false)
  const [mediaRevision, setMediaRevision] = useState(0)
  const [weatherStatus, setWeatherStatus] =
    useState<WeatherPreflightStatus | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(true)
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
  const monitoringKnown = Boolean(monitoring.data)
  const missionStatus = query.data?.backendStatus ?? query.data?.status
  const completionConfirmed =
    Boolean(query.data?.completedAt) ||
    ['AWAITING_REVIEW', 'PENDING_REVIEW', 'COMPLETED'].includes(
      missionStatus ?? '',
    )
  const actions = missionResultActions(
    missionId,
    missionStatus,
    monitoring,
  )
  const [actionError, setActionError] = useState<unknown>(null)

  useEffect(() => {
    setActiveMissionId(missionId)
  }, [missionId])

  useEffect(() => {
    const controller = new AbortController()
    setWeatherLoading(true)
    fetchLatestWeatherCheck(missionId, controller.signal)
      .then(setWeatherStatus)
      .catch(() => setWeatherStatus(null))
      .finally(() => {
        if (!controller.signal.aborted) setWeatherLoading(false)
      })
    return () => controller.abort()
  }, [missionId])

  useEffect(() => {
    const refreshMission = () => {
      if (!document.hidden) query.reload()
    }
    const refreshSupportingData = () => {
      if (document.hidden) return
      monitoring.reload()
      if (awaitingResponse) responsePermissions.reload()
    }
    const missionTimer = window.setInterval(refreshMission, 15_000)
    const supportingTimer = window.setInterval(refreshSupportingData, 30_000)
    window.addEventListener('focus', refreshMission)
    return () => {
      window.clearInterval(missionTimer)
      window.clearInterval(supportingTimer)
      window.removeEventListener('focus', refreshMission)
    }
  }, [
    missionId,
    monitoring.reload,
    query.reload,
    responsePermissions.reload,
    awaitingResponse,
  ])

  if (query.loading && !query.data) return <LoadingState />
  if (!query.data || query.data.id !== missionId) {
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
  const checklistPreview = isAwaitingResponse(mission)
  const {
    refreshWorkspace,
    handleAccept,
    handleStartWorkflow,
    handleAcceptWeather,
    handleCancelMission,
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
    weatherStatus,
    setWeatherStatus,
  })

  return (
    <>
      <MissionDashboard
        mission={mission}
        submitting={submitting}
        weatherStatus={weatherStatus}
        weatherLoading={weatherLoading}
        actionError={
          actionError
            ? typeof actionError === 'string'
              ? actionError
              : staffResultError(actionError)
            : null
        }
        access={
          awaitingResponse
            ? responsePermissions.data
            : actions.known
              ? monitoring.data?.permissions
              : undefined
        }
        responseAccessLoading={
          !responsePermissions.data && responsePermissions.loading
        }
        responseAccessError={
          !responsePermissions.data && Boolean(responsePermissions.error)
        }
        resultActions={
          <MissionResultActions
            missionId={missionId}
            status={mission.backendStatus ?? mission.status}
            monitoring={monitoring}
            busy={submitting || resultSubmitting || query.loading}
            showComplete={!completionConfirmed}
            showSubmit={actions.canSubmit}
            onComplete={() => void handleCompleteMission()}
            onSubmit={() => void handleSubmitResult()}
          />
        }
        monitoringSection={
          <MonitoringChecklistSection
            missionId={mission.id}
            data={monitoring.data?.checklist}
            loading={monitoring.loading && !monitoring.data}
            error={monitoring.data ? undefined : monitoring.error}
            canExecute={
              monitoring.data?.permissions.canExecuteMonitoringChecklist
            }
            canAssess={
              monitoring.data?.permissions.canAssessMonitoringChecklist === true
            }
            canAttach={monitoring.data?.permissions.canAttachChecklistEvidence}
            canDetach={monitoring.data?.permissions.canDetachChecklistEvidence}
            resultStatus={resultApprovalStatus}
            resultNote={monitoring.data?.result?.reviewNote}
            resultKnown={monitoringKnown}
            refresh={refreshWorkspace}
            compact={!checklistPreview}
            compactTitle={checklistPreview ? undefined : 'Đánh giá checklist'}
            assessmentOnly={!checklistPreview}
            preview={checklistPreview}
          />
        }
        resultApprovalStatus={resultApprovalStatus}
        refreshWorkspace={refreshWorkspace}
        mediaRevision={mediaRevision}
        onAccept={handleAccept}
        onStartWorkflow={handleStartWorkflow}
        onAcceptWeather={handleAcceptWeather}
        onCancelMission={() => setShowCancelMission(true)}
        onOpenReject={() => setShowReject(true)}
      />

      {showCancelMission && (
        <CancelMissionDialog
          missionCode={mission.missionCode ?? mission.id}
          busy={submitting}
          onClose={() => setShowCancelMission(false)}
          onConfirm={handleCancelMission}
        />
      )}

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
