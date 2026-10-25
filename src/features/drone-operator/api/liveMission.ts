import type { Drone, Mission } from '../types/omss'
import type { OperatorMission, OperatorMissionStatus } from '../types/mission'
import type { MissionStopMetadata } from '../../mission/lib/missionOperationalState'

export type BackendMission = MissionStopMetadata & {
  id: string
  missionCode?: string | null
  orderId?: string | null
  orderTitle?: string | null
  serviceName?: string | null
  customerName?: string | null
  managerName?: string | null
  managerEmail?: string | null
  managerPhone?: string | null
  status: string
  operatorId?: string | null
  staffId?: string | null
  droneId?: string | null
  deviceId?: string | null
  deviceCode?: string | null
  deviceName?: string | null
  deviceSerialNumber?: string | null
  deviceStatus?: string | null
  deviceModelCode?: string | null
  deviceModelName?: string | null
  deviceManufacturer?: string | null
  devicePayload?: string | null
  droneCode?: string | null
  droneName?: string | null
  staffAssignments?: Array<{
    staffId?: string | null
    staffName?: string | null
    staffEmail?: string | null
    staffPhone?: string | null
    assignedRole?:
      'PILOT' | 'OPERATOR' | 'MAINTAINER' | 'INSPECTOR' | string | null
    responseStatus?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | string | null
  }>
  latitude?: number | null
  longitude?: number | null
  radiusM?: number | null
  radiusMeters?: number | null
  address?: string | null
  scheduledStartAt?: string | null
  scheduledEndAt?: string | null
  startedAt?: string | null
  completedAt?: string | null
  description?: string | null
  rejectionReason?: string | null
  mediaType?: string | null
  plan?: {
    id?: string | null
    planningAlgorithm?: string
    feasibilityStatus?: string | null
    plannedDistanceM?: number | null
    plannedDurationSec?: number | null
    maxPlannedAltitudeM?: number | null
    estimatedEnergyMah?: number | null
    estimatedBatteryUsedPercent?: number | null
    availableBatteryPercentAtPlanning?: number | null
    estimatedRemainingBatteryPercent?: number | null
    waypoints?: Array<{
      id?: string
      sequence?: number
      simX?: number
      simY?: number
      altitudeM?: number
      plannedSpeedMps?: number
      reason?: string
    }>
  } | null
}

const ACTIVE_MISSION_KEY = 'fieldwise.operator.activeMissionId'
const ACTIVE_FLOW_STEP_KEY = 'fieldwise.operator.activeMissionFlowStep'

export function setActiveMissionId(id: string) {
  const current = window.sessionStorage.getItem(ACTIVE_MISSION_KEY)
  window.sessionStorage.setItem(ACTIVE_MISSION_KEY, id)
  window.localStorage.setItem(ACTIVE_MISSION_KEY, id)
  if (current !== id) window.sessionStorage.setItem(ACTIVE_FLOW_STEP_KEY, '0')
}

export function clearActiveMissionId(id?: string) {
  const current = getActiveMissionId()
  if (!id || current === id) {
    window.sessionStorage.removeItem(ACTIVE_MISSION_KEY)
    window.sessionStorage.removeItem(ACTIVE_FLOW_STEP_KEY)
    window.localStorage.removeItem(ACTIVE_MISSION_KEY)
  }
}

export function getActiveMissionId(): string | null {
  const sessionId = window.sessionStorage.getItem(ACTIVE_MISSION_KEY)
  if (sessionId) return sessionId
  const storedId = window.localStorage.getItem(ACTIVE_MISSION_KEY)
  if (storedId) window.sessionStorage.setItem(ACTIVE_MISSION_KEY, storedId)
  return storedId
}

export function getActiveMissionFlowStep(): number {
  const value = Number(window.sessionStorage.getItem(ACTIVE_FLOW_STEP_KEY))
  return Number.isFinite(value) ? Math.max(0, value) : 0
}

export function markActiveMissionFlowStep(missionId: string, step: number) {
  if (window.sessionStorage.getItem(ACTIVE_MISSION_KEY) !== missionId) return
  const current = getActiveMissionFlowStep()
  window.sessionStorage.setItem(
    ACTIVE_FLOW_STEP_KEY,
    String(Math.max(current, step)),
  )
}

