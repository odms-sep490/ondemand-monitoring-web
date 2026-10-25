import { useEffect, useRef, useState } from 'react'
import { authSession } from '../../auth/api/authApi'
import { useI18n } from '../../../shared/i18n'
import type { Screen, Mission, Drone, FlightToken, NavId } from '../types/omss'
import { missionApi } from '../../mission/api/missionApi'
import { flightControlApi } from '../api/flightControlApi'
import { startFailureJournalReplay } from '../../media/api/uploadFailureJournal'
import type { FlightControlStatus } from '../api/flightControlApi'
import { operatorWorkspaceMessages } from './i18n/operatorWorkspace'

import Sidebar from './components/Sidebar'

import OperatorOverview from './screens/OperatorOverview'
import MissionList from './screens/MissionList'
import MissionDetail from './screens/MissionDetail'
import AcceptReject from './screens/AcceptReject'
import GCSConnection from './screens/GCSConnection'
import ReadyToFly from './screens/ReadyToFly'
import InFlightControl from '../pages/Flight/components/InFlightControl'
import ReturnToBase from './screens/ReturnToBase'
import PostflightCheck from './screens/PostflightCheck'
import type { InspectionResult } from './screens/PostflightCheck'
import MissionCompleted from './screens/MissionCompleted'
import MissionFailed from './screens/MissionFailed'
import MediaUpload from './screens/MediaUpload'
import ManualUpload from './screens/ManualUpload'
import SimulationZones from '../pages/SimulationZones/SimulationZonesPage'

type BackendMission = {
  id: string
  orderId?: string
  orderTitle?: string
  customerName?: string
  missionCode?: string
  status?: Mission['state']
  operatorId?: string
  deviceId?: string
  deviceCode?: string
  droneCode?: string
  droneName?: string
  droneId?: string
  latitude?: number
  longitude?: number
  address?: string
  scheduledStartAt?: string
  description?: string
  mediaType?: string
  plan?: {
    id?: string
    planningAlgorithm?: string
    plannedDistanceM?: number | null
    plannedDurationSec?: number | null
    estimatedEnergyMah?: number | null
    estimatedBatteryUsedPercent?: number | null
    batteryCapacityMah?: number | null
    availableBatteryPercentAtPlanning?: number | null
    estimatedRemainingBatteryPercent?: number | null
    safetyReservePercent?: number | null
    requiredBatteryPercent?: number | null
    feasibilityStatus?: string
    maxPlannedAltitudeM?: number | null
    waypoints?: {
      id?: string
      sequence?: number
      simX?: number
      simY?: number
      altitudeM?: number
      plannedSpeedMps?: number
      reason?: string
    }[]
  }
}

type RoutePoint = Mission['routePoints'] extends (infer Point)[] | undefined
  ? Point
  : never

const IMPORTANT_ROUTE_REASONS = new Set([
  'START',
  'TARGET',
  'ORDER',
  'TARGET_APPROACH',
  'TERRAIN_CLEARANCE',
  'RETURN',
  'HOME',
])

function perpendicularDistance(
  point: RoutePoint,
  start: RoutePoint,
  end: RoutePoint,
) {
  const dx = end.simX - start.simX
  const dy = end.simY - start.simY
  if (dx === 0 && dy === 0) {
    return Math.hypot(point.simX - start.simX, point.simY - start.simY)
  }
  return (
    Math.abs(
      dy * point.simX -
        dx * point.simY +
        end.simX * start.simY -
        end.simY * start.simX,
    ) / Math.hypot(dx, dy)
  )
}

function simplifySegment(
  points: RoutePoint[],
  toleranceM: number,
): RoutePoint[] {
  if (points.length <= 2) return points

  let maxDistance = 0
  let splitIndex = 0
  const start = points[0]
  const end = points[points.length - 1]

  for (let index = 1; index < points.length - 1; index += 1) {
    const distance = perpendicularDistance(points[index], start, end)
    if (distance > maxDistance) {
      maxDistance = distance
      splitIndex = index
    }
  }

  if (maxDistance <= toleranceM) return [start, end]

  const left = simplifySegment(points.slice(0, splitIndex + 1), toleranceM)
  const right = simplifySegment(points.slice(splitIndex), toleranceM)
  return [...left.slice(0, -1), ...right]
}

