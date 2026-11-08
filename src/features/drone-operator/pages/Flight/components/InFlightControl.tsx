import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Drone, Mission } from '../../../types/omss'
import { getLanguage, useI18n } from '../../../../../shared/i18n'
import { useMissionMonitoring } from '../../../../mission/hooks/useMissionMonitoring'
import { inFlightControlMessages } from './InFlightControl.messages'
import './SatelliteFlightMap.css'
import { type FlightCommand, type ControlStatus } from '../inFlightTypes'
import { controlBaseUrl } from '../inFlightConstants'
import {
  useRestrictedZones,
  useRestrictedGpsZones,
} from '../useRestrictedZones'
import { AirPressurePanel } from './AirPressurePanel'
import { LidarRadarOverlay } from './LidarRadarOverlay'
import { FlightControls } from './FlightControls'
import { usePreflightReadyStorage } from '../usePreflightReady'
import { useElapsedClock } from '../useElapsedClock'
import { useControlStatus } from '../useControlStatus'
import { useFlightCommand } from '../useFlightCommand'
import { useCockpitAutomation } from '../useCockpitAutomation'
import { useGeofence } from '../useGeofence'
import { useFlightTelemetry } from '../useFlightTelemetry'
import { useMissionActions } from '../useMissionActions'
import { MissionControlHeader } from './MissionControlHeader'
import { MissionControlSide } from './MissionControlSide'
import { PreflightRequiredNotice } from './PreflightRequiredNotice'
import { MissionControlFooter } from './MissionControlFooter'
import { GpsCockpitView } from './GpsCockpitView'
import { MissionControlCamera } from './MissionControlCamera'
import { isConstructionChecklistMission } from '../planHelpers'
import { MissionChecklistPanel } from './MissionChecklistPanel'
import { MissionCapturedMediaPanel } from './MissionCapturedMediaPanel'

interface Props {
  normalFlightAllowed?: boolean
  mission: Mission
  drone: Drone
  onRTB: () => void
  onEmergency: () => void
  autoStartPlan: boolean
  onAutoStartPlanConsumed: () => void
  onPreflightReady?: () => Promise<void>
  onReviewMedia?: () => void
  onStartFlight?: () => Promise<void>
  onFailureRequested?: (reason: string, wasAirborne: boolean) => Promise<void>
  onFailureLanded?: () => void
}