function localDateAndTime(iso?: string | null) {
  if (!iso) return { date: '', time: '' }
  const value = new Date(iso)
  if (Number.isNaN(value.getTime())) return { date: '', time: '' }
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(value)
  const part = (type: string) =>
    parts.find((item) => item.type === type)?.value ?? ''
  return {
    date: `${part('year')}-${part('month')}-${part('day')}`,
    time: `${part('hour')}:${part('minute')}`,
  }
}

function operatorStatus(status: string): OperatorMissionStatus {
  if (status === 'WAITING_CREW_CONFIRMATION') return 'PENDING'
  if (status === 'WAITING_OPERATOR_ACCEPTANCE') return 'PENDING'
  if (
    status === 'IN_FLIGHT' ||
    status === 'IN_PROGRESS' ||
    status === 'RETURNING'
  )
    return 'IN_FLIGHT'
  if (status === 'COMPLETED') return 'COMPLETED'
  if (status === 'FAILED' || status === 'CANCELLED') return 'FAILED'
  if (status === 'RESOURCE_ASSIGNING') return 'REJECTED'
  const remainingStatuses = [
    'CREATED',
    'SCHEDULED',
    'CONNECTED',
    'PREFLIGHT_CHECKING',
    'READY_TO_FLY',
    'FAILED_PREFLIGHT',
    'PENDING_APPROVAL',
    'POSTFLIGHT_CHECKING',
    'PENDING_REVIEW',
  ] as const
  return remainingStatuses.find((value) => value === status) ?? 'UNKNOWN'
}

function operatorStatusForAssignment(
  status: string,
  responseStatus?: string | null,
): OperatorMissionStatus {
  if (responseStatus === 'ACCEPTED') {
    return operatorStatus(status) === 'PENDING'
      ? 'ACCEPTED'
      : operatorStatus(status)
  }
  if (responseStatus === 'REJECTED') return 'REJECTED'
  return operatorStatus(status)
}

export function toOperatorMission(
  source: BackendMission,
  currentUserId?: string | null,
): OperatorMission {
  const start =
    source.scheduledStartAt ?? source.startedAt ?? source.completedAt
  const scheduled = localDateAndTime(start)
  const durationSeconds = source.plan?.plannedDurationSec
  const endSource =
    source.scheduledEndAt ??
    (start && typeof durationSeconds === 'number'
      ? new Date(
          new Date(start).getTime() + durationSeconds * 1000,
        ).toISOString()
      : null)
  const end = localDateAndTime(endSource)
  const myResponseStatus = currentUserId
    ? source.staffAssignments?.find(
        (assignment) => assignment.staffId === currentUserId,
      )?.responseStatus
    : undefined
  return {
    id: source.id,
    missionCode: source.missionCode ?? source.id,
    backendStatus: source.status,
    safeStopStatus: source.safeStopStatus,
    safeStopRequestedAt: source.safeStopRequestedAt,
    safeStopConfirmedAt: source.safeStopConfirmedAt,
    safeStopCleanedAt: source.safeStopCleanedAt,
    status: operatorStatusForAssignment(source.status, myResponseStatus),
    myResponseStatus:
      myResponseStatus === 'ACCEPTED' || myResponseStatus === 'REJECTED'
        ? myResponseStatus
        : myResponseStatus === 'PENDING'
          ? 'PENDING'
          : undefined,
    title: source.orderTitle ?? source.missionCode ?? source.id,
    description: source.description ?? '',
    location: source.address ?? '',
    date: scheduled.date,
    startTime: scheduled.time,
    endTime: end.time,
    serviceLabel: source.serviceName ?? source.mediaType ?? '—',
    managerName: source.managerName ?? undefined,
    managerEmail: source.managerEmail ?? undefined,
    managerPhone: source.managerPhone ?? undefined,
    deviceId: source.deviceId ?? source.droneId ?? null,
    deviceCode: source.deviceCode ?? null,
    deviceSerialNumber: source.deviceSerialNumber ?? null,
    deviceStatus: source.deviceStatus ?? null,
    deviceModelCode: source.deviceModelCode ?? null,
    deviceManufacturer: source.deviceManufacturer ?? null,
    droneCode: source.droneCode ?? source.deviceCode ?? source.deviceId ?? null,
    droneName: source.droneName ?? source.deviceName ?? null,
    droneModel: source.deviceModelName ?? undefined,
    dronePayload: source.devicePayload ?? undefined,
    flightStartedAt: source.startedAt ?? undefined,
    completedAt: source.completedAt ?? undefined,
    rejectReason: source.rejectionReason ?? undefined,
    radiusMeters: source.radiusM ?? source.radiusMeters ?? undefined,
    ceilingMeters: source.plan?.maxPlannedAltitudeM ?? undefined,
    latitude: source.latitude,
    longitude: source.longitude,
    targetX: source.longitude,
    targetY: source.latitude,
    planSummary: source.plan
      ? {
          planningAlgorithm: source.plan.planningAlgorithm,
          feasibilityStatus: source.plan.feasibilityStatus,
          plannedDistanceM: source.plan.plannedDistanceM,
          plannedDurationSec: source.plan.plannedDurationSec,
          maxPlannedAltitudeM: source.plan.maxPlannedAltitudeM,
          estimatedEnergyMah: source.plan.estimatedEnergyMah,
          estimatedBatteryUsedPercent: source.plan.estimatedBatteryUsedPercent,
          availableBatteryPercentAtPlanning:
            source.plan.availableBatteryPercentAtPlanning,
          estimatedRemainingBatteryPercent:
            source.plan.estimatedRemainingBatteryPercent,
          waypointCount: source.plan.waypoints?.length ?? 0,
          waypoints: (source.plan.waypoints ?? [])
            .filter(
              (point) =>
                typeof point.sequence === 'number' &&
                typeof point.simX === 'number' &&
                typeof point.simY === 'number',
            )
            .sort((a, b) => Number(a.sequence) - Number(b.sequence))
            .map((point) => ({
              id: point.id ?? `wp-${point.sequence}`,
              sequence: Number(point.sequence),
              simX: Number(point.simX),
              simY: Number(point.simY),
              altitudeM: point.altitudeM,
              plannedSpeedMps: point.plannedSpeedMps,
              reason: point.reason,
            })),
        }
      : undefined,
  }
}

