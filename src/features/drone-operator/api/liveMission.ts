import type { Drone, Mission } from '../types/omss'
import type { OperatorMission, OperatorMissionStatus } from '../types/mission'
import type { MissionDeviceAssignmentStatus } from '../../mission/types/mission'
import type { GeoJsonPolygon } from '../../../shared/types/geo'

export type BackendMission = {
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
  flightPermitStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | null
  flightPermitUpdatedAt?: string | null
  purpose?: 'ORIGINAL' | 'REWORK' | string | null
  resultRevisionCaseId?: string | null
  failureRequestedAt?: string | null
  failureReason?: string | null
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
  deviceAssignments?: Array<{
    id?: string | null
    deviceId?: string | null
    deviceCode?: string | null
    deviceName?: string | null
    deviceSerialNumber?: string | null
    deviceStatus?: string | null
    deviceRole?: string | null
    status?: MissionDeviceAssignmentStatus | null
    checkupStatus?: string | null
    assignedAt?: string | null
    replacementCompleted?: boolean | null
    replacementRequestedAt?: string | null
    replacementRequestReason?: string | null
    replacementRequestedBy?: string | null
  }>
  latitude?: number | null
  longitude?: number | null
  radiusM?: number | null
  radiusMeters?: number | null
  coverageArea?: GeoJsonPolygon | null
  altitudeM?: number | null
  address?: string | null
  scheduledStartAt?: string | null
  scheduledEndAt?: string | null
  actualStartAt?: string | null
  actualEndAt?: string | null
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

export function markActiveMissionFlowStep(missionId: string, step: number) {
  if (window.sessionStorage.getItem(ACTIVE_MISSION_KEY) !== missionId) return
  const value = Number(window.sessionStorage.getItem(ACTIVE_FLOW_STEP_KEY))
  const current = Number.isFinite(value) ? Math.max(0, value) : 0
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
  if (status === 'PENDING_CONFIRMATION') return 'PENDING'
  if (status === 'WAITING_OPERATOR_ACCEPTANCE') return 'PENDING'
  if (
    status === 'IN_FLIGHT' ||
    status === 'IN_PROGRESS' ||
    status === 'RETURNING'
  )
    return 'IN_FLIGHT'
  if (status === 'COMPLETED') return 'COMPLETED'
  if (status === 'FAILED' || status === 'CANCELLED') return 'FAILED'
  if (status === 'RESOURCE_ASSIGNING') return 'PENDING'
  const remainingStatuses = [
    'PLANNING',
    'CREATED',
    'WAITING_DEPOSIT',
    'PENDING_PAYMENT',
    'PENDING_CONFIRMATION',
    'READY',
    'RESOURCE_ASSIGNING',
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
    return status === 'READY' || operatorStatus(status) === 'PENDING'
      ? 'ACCEPTED'
      : operatorStatus(status)
  }
  if (responseStatus === 'REJECTED') return 'REJECTED'
  if (
    responseStatus === 'PENDING' &&
    (status === 'PENDING_CONFIRMATION' || status === 'READY')
  )
    return 'PENDING'
  return operatorStatus(status)
}

function operatorStatusForCrewResponse(
  missionStatus: string,
  responseStatus?: string | null,
): OperatorMissionStatus {
  const awaitingCrew = new Set([
    'PLANNING',
    'PENDING_PAYMENT',
    'PENDING_CONFIRMATION',
    'READY',
    'WAITING_OPERATOR_ACCEPTANCE',
  ])
  if (awaitingCrew.has(missionStatus)) {
    if (responseStatus === 'ACCEPTED') return 'ACCEPTED'
    if (responseStatus === 'REJECTED') return 'REJECTED'
    if (responseStatus === 'PENDING') return 'PENDING'
  }
  return operatorStatusForAssignment(missionStatus, responseStatus)
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
  const currentMainDevice = source.deviceAssignments?.find(
    (assignment) => assignment.deviceRole === 'MAIN',
  )
  const staffAssignments = source.staffAssignments
  return {
    id: source.id,
    missionCode: source.missionCode ?? source.id,
    backendStatus: source.status,
    flightPermitStatus: source.flightPermitStatus ?? null,
    flightPermitUpdatedAt: source.flightPermitUpdatedAt ?? null,
    status: operatorStatusForCrewResponse(source.status, myResponseStatus),
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
    deviceAssignments: source.deviceAssignments?.map((assignment) => ({
      id: assignment.id,
      deviceId: assignment.deviceId,
      deviceCode: assignment.deviceCode,
      deviceName: assignment.deviceName,
      deviceSerialNumber: assignment.deviceSerialNumber,
      deviceStatus: assignment.deviceStatus,
      deviceRole: assignment.deviceRole,
      status: assignment.status,
      checkupStatus: assignment.checkupStatus,
    })),
    deviceId: source.deviceId ?? source.droneId ?? null,
    deviceCode: source.deviceCode ?? null,
    deviceSerialNumber: source.deviceSerialNumber ?? null,
    deviceStatus: source.deviceStatus ?? null,
    deviceAssignmentStatus: currentMainDevice?.status ?? null,
    deviceCheckStatus:
      (currentMainDevice?.checkupStatus as
        OperatorMission['deviceCheckStatus'] | undefined) ?? null,
    deviceReplacementCompleted:
      currentMainDevice?.replacementCompleted ?? false,
    deviceReplacementRequested: Boolean(
      currentMainDevice?.replacementRequestedAt,
    ),
    deviceModelCode: source.deviceModelCode ?? null,
    deviceManufacturer: source.deviceManufacturer ?? null,
    droneCode: source.droneCode ?? source.deviceCode ?? source.deviceId ?? null,
    droneName: source.droneName ?? source.deviceName ?? null,
    droneModel: source.deviceModelName ?? undefined,
    dronePayload: source.devicePayload ?? undefined,
    flightStartedAt: source.actualStartAt ?? source.startedAt ?? undefined,
    actualEndAt: source.actualEndAt ?? undefined,
    completedAt: source.completedAt ?? undefined,
    acceptedStaffCount: staffAssignments?.filter(
      (assignment) => assignment.responseStatus === 'ACCEPTED',
    ).length,
    assignedStaffCount: staffAssignments?.length,
    rejectReason: source.rejectionReason ?? undefined,
    radiusMeters: source.radiusM ?? source.radiusMeters ?? undefined,
    coverageArea: source.coverageArea ?? null,
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
    serviceLabel: source.serviceName ?? undefined,
    state: source.status as Mission['state'],
    failureRequestedAt: source.failureRequestedAt ?? null,
    failureReason: source.failureReason ?? null,
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
    // The requested order altitude is authoritative for cockpit automation.
    // Planned altitude is only a fallback for older missions without it.
    maxAltitudeM:
      source.altitudeM ?? source.plan?.maxPlannedAltitudeM ?? 32,
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
    state:
      source.deviceStatus === 'ACTIVE_MISSION' ||
      source.status === 'IN_FLIGHT' ||
      source.status === 'IN_PROGRESS'
        ? 'ACTIVE_MISSION'
        : 'PREFLIGHT',
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