export default function InFlightControl({
  normalFlightAllowed = false,
  mission,
  drone,
  onRTB,
  onEmergency,
  autoStartPlan,
  onAutoStartPlanConsumed,
  onPreflightReady,
  onReviewMedia,
  onStartFlight,
  onFailureRequested,
  onFailureLanded,
}: Props) {
  const { t } = useI18n(inFlightControlMessages)
  const preflightStorageKey = `omss.droneOperator.preflightReady.${mission.id}.${drone.id}`
  const requiresBackendPreflight = Boolean(onPreflightReady)
  const [elapsed, setElapsed] = useState(5)
  const [progress, setProgress] = useState(18.2)
  const [isOnline, setIsOnline] = useState(false)
  const [lastCommand, setLastCommand] = useState(t.status.waitingController)
  const [busyCommand, setBusyCommand] = useState<FlightCommand | null>(null)
  const [referenceBusy, setReferenceBusy] = useState(false)
  const referenceBusyRef = useRef(false)
  const [finishFlightBusy, setFinishFlightBusy] = useState(false)
  const [missionFailureRequested, setMissionFailureRequested] = useState(
    Boolean(mission.failureRequestedAt),
  )
  const [failureRequestBusy, setFailureRequestBusy] = useState(false)
  const [startFlightBusy, setStartFlightBusy] = useState(false)
  const [streamRevision, setStreamRevision] = useState(0)
  const [controlStatus, setControlStatus] = useState<ControlStatus | null>(null)
  const [moreOpen, setMoreOpen] = useState(false)
  const [lidarDetailsOpen, setLidarDetailsOpen] = useState(false)
  const [missionPanelOpen, setMissionPanelOpen] = useState(false)
  const [mediaPanelOpen, setMediaPanelOpen] = useState(false)
  const cameraDefaultAppliedRef = useRef(false)
  const [preflightReady, setPreflightReady] = useState(() => {
    if (requiresBackendPreflight) return false
    try {
      return window.localStorage.getItem(preflightStorageKey) === 'true'
    } catch {
      return false
    }
  })
  const restrictedZones = useRestrictedZones()
  const restrictedGpsZones = useRestrictedGpsZones()
  const missionId = mission.backendId ?? mission.id
  useEffect(() => {
    if (mission.failureRequestedAt) setMissionFailureRequested(true)
  }, [mission.failureRequestedAt])
  const completionMonitoring = useMissionMonitoring(missionId)
  const completionChecklist = completionMonitoring.data?.checklist
  const hasAssignedChecklist =
    (completionChecklist?.executions.length ?? 0) > 0
  const canFinishFlight =
    !missionFailureRequested &&
    !completionMonitoring.loading &&
    !completionMonitoring.error &&
    hasAssignedChecklist &&
    completionChecklist?.readyForSubmission === true
  const finishFlightBlockedReason = missionFailureRequested
    ? t.status.failurePending
    : !hasAssignedChecklist
    ? 'Phải gắn checklist trước khi hoàn thành chuyến bay.'
    : completionMonitoring.loading
      ? 'Đang kiểm tra trạng thái checklist và evidence.'
      : completionMonitoring.error
        ? 'Không thể xác minh checklist. Hãy tải lại và thử lại.'
        : 'Phải hoàn thành từng mục và tải đủ ảnh evidence bắt buộc.'

  const thermalEnabled = controlStatus?.thermalEnabled === true
  const streamUrl = useMemo(
    () =>
      `${controlBaseUrl}/${thermalEnabled ? 'thermal-stream.mjpg' : 'stream.mjpg'}?viewer=operator&v=${streamRevision}`,
    [streamRevision, thermalEnabled],
  )
  const remaining = Math.max(0, mission.estimatedMinutes * 60 - elapsed)
  const {
    geofenceStatus,
    geofenceAlertActive,
    geofenceTone,
    geofenceMessage,
    footerStatusColor,
    footerStatusDot,
  } = useGeofence({ controlStatus, restrictedZones })

  usePreflightReadyStorage({
    requiresBackendPreflight,
    setPreflightReady,
    preflightStorageKey,
  })

  useElapsedClock({ setElapsed, setProgress })

  useControlStatus({ setControlStatus, setIsOnline, setStreamRevision })

  const { sendCommand } = useFlightCommand({
    normalFlightAllowed,
    setLastCommand,
    preflightReady,
    mission,
    controlStatus,
    restrictedGpsZones,
    setBusyCommand,
    drone,
    setIsOnline,
    onRTB,
    onEmergency,
  })

  useCockpitAutomation({
    preflightReady,
    cameraDefaultAppliedRef,
    sendCommand,
    autoStartPlan,
    setLastCommand,
    onAutoStartPlanConsumed,
    mission,
  })

  const {
    cameraTelemetry,
    telemetryBattery,
    batteryDisplay,
    batteryState,
    showBatteryWarning,
    thermalRows,
  } = useFlightTelemetry({ controlStatus })
  const isConstructionChecklist = isConstructionChecklistMission(
    mission.serviceLabel,
  )
  const autoPlan = controlStatus?.autoPlan
  const autoPlanStatus = autoPlan?.status?.toUpperCase()
  const autoPlanProgress =
    autoPlan?.total && autoPlan.total > 0
      ? Math.min(
          100,
          (Math.max(0, autoPlan.currentIndex ?? 0) / autoPlan.total) * 100,
        )
      : null
  const displayedProgress = isConstructionChecklist
    ? ['LANDING', 'COMPLETE', 'COMPLETED'].includes(autoPlanStatus ?? '')
      ? 100
      : (autoPlanProgress ?? progress)
    : progress
  const constructionChecklistAutoPilot =
    isConstructionChecklist &&
    (autoPlan?.active === true ||
      ['RETURNING', 'LANDING'].includes(autoPlanStatus ?? ''))
  const handleOnline = useCallback(() => setIsOnline(true), [])
  const handleOffline = useCallback(() => setIsOnline(false), [])
  const handleToggleMore = useCallback(() => setMoreOpen((value) => !value), [])
  const {
    handleReviewMedia,
    handleStartFlight,
    handleFinishFlight,
    handleReferenceCapture,
    handleCommand,
    handleWeatherPreset,
    handlePreflightReady,
  } = useMissionActions({
    mission,
    onReviewMedia,
    onStartFlight,
    startFlightBusy,
    setStartFlightBusy,
    setLastCommand,
    finishFlightBusy,
    setFinishFlightBusy,
    drone,
    normalFlightAllowed,
    referenceBusyRef,
    setReferenceBusy,
    controlStatus,
    setLidarDetailsOpen,
    sendCommand,
    setIsOnline,
    onPreflightReady,
    preflightStorageKey,
    setPreflightReady,
  })

  const handleRequestMissionFailure = useCallback(async () => {
    if (!onFailureRequested || failureRequestBusy || missionFailureRequested) return
    if (!window.confirm(t.toolbar.failureConfirm)) return
    setFailureRequestBusy(true)
    const reason =
      getLanguage() === 'en'
        ? 'Operational risk during flight'
        : 'Phát sinh rủi ro trong lúc thực hiện'
    try {
      const wasAirborne = controlStatus?.inAir === true
      await onFailureRequested(reason, wasAirborne)
      setMissionFailureRequested(true)
      setLastCommand(t.status.failurePending)
      if (wasAirborne) {
        await sendCommand('return_to_base', { emergencyReturn: true })
      }
    } catch (cause) {
      setLastCommand(
        cause instanceof Error
          ? cause.message
          : getLanguage() === 'en'
            ? 'Could not record the mission failure request'
            : 'Không thể ghi nhận yêu cầu thất bại của Mission',
      )
    } finally {
      setFailureRequestBusy(false)
    }
  }, [
    failureRequestBusy,
    missionFailureRequested,
    controlStatus?.inAir,
    onFailureRequested,
    sendCommand,
    t.status.failurePending,
    t.toolbar.failureConfirm,
  ])

  if (import.meta.env.VITE_FLIGHT_MAP_ONLY === 'true') {
    return (
      <GpsCockpitView
        mission={mission}
        controlStatus={controlStatus}
        isOnline={isOnline}
        lastCommand={lastCommand}
        telemetryBattery={telemetryBattery}
        cameraTelemetry={cameraTelemetry}
        busyCommand={busyCommand}
        normalFlightAllowed={normalFlightAllowed}
        preflightReady={preflightReady}
        referenceBusy={referenceBusy}
        handleCommand={handleCommand}
        handleReviewMedia={handleReviewMedia}
        onStartFlight={onStartFlight}
        handleStartFlight={handleStartFlight}
        startFlightBusy={startFlightBusy}
        handleFinishFlight={handleFinishFlight}
        finishFlightBusy={finishFlightBusy}
        handleRequestMissionFailure={handleRequestMissionFailure}
        failureRequestBusy={failureRequestBusy}
        missionFailureRequested={missionFailureRequested}
        canFinishFlight={canFinishFlight}
        finishFlightBlockedReason={finishFlightBlockedReason}
        handleReferenceCapture={handleReferenceCapture}
        drone={drone}
        handlePreflightReady={handlePreflightReady}
      />
    )
  }

  return (
    <div
      className="mission-control-root"
      style={{
        flex: 1,
        minHeight: '100vh',
        height: '100vh',
        display: 'grid',
        gridTemplateRows: '76px 1fr 42px',
        background: '#020617',
        color: '#e5edf8',
        overflow: 'hidden',
        colorScheme: 'dark',
      }}
    >
      <MissionControlHeader
        drone={drone}
        isOnline={isOnline}
        progress={displayedProgress}
        elapsed={elapsed}
        remaining={remaining}
      />

      <main
        className="mission-control-workspace"
        style={{
          minHeight: 0,
          height: '100%',
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns:
            'minmax(0, 1.45fr) minmax(360px, 0.74fr) minmax(280px, 0.62fr)',
          gridTemplateRows: 'minmax(350px, 1fr) auto',
          alignItems: 'stretch',
          gap: 12,
          padding: '10px 14px 10px',
          background:
            'radial-gradient(circle at 28% 10%, rgba(37, 99, 235, 0.12), transparent 34%), #020617',
        }}
      >
        <MissionControlCamera
          streamUrl={streamUrl}
          isOnline={isOnline}
          handleOnline={handleOnline}
          handleOffline={handleOffline}
          controlStatus={controlStatus}
          thermalEnabled={thermalEnabled}
          thermalRows={thermalRows}
          showBatteryWarning={showBatteryWarning}
          geofenceAlertActive={geofenceAlertActive}
          batteryState={batteryState}
          batteryDisplay={batteryDisplay}
          lastCommand={lastCommand}
          geofenceTone={geofenceTone}
          geofenceStatus={geofenceStatus}
          geofenceMessage={geofenceMessage}
        />

        <section
          className="mission-control-lidar"
          style={{
            minWidth: 0,
            minHeight: 0,
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: 8,
            overflowX: 'hidden',
            overflowY: 'auto',
            paddingRight: 2,
            scrollbarGutter: 'stable',
          }}
        >
          <LidarRadarOverlay
            status={controlStatus}
            displayOnly={constructionChecklistAutoPilot}
          />
          <AirPressurePanel status={controlStatus} />
        </section>

        <section
          className="mission-control-controls"
          style={{
            gridColumn: '1 / 3',
            minWidth: 0,
            overflow: 'visible',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {missionFailureRequested && (
            <div
              role="status"
              aria-live="polite"
              style={{
                border: '1px solid rgba(248,113,113,.65)',
                borderRadius: 10,
                padding: '8px 12px',
                background: 'rgba(127,29,29,.48)',
                color: '#fee2e2',
                fontSize: 12,
                fontWeight: 700,
                lineHeight: 1.45,
              }}
            >
              {t.status.failurePending}
                {onFailureLanded && controlStatus?.inAir !== true && (
                  <button
                    type="button"
                    onClick={onFailureLanded}
                    style={{
                      marginLeft: 12,
                      minHeight: 30,
                      border: '1px solid rgba(254,226,226,.65)',
                      borderRadius: 7,
                      padding: '4px 10px',
                      background: 'rgba(127,29,29,.8)',
                      color: '#fff1f2',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {getLanguage() === 'en'
                      ? 'Confirm landed'
                      : 'Xác nhận đã hạ cánh'}
                  </button>
                )}
            </div>
          )}
          <FlightControls
            canFly={normalFlightAllowed && preflightReady}
            busyCommand={busyCommand}
            lidarDetailsOpen={lidarDetailsOpen}
            moreOpen={moreOpen}
            status={controlStatus}
            onCommand={handleCommand}
            onWeatherPreset={handleWeatherPreset}
            onToggleMore={handleToggleMore}
            onReviewMedia={handleReviewMedia}
            onFinishFlight={handleFinishFlight}
            finishFlightBusy={finishFlightBusy}
            onFailMission={handleRequestMissionFailure}
            failMissionBusy={failureRequestBusy}
            missionFailureRequested={missionFailureRequested}
            canFinishFlight={canFinishFlight}
            finishFlightBlockedReason={finishFlightBlockedReason}
            onReferenceCapture={handleReferenceCapture}
            referenceBusy={referenceBusy}
          />
        </section>

        {missionPanelOpen ? (
          <MissionChecklistPanel
            mission={mission}
            progress={displayedProgress}
            onChecklistChanged={completionMonitoring.reload}
          />
        ) : mediaPanelOpen ? (
          <MissionCapturedMediaPanel mission={mission} />
        ) : (
          <MissionControlSide
            controlStatus={controlStatus}
            lidarDetailsOpen={lidarDetailsOpen}
            view="overview"
            progress={displayedProgress}
            mission={mission}
          />
        )}

        {!preflightReady && normalFlightAllowed && (
          <PreflightRequiredNotice
            mission={mission}
            drone={drone}
            handlePreflightReady={handlePreflightReady}
          />
        )}
      </main>

      <MissionControlFooter
        mission={mission}
        footerStatusColor={footerStatusColor}
        footerStatusDot={footerStatusDot}
        geofenceMessage={geofenceMessage}
        missionPanelOpen={missionPanelOpen}
        mediaPanelOpen={mediaPanelOpen}
        onShowChecklist={() => {
          setMissionPanelOpen(true)
          setMediaPanelOpen(false)
        }}
        onShowMedia={() => {
          setMissionPanelOpen(false)
          setMediaPanelOpen(true)
        }}
        onShowOverview={() => {
          setMissionPanelOpen(false)
          setMediaPanelOpen(false)
        }}
      />
    </div>
  )
}