function simplifyRoutePoints(points: RoutePoint[]) {
  if (points.length <= 30) return points

  const importantIndexes = new Set<number>([0, points.length - 1])
  points.forEach((point, index) => {
    if (IMPORTANT_ROUTE_REASONS.has(point.reason.toUpperCase())) {
      importantIndexes.add(index)
    }
  })

  const important = [...importantIndexes].sort((a, b) => a - b)
  const simplified: RoutePoint[] = []

  for (let index = 0; index < important.length - 1; index += 1) {
    const from = important[index]
    const to = important[index + 1]
    const segment = simplifySegment(points.slice(from, to + 1), 12)
    simplified.push(...(index === 0 ? segment : segment.slice(1)))
  }

  const capped =
    simplified.length <= 30
      ? simplified
      : simplified.filter((point, index) => {
          if (index === 0 || index === simplified.length - 1) return true
          if (IMPORTANT_ROUTE_REASONS.has(point.reason.toUpperCase()))
            return true
          const keepEvery = Math.ceil(simplified.length / 30)
          return index % keepEvery === 0
        })

  return capped.map((point, index) => ({
    ...point,
    sequence: index,
    id: `${point.id}-op-${index}`,
  }))
}

function adaptBackendMission(mission: BackendMission): Mission {
  const plan = mission.plan
  const routePoints = simplifyRoutePoints(
    (plan?.waypoints ?? [])
      .filter(
        (point) =>
          typeof point.sequence === 'number' &&
          typeof point.simX === 'number' &&
          typeof point.simY === 'number' &&
          typeof point.altitudeM === 'number',
      )
      .sort((a, b) => Number(a.sequence) - Number(b.sequence))
      .map((point) => ({
        id: point.id ?? `wp-${point.sequence}`,
        sequence: Number(point.sequence),
        simX: Number(point.simX),
        simY: Number(point.simY),
        altitudeM: Number(point.altitudeM),
        speedMps:
          typeof point.plannedSpeedMps === 'number'
            ? point.plannedSpeedMps
            : undefined,
        reason: point.reason ?? 'CRUISE',
      })),
  )
  const routeTargetPoint =
    routePoints.find((point) => point.reason?.toUpperCase() === 'TARGET') ??
    routePoints.find((point) => point.reason?.toUpperCase() === 'ORDER') ??
    routePoints[routePoints.length - 1]
  return {
    id: mission.missionCode ?? mission.id,
    backendId: mission.id,
    orderRef: mission.orderId ?? '',
    orderTitle: mission.orderTitle,
    title: mission.orderTitle ?? mission.missionCode ?? mission.id,
    state: mission.status ?? 'RESOURCE_ASSIGNING',
    priority: 'NORMAL',
    droneId: mission.deviceId ?? mission.droneId ?? '',
    droneCode: mission.droneCode ?? mission.deviceCode,
    droneName: mission.droneName,
    operatorId: mission.operatorId ?? '',
    customer: mission.customerName ?? '',
    location: mission.address ?? '',
    lat: mission.latitude ?? 0,
    lng: mission.longitude ?? 0,
    scheduledAt: mission.scheduledStartAt ?? '',
    estimatedMinutes:
      typeof plan?.plannedDurationSec === 'number'
        ? Math.max(1, Math.round(plan.plannedDurationSec / 60))
        : 0,
    distanceKm:
      typeof plan?.plannedDistanceM === 'number'
        ? plan.plannedDistanceM / 1000
        : 0,
    flightPlanId: plan?.id ?? '',
    maxAltitudeM:
      typeof plan?.maxPlannedAltitudeM === 'number'
        ? plan.maxPlannedAltitudeM
        : 0,
    notes: mission.description ?? '',
    targetSimX: routeTargetPoint?.simX,
    targetSimY: routeTargetPoint?.simY,
    routePoints,
    planSummary: plan
      ? {
          planningAlgorithm: plan.planningAlgorithm,
          plannedDistanceM: plan.plannedDistanceM,
          estimatedEnergyMah: plan.estimatedEnergyMah,
          estimatedBatteryUsedPercent: plan.estimatedBatteryUsedPercent,
          batteryCapacityMah: plan.batteryCapacityMah,
          availableBatteryPercentAtPlanning:
            plan.availableBatteryPercentAtPlanning,
          estimatedRemainingBatteryPercent:
            plan.estimatedRemainingBatteryPercent,
          safetyReservePercent: plan.safetyReservePercent,
          requiredBatteryPercent: plan.requiredBatteryPercent,
          feasibilityStatus: plan.feasibilityStatus,
        }
      : undefined,
  }
}

