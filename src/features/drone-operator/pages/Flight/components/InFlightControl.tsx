import { useCallback, useMemo, useRef, useState } from 'react'
import type { Drone, Mission } from '../../../types/omss'
import { useI18n } from '../../../../../shared/i18n'
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

interface Props {
  normalFlightAllowed?: boolean
  terminationAllowed?: boolean
  operationalMessage?: string
  mission: Mission
  drone: Drone
  onRTB: () => void
  onEmergency: () => void
  autoStartPlan: boolean
  onAutoStartPlanConsumed: () => void
  onPreflightReady?: () => Promise<void>
  onReviewMedia?: () => void
  onStartFlight?: () => Promise<void>
}

export default function InFlightControl({
  normalFlightAllowed = false,
  terminationAllowed = false,
  operationalMessage,
  mission,
  drone,
  onRTB,
  onEmergency,
  autoStartPlan,
  onAutoStartPlanConsumed,
  onPreflightReady,
  onReviewMedia,
  onStartFlight,
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
  const [startFlightBusy, setStartFlightBusy] = useState(false)
  const [streamRevision, setStreamRevision] = useState(0)
  const [controlStatus, setControlStatus] = useState<ControlStatus | null>(null)
  const [moreOpen, setMoreOpen] = useState(false)
  const [lidarDetailsOpen, setLidarDetailsOpen] = useState(false)
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
    terminationAllowed,
    setLastCommand,
    operationalMessage,
    preflightReady,
    mission,
    controlStatus,
    restrictedGpsZones,
    setBusyCommand,
    drone,
    setIsOnline,
    onStartFlight,
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

  if (import.meta.env.VITE_FLIGHT_MAP_ONLY !== 'false') {
    return (
      <GpsCockpitView
        mission={mission}
        controlStatus={controlStatus}
        isOnline={isOnline}
        operationalMessage={operationalMessage}
        lastCommand={lastCommand}
        telemetryBattery={telemetryBattery}
        cameraTelemetry={cameraTelemetry}
        busyCommand={busyCommand}
        normalFlightAllowed={normalFlightAllowed}
        preflightReady={preflightReady}
        terminationAllowed={terminationAllowed}
        referenceBusy={referenceBusy}
        handleCommand={handleCommand}
        handleReviewMedia={handleReviewMedia}
        onStartFlight={onStartFlight}
        handleStartFlight={handleStartFlight}
        startFlightBusy={startFlightBusy}
        handleFinishFlight={handleFinishFlight}
        finishFlightBusy={finishFlightBusy}
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
        progress={progress}
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
          preflightReady={preflightReady}
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
          operationalMessage={operationalMessage}
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
          <LidarRadarOverlay status={controlStatus} />
          <AirPressurePanel status={controlStatus} />
        </section>

        <section
          className="mission-control-controls"
          style={{
            gridColumn: '1 / 3',
            minWidth: 0,
            overflow: 'visible',
          }}
        >
          <FlightControls
            canFly={normalFlightAllowed && preflightReady}
            canTerminate={terminationAllowed}
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
            onReferenceCapture={handleReferenceCapture}
            referenceBusy={referenceBusy}
          />
        </section>

        <MissionControlSide
          controlStatus={controlStatus}
          lidarDetailsOpen={lidarDetailsOpen}
          progress={progress}
          mission={mission}
        />

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
      />
    </div>
  )
}