export function toFlightMission(source: BackendMission): Mission {
  const points = (source.plan?.waypoints ?? [])
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
      speedMps: point.plannedSpeedMps,
      reason: point.reason ?? 'CRUISE',
    }))
  const targetPoint =
    points.find((point) => point.reason.toUpperCase() === 'TARGET') ??
    points.find((point) => point.reason.toUpperCase() === 'ORDER') ??
    points[points.length - 1]
  return {
    id: source.missionCode ?? source.id,
    backendId: source.id,
    orderRef: source.orderId ?? '',
    title: source.orderTitle ?? source.missionCode ?? source.id,
    state: source.status as Mission['state'],
    priority: 'NORMAL',
    droneId: source.deviceId ?? source.droneId ?? '',
    droneCode: source.droneCode ?? source.deviceCode ?? undefined,
    droneName: source.droneName ?? source.deviceName ?? undefined,
    operatorId: source.staffId ?? source.operatorId ?? '',
    customer: source.customerName ?? '',
    location: source.address ?? '',
    lat: source.latitude ?? 0,
    lng: source.longitude ?? 0,
    scheduledAt: source.scheduledStartAt ?? '',
    estimatedMinutes: Math.round((source.plan?.plannedDurationSec ?? 0) / 60),
    distanceKm: (source.plan?.plannedDistanceM ?? 0) / 1000,
    flightPlanId: source.plan?.id ?? '',
    maxAltitudeM: source.plan?.maxPlannedAltitudeM ?? 0,
    notes: source.description ?? '',
    targetSimX: targetPoint?.simX,
    targetSimY: targetPoint?.simY,
    routePoints: points,
  }
}

export function toFlightDrone(source: BackendMission): Drone {
  const id = source.deviceId ?? source.droneId ?? ''
  const code = source.droneCode ?? source.deviceCode ?? id
  const deviceName = source.droneName ?? source.deviceName
  const name = deviceName ? `${code} ${deviceName}` : code
  return {
    id,
    name,
    model: source.deviceModelName ?? 'Assigned mission device',
    serialNumber: source.deviceSerialNumber ?? '',
    state: source.status === 'IN_FLIGHT' ? 'ACTIVE_MISSION' : 'PREFLIGHT',
    battery: 0,
    gpsCount: 0,
    gpsHdop: 0,
    altitude: 0,
    groundSpeed: 0,
    verticalSpeed: 0,
    heading: 0,
    lat: source.latitude ?? 0,
    lng: source.longitude ?? 0,
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