function createAssignedDrone(mission: Mission): Drone {
  const code = mission.droneCode ?? mission.droneId
  const name = mission.droneName ? `${code} ${mission.droneName}` : code
  return {
    id: mission.droneId,
    name,
    model: 'Assigned mission drone',
    serialNumber: '',
    state: mission.state === 'IN_FLIGHT' ? 'ACTIVE_MISSION' : 'PREFLIGHT',
    battery: 0,
    gpsCount: 0,
    gpsHdop: 0,
    altitude: 0,
    groundSpeed: 0,
    verticalSpeed: 0,
    heading: 0,
    lat: mission.lat,
    lng: mission.lng,
    storageMB: 0,
    telemetryAge: 0,
    cameraOk: false,
    gimbalOk: false,
    rssi: 0,
    voltage: 0,
    currentAmps: 0,
    tempC: 0,
  }
}

export default function OperatorWorkspace() {
  // Replay journalled upload failures on mount and on reconnect. Bounded backoff runs only
  // while events remain unacknowledged, so there is no permanent polling loop. Startup is
  // deferred so the replay driver never competes with the workspace's initial data load.
  useEffect(() => {
    let dispose: (() => void) | undefined
    const timer = window.setTimeout(() => {
      dispose = startFailureJournalReplay()
    }, 0)
    return () => {
      window.clearTimeout(timer)
      dispose?.()
    }
  }, [])
  const { t } = useI18n(operatorWorkspaceMessages)
  const acceptInFlight = useRef(false)
  const authenticatedUser = authSession.getUser()
  const [screen, setScreen] = useState<Screen>('mission-list')
  const [navId, setNavId] = useState<NavId>('my-missions')
  const [mission, setMission] = useState<Mission | null>(null)
  const [allMissions, setAllMissions] = useState<Mission[]>([])
  const [missionsLoading, setMissionsLoading] = useState(false)
  const [missionsError, setMissionsError] = useState<string | null>(null)
  const [drone, setDrone] = useState<Drone | null>(null)
  const [token, setToken] = useState<FlightToken | null>(null)
  const [failReason, setFailReason] = useState(t.failReasons.preflightHardware)
  const [autoStartPlanRequested, setAutoStartPlanRequested] = useState(false)
  const [flightSessionStarted, setFlightSessionStarted] = useState(false)
  const [mediaReturnScreen, setMediaReturnScreen] =
    useState<Screen>('mission-list')
  const [postflightTelemetry, setPostflightTelemetry] =
    useState<FlightControlStatus | null>(null)

  // Load only missions assigned to the authenticated operator.
  useEffect(() => {
    if (screen !== 'mission-list' && screen !== 'operator-overview') return
    let cancelled = false

    async function loadAllMissions(initialLoad = false) {
      if (initialLoad) {
        setMissionsLoading(true)
        setMissionsError(null)
      }
      try {
        const data = await missionApi.getMyMissions()
        if (cancelled) return
        const adapted = (data as unknown as BackendMission[]).map(
          adaptBackendMission,
        )
        setAllMissions(adapted)
      } catch (cause) {
        if (!cancelled && initialLoad) {
          setAllMissions([])
          setMissionsError(
            cause instanceof Error
              ? cause.message
              : t.errors.cannotLoadMissions,
          )
        }
      } finally {
        if (!cancelled && initialLoad) setMissionsLoading(false)
      }
    }

    void loadAllMissions(true)
    const refreshTimer = window.setInterval(() => {
      void loadAllMissions(false)
    }, 5_000)

    return () => {
      cancelled = true
      window.clearInterval(refreshTimer)
    }
  }, [screen])

  const displayMission = mission

  const displayDrone = drone

  function goScreen(s: Screen) {
    if (s === 'in-flight' && !flightSessionStarted) {
      setScreen('mission-detail')
      setNavId('my-missions')
      return
    }
    setScreen(s)
  }

  function handleNavChange(id: NavId, s?: Screen) {
    if (id === 'mission-control' || s === 'in-flight') {
      if (flightSessionStarted) {
        setNavId('mission-control')
        setScreen('in-flight')
      } else {
        setNavId('my-missions')
        setScreen('mission-detail')
      }
      return
    }

    setNavId(id)
    if (s) {
      setScreen(s)
      return
    }
    if (id === 'my-missions') setScreen('mission-list')
    else if (id === 'zone-map') setScreen('simulation-zones')
    else if (id === 'dashboard') setScreen('operator-overview')
    else setScreen('operator-overview')
  }

  async function handleSelectMission(m: Mission) {
    setMission({ ...m })
    setDrone(createAssignedDrone(m))
    setFlightSessionStarted(false)
    setAutoStartPlanRequested(false)
    setScreen('mission-detail')
    setNavId('my-missions')

    try {
      const detail = await missionApi.getMissionById(m.backendId ?? m.id)
      const detailedMission = adaptBackendMission(
        detail as unknown as BackendMission,
      )
      const visibleMission = detailedMission
      setMission(visibleMission)
      setDrone(createAssignedDrone(visibleMission))
      setAllMissions((missions) =>
        missions.map((missionItem) =>
          missionItem.id === visibleMission.id ? visibleMission : missionItem,
        ),
      )
    } catch (cause) {
      setMissionsError(
        cause instanceof Error
          ? cause.message
          : t.errors.cannotLoadMissionDetails,
      )
    }
  }

  async function handleAccept() {
    if (!mission || acceptInFlight.current) return
    acceptInFlight.current = true
    try {
      const updated = await missionApi.acceptMyMission(
        mission.backendId ?? mission.id,
      )
      const accepted = adaptBackendMission(updated as unknown as BackendMission)
      setMission(accepted)
      setAllMissions((items) =>
        items.map((item) =>
          item.backendId === accepted.backendId ? accepted : item,
        ),
      )
      setScreen('gcs-connect')
    } catch (cause) {
      setMissionsError(
        cause instanceof Error
          ? cause.message
          : t.errors.missionAcceptanceFailed,
      )
    } finally {
      acceptInFlight.current = false
    }
  }

  async function handleReject(reason: string) {
    if (!mission) return
    try {
      await missionApi.rejectMyMission(mission.backendId ?? mission.id, reason)
      setMission(null)
      setDrone(null)
      setAllMissions((items) =>
        items.filter((item) => item.backendId !== mission.backendId),
      )
      setScreen('mission-list')
    } catch (cause) {
      setMissionsError(
        cause instanceof Error
          ? cause.message
          : t.errors.missionRejectionFailed,
      )
    }
  }

  async function handleGCSConnected() {
    if (!mission) return
    try {
      if (mission.state === 'IN_FLIGHT') {
        setFlightSessionStarted(true)
        setAutoStartPlanRequested(false)
        setNavId('mission-control')
        setScreen('in-flight')
        return
      }
      if (mission.state === 'SCHEDULED') {
        const updated = await missionApi.connectGcs(
          mission.backendId ?? mission.id,
        )
        setMission(adaptBackendMission(updated as unknown as BackendMission))
      }
      setScreen('preflight')
    } catch (cause) {
      setMissionsError(
        cause instanceof Error ? cause.message : t.errors.gcsConnectionFailed,
      )
    }
  }
  async function handleStartMission() {
    if (!mission || !drone) return
    try {
      const missionId = mission.backendId ?? mission.id
      const current = await missionApi.getMissionById(missionId)
      if (current.status === 'IN_FLIGHT' || current.status === 'IN_PROGRESS') {
        const activeMission = adaptBackendMission(
          current as unknown as BackendMission,
        )
        setMission(activeMission)
        setAllMissions((items) =>
          items.map((item) =>
            item.backendId === activeMission.backendId ? activeMission : item,
          ),
        )
        setFlightSessionStarted(true)
        setAutoStartPlanRequested(false)
        setScreen('in-flight')
        setNavId('mission-control')
        return
      }
      await flightControlApi
        .bindSession(missionId, drone.id)
        .catch(() => undefined)
      const validToken =
        token && Date.now() < token.expiresAt ? token.token : undefined
      const updated = await missionApi.startMission(missionId, validToken)
      const activeMission = adaptBackendMission(
        updated as unknown as BackendMission,
      )
      setMission(activeMission)
      setAllMissions((items) =>
        items.map((item) =>
          item.backendId === activeMission.backendId ? activeMission : item,
        ),
      )
      setFlightSessionStarted(true)
      setAutoStartPlanRequested(true)
      setScreen('in-flight')
      setNavId('mission-control')
    } catch (cause) {
      setMissionsError(
        cause instanceof Error ? cause.message : t.errors.missionStartFailed,
      )
    }
  }

  async function handleOpenCockpit() {
    if (!mission || !drone) return
    try {
      await flightControlApi
        .bindSession(mission.backendId ?? mission.id, drone.id)
        .catch(() => undefined)
      setFlightSessionStarted(false)
      setAutoStartPlanRequested(false)
      setScreen('in-flight')
      setNavId('mission-control')
    } catch (cause) {
      setMissionsError(
        cause instanceof Error ? cause.message : t.errors.missionStartFailed,
      )
    }
  }

  async function handleRuntimePreflightReady() {
    if (!mission || !drone) return
    const missionId = mission.backendId ?? mission.id
    try {
      const controlStatus = await flightControlApi.status()
      if (
        controlStatus.missionId !== missionId ||
        controlStatus.deviceId !== drone.id
      ) {
        await flightControlApi.bindSession(missionId, drone.id)
      }

      const deadline = Date.now() + 20_000
      while (true) {
        const telemetry = await missionApi.getTelemetryReadiness(missionId)
        if (telemetry.deviceId !== drone.id) {
          throw new Error(t.errors.missionDroneChanged)
        }
        if (telemetry.ready) break
        if (Date.now() >= deadline) {
          throw new Error(t.errors.telemetryTimeout)
        }
        await new Promise((resolve) => window.setTimeout(resolve, 1000))
      }

      const storedToken = window.sessionStorage.getItem(
        `omss.droneOperator.backendPreflightToken.${missionId}.${drone.id}`,
      )
      if (!storedToken)
        throw new Error(
          'Chưa có quyền bay từ preflight. Vui lòng kiểm tra lại.',
        )
      const tokenValue = storedToken
      const updated = await missionApi.handoverMyMission(
        mission.backendId ?? mission.id,
      )
      setToken({
        token: tokenValue,
        issuedAt: Date.now(),
        expiresAt: Date.now() + 15 * 60_000,
        missionId: mission.backendId ?? mission.id,
        droneId: drone.id,
      })
      window.sessionStorage.removeItem(
        `omss.droneOperator.backendPreflightToken.${missionId}.${drone.id}`,
      )
      setMission(adaptBackendMission(updated as unknown as BackendMission))
      setScreen('ready-to-fly')
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : t.errors.preflightRegistrationFailed
      setMissionsError(message)
      throw new Error(message, { cause })
    }
  }

  async function handleRTB() {
    if (!mission) return
    try {
      const updated = await missionApi.markReturning(
        mission.backendId ?? mission.id,
      )
      setMission(adaptBackendMission(updated as unknown as BackendMission))
      setScreen('return-to-base')
    } catch (cause) {
      setMissionsError(
        cause instanceof Error ? cause.message : t.errors.rtbUpdateFailed,
      )
    }
  }

  async function handleEmergency() {
    if (!mission) return
    const reason = t.failReasons.emergencyStop
    try {
      const updated = await missionApi.failMission(
        mission.backendId ?? mission.id,
        reason,
      )
      setMission(adaptBackendMission(updated as unknown as BackendMission))
      setFailReason(reason)
      setScreen('mission-failed')
    } catch (cause) {
      setMissionsError(
        cause instanceof Error
          ? cause.message
          : t.errors.missionFailureUpdateFailed,
      )
    }
  }

  async function handleLanded() {
    if (!mission) return
    try {
      const telemetrySnapshot = await flightControlApi
        .status()
        .catch(() => null)
      setPostflightTelemetry(telemetrySnapshot)
      const updated = await missionApi.startPostflight(
        mission.backendId ?? mission.id,
      )
      setMission(adaptBackendMission(updated as unknown as BackendMission))
      setScreen('postflight')
    } catch (cause) {
      setMissionsError(
        cause instanceof Error ? cause.message : t.errors.postflightStartFailed,
      )
    }
  }

  async function handlePostflightComplete(
    results: Record<string, InspectionResult>,
    notes: string,
  ) {
    if (!mission || !drone) return
    try {
      const updated = await missionApi.postFlightStatus(
        mission.backendId ?? mission.id,
        drone.id,
        'AVAILABLE',
        notes,
        results,
        postflightTelemetry,
      )
      setMission(adaptBackendMission(updated as unknown as BackendMission))
      setScreen('mission-completed')
    } catch (cause) {
      setMissionsError(
        cause instanceof Error
          ? cause.message
          : t.errors.postflightCompletionFailed,
      )
    }
  }

  async function handlePostflightFault(
    results: Record<string, InspectionResult>,
    notes: string,
  ) {
    if (!mission || !drone) return
    try {
      const updated = await missionApi.postFlightStatus(
        mission.backendId ?? mission.id,
        drone.id,
        'MAINTENANCE',
        notes,
        results,
        postflightTelemetry,
      )
      setMission(adaptBackendMission(updated as unknown as BackendMission))
      setDrone((current) =>
        current ? { ...current, state: 'MAINTENANCE' } : current,
      )
      setScreen('mission-completed')
    } catch (cause) {
      setMissionsError(
        cause instanceof Error ? cause.message : t.errors.postflightFaultFailed,
      )
    }
  }

  const isDark = screen === 'in-flight'

  return (
    <div className="portal-shell" style={{ fontFamily: 'var(--font-ui)' }}>
      <Sidebar
        role="operator"
        active={navId}
        onChange={handleNavChange}
        alerts={1}
      />

      <main className="portal-main" style={{ padding: 0 }}>
        {/* Mission Control transition banner */}
        {isDark && (
          <div
            style={{
              height: 3,
              background: 'linear-gradient(90deg,#4f46e5,#2563eb,#06b6d4)',
              flexShrink: 0,
            }}
          />
        )}

        <div
          className={isDark ? 'dark-ws' : ''}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Operator overview */}
          {screen === 'operator-overview' && (
            <OperatorOverview
              allMissions={allMissions}
              operatorName={
                authenticatedUser?.fullName ?? t.fallback.operatorName
              }
              operatorId={authenticatedUser?.id ?? t.fallback.operatorId}
              onGoMissions={() => {
                setScreen('mission-list')
                setNavId('my-missions')
              }}
              onGoMission={handleSelectMission}
            />
          )}

          {/* Operator flow */}
          {missionsError && (
            <div
              role="alert"
              style={{ margin: '12px 36px 0', color: 'var(--red-text)' }}
            >
              {missionsError}
            </div>
          )}
          {screen === 'mission-list' && (
            <MissionList
              missions={missionsLoading ? [] : allMissions}
              onSelect={handleSelectMission}
              onScreen={goScreen}
            />
          )}
          {screen === 'mission-detail' && displayMission && displayDrone && (
            <MissionDetail
              mission={displayMission}
              drone={displayDrone}
              onScreen={goScreen}
              onBack={() => setScreen('mission-list')}
              onStartFlight={handleOpenCockpit}
            />
          )}
          {screen === 'accept-reject' && displayMission && displayDrone && (
            <AcceptReject
              mission={displayMission}
              drone={displayDrone}
              onAccept={handleAccept}
              onReject={handleReject}
              onBack={() => setScreen('mission-detail')}
            />
          )}
          {screen === 'gcs-connect' && displayMission && displayDrone && (
            <GCSConnection
              mission={displayMission}
              drone={displayDrone}
              onConnected={handleGCSConnected}
              onBack={() => setScreen('mission-detail')}
            />
          )}
          {screen === 'preflight' && displayMission && displayDrone && (
            <InFlightControl
              mission={displayMission}
              drone={displayDrone}
              onRTB={handleRTB}
              onEmergency={handleEmergency}
              autoStartPlan={false}
              onAutoStartPlanConsumed={() => undefined}
              onPreflightReady={handleRuntimePreflightReady}
            />
          )}
          {screen === 'ready-to-fly' &&
            token &&
            displayMission &&
            displayDrone && (
              <ReadyToFly
                mission={displayMission}
                drone={displayDrone}
                token={token}
                onStart={handleOpenCockpit}
                onAbort={() => setScreen('preflight')}
              />
            )}
          {screen === 'in-flight' && displayMission && displayDrone && (
            <InFlightControl
              mission={displayMission}
              drone={displayDrone}
              onRTB={handleRTB}
              onEmergency={handleEmergency}
              autoStartPlan={autoStartPlanRequested}
              onAutoStartPlanConsumed={() => setAutoStartPlanRequested(false)}
              onReviewMedia={() => {
                setMediaReturnScreen('in-flight')
                setScreen('media-upload')
              }}
              onStartFlight={handleStartMission}
            />
          )}
          {screen === 'return-to-base' && displayDrone && mission && (
            <ReturnToBase
              drone={displayDrone}
              missionId={mission.backendId ?? mission.id}
              onLanded={handleLanded}
            />
          )}
          {screen === 'postflight' && displayDrone && (
            <PostflightCheck
              drone={displayDrone}
              telemetrySnapshot={postflightTelemetry}
              onComplete={handlePostflightComplete}
              onFault={handlePostflightFault}
            />
          )}
          {screen === 'mission-completed' && displayMission && displayDrone && (
            <MissionCompleted
              mission={displayMission}
              drone={displayDrone}
              onMedia={() => {
                setMediaReturnScreen('mission-completed')
                setScreen('media-upload')
              }}
              onMissions={() => setScreen('mission-list')}
            />
          )}
          {screen === 'mission-failed' && displayMission && displayDrone && (
            <MissionFailed
              mission={displayMission}
              drone={displayDrone}
              reason={failReason}
              onMissions={() => setScreen('mission-list')}
            />
          )}
          {screen === 'media-upload' && displayMission && (
            <MediaUpload
              mission={displayMission}
              onDone={() => setScreen(mediaReturnScreen)}
              onManual={() => setScreen('manual-upload')}
            />
          )}
          {screen === 'manual-upload' && mission && (
            <ManualUpload
              missionId={mission.backendId ?? mission.id}
              onComplete={() => setScreen('mission-list')}
              onBack={() => setScreen('media-upload')}
            />
          )}
          {screen === 'simulation-zones' && <SimulationZones />}
        </div>
      </main>
    </div>
  )
}
