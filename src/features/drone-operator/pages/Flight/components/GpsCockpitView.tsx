import { isInsideHcmcServiceArea } from '../../../../../shared/lib/serviceArea'
import { gpsDistanceMeters } from '../gpsRoutePlanner'
import { getLanguage, useI18n } from '../../../../../shared/i18n'
import { copy } from './cockpitCopy'
import { FlightCockpit } from './FlightCockpit'
import { DroneCameraView } from './DroneCameraView'
import { SatelliteFlightMap } from './SatelliteFlightMap'
import { ManualCockpitPreflight } from './ManualCockpitPreflight'
import { inFlightControlMessages } from './InFlightControl.messages'
import type { Mission, Drone } from '../../../types/omss'
import type { ControlStatus, FlightCommand } from '../inFlightTypes'
import type { DroneCameraTelemetry } from './DroneCameraView'

export function GpsCockpitView({
  mission,
  controlStatus,
  isOnline,
  operationalMessage,
  lastCommand,
  telemetryBattery,
  cameraTelemetry,
  busyCommand,
  normalFlightAllowed,
  preflightReady,
  terminationAllowed,
  referenceBusy,
  handleCommand,
  handleReviewMedia,
  onStartFlight,
  handleStartFlight,
  startFlightBusy,
  handleFinishFlight,
  finishFlightBusy,
  handleReferenceCapture,
  drone,
  handlePreflightReady,
}: {
  mission: Mission
  controlStatus: ControlStatus | null
  isOnline: boolean
  operationalMessage: string | undefined
  lastCommand: string
  telemetryBattery: number | null
  cameraTelemetry: DroneCameraTelemetry | null
  busyCommand: FlightCommand | null
  normalFlightAllowed: boolean
  preflightReady: boolean
  terminationAllowed: boolean
  referenceBusy: boolean
  handleCommand: (command: FlightCommand) => void
  handleReviewMedia: () => void
  onStartFlight: (() => Promise<void>) | undefined
  handleStartFlight: () => Promise<void>
  startFlightBusy: boolean
  handleFinishFlight: () => Promise<void>
  finishFlightBusy: boolean
  handleReferenceCapture: () => Promise<void>
  drone: Drone
  handlePreflightReady: () => Promise<void>
}) {
  const { t } = useI18n(inFlightControlMessages)
  const target =
    Number.isFinite(mission.lat) && Number.isFinite(mission.lng)
      ? { latitude: mission.lat, longitude: mission.lng }
      : null
  const gpsTargetReady = Boolean(target && isInsideHcmcServiceArea(target))
  const droneGps = controlStatus?.positionGps ?? null
  const altitudeM =
    droneGps?.relativeAltitudeM ?? controlStatus?.altitudeM ?? null
  const verticalMps =
    controlStatus?.velocityNed?.downMps == null
      ? null
      : -controlStatus.velocityNed.downMps
  const baseDistanceKm = controlStatus?.positionNed
    ? Math.hypot(
        controlStatus.positionNed.northM,
        controlStatus.positionNed.eastM,
      ) / 1000
    : null
  const targetDistanceKm =
    droneGps && target ? gpsDistanceMeters(droneGps, target) / 1000 : null
  const language = getLanguage() === 'en' ? 'en' : 'vi'
  return (
    <FlightCockpit
      language={language}
      missionLabel={mission.id}
      roleLabel={t.header.droneOperator}
      liveLabel={isOnline ? t.header.live : t.header.offline}
      online={isOnline}
      waitingGpsLabel={copy[language].waitingGps}
      statusMessage={operationalMessage ?? lastCommand}
      telemetry={{
        latitude: droneGps?.latitude ?? null,
        longitude: droneGps?.longitude ?? null,
        altitudeM,
        speedMps: controlStatus?.speedMps ?? null,
        verticalMps,
        headingDeg: controlStatus?.yawDeg ?? null,
        batteryPercent: telemetryBattery,
        inAir: Boolean(controlStatus?.inAir),
        flightMode: controlStatus?.batteryDrainMode ?? null,
        baseDistanceKm,
        targetDistanceKm,
      }}
      camera={
        <DroneCameraView telemetry={cameraTelemetry} language={language} />
      }
      map={
        <SatelliteFlightMap
          missionId={mission.backendId ?? mission.id}
          target={target}
          drone={droneGps}
        />
      }
      busy={busyCommand !== null}
      canFly={normalFlightAllowed && preflightReady}
      canTerminate={terminationAllowed}
      canFlyToTarget={gpsTargetReady}
      referenceBusy={referenceBusy}
      onCommand={handleCommand}
      onReview={handleReviewMedia}
      onStartFlight={onStartFlight ? () => void handleStartFlight() : undefined}
      canStartFlight={controlStatus?.inAir !== true}
      startingFlight={startFlightBusy}
      onFinishFlight={handleFinishFlight}
      finishingFlight={finishFlightBusy}
      onReferenceCapture={() => void handleReferenceCapture()}
      overlay={
        !preflightReady && normalFlightAllowed ? (
          <div className="stf-flight-overlay">
            <ManualCockpitPreflight
              missionLabel={mission.id}
              deviceLabel={drone.name || drone.id}
              onReady={handlePreflightReady}
            />
          </div>
        ) : null
      }
    />
  )
}
