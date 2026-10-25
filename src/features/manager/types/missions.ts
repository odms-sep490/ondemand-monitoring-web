// Types for MNG-04 (create mission from an approved order) and MNG-05
// (resource dispatch). Field names follow [BE] `MissionResponse` / brief
// `flight_plan` / `flight_waypoint` / `mission_drone_assignment` /
// `mission_operator_assignment` tables [BRIEF §A6] where they overlap.
import type { DroneStatus, MissionStatus } from '../../../shared/types/domain'
import type { WaypointAction } from '../lib/waypoints'
import type { MissionStopMetadata } from '../../mission/lib/missionOperationalState'

// Re-exported for consumers of BE-aligned mission types that also need
// DroneStatus (e.g. MissionResponse.droneCode pairs with a drone's status).
export type { DroneStatus }

/** `flight_plan.plan_type` [BRIEF §A6]. */
export type PlanType = 'ORBIT' | 'GRID' | 'POINT'

/** `flight_plan.generated_by` [BRIEF §A6]. */
export type PlanGeneratedBy = 'SYSTEM' | 'MANUAL'

export type FlightPermitStatus =
  'NOT_REQUESTED' | 'PENDING' | 'APPROVED' | 'REJECTED'

export type FlightPermitUpdateRequest = {
  status: FlightPermitStatus
  note: string | null
  fileName?: string | null
  contentType?: string | null
  dataUrl?: string | null
}

export type MissionWaypoint = {
  seq: number
  action: WaypointAction
  lat: number
  lon: number
  altM: number
}

/** `flight_plan` row [BRIEF §A6], attached to a mission by API 1. */
export type FlightPlan = {
  planType: PlanType
  centerLat: number
  centerLon: number
  radiusM: number
  altitudeM: number
  /** null when no drone-specific cruise speed has been sourced yet. */
  speedMs: number | null
  estimatedDurationSec: number
  generatedBy: PlanGeneratedBy
}

export type MissionMediaRequirement =
  | { mediaType: 'VIDEO'; quantity: number; durationSec: number }
  | { mediaType: 'PHOTO'; quantity: number; width: number; height: number }
  | { mediaType: 'LIVESTREAM'; quantity: number; durationSec: number }

/**
 * `GET /api/missions/{id}` [BE `MissionResponse`] plus brief-only fields
 * (`flightPlan`, `waypoints`, `mediaRequirements`, `requiredSensor`,
 * `nearestBase`, assignment ids) marked PROPOSED where MissionResponse
 * itself has no matching field — needed by MNG-04/05 but not present on
 * the backend DTO we read.
 */
export type Mission = MissionStopMetadata & {
  id: string
  orderId: string
  orderCode: string | null
  missionCode: string
  status: MissionStatus
  flightPermitStatus?: FlightPermitStatus | null
  flightPermitNote?: string | null
  flightPermitFileName?: string | null
  flightPermitContentType?: string | null
  flightPermitDataUrl?: string | null
  attemptNumber: number | null
  droneId: string | null
  operatorId: string | null
  /** PROPOSED — id of the current `mission_drone_assignment` row, needed for release. */
  droneAssignmentId: string | null
  /** PROPOSED — id of the current `mission_operator_assignment` row, needed for release. */
  operatorAssignmentId: string | null
  scheduledStartAt: string | null
  scheduledEndAt: string | null
  addressText: string | null
  centerLat: number | null
  centerLon: number | null
  radiusM: number | null
  /** PROPOSED — `flight_plan.mission_id` requires a required sensor per media_requirement; brief has no single field, MNG-05 renders one value. */
  requiredSensor: string | null
  nearestBase: string | null
  mediaRequirements: MissionMediaRequirement[]
  flightPlan: FlightPlan | null
  waypoints: MissionWaypoint[]
}

/**
 * Item returned by `GET /api/missions?from=&to=&status=` [TK].
 * Extends `Mission` with display-only fields from the calendar/live seed.
 */
export type MissionCalendarItem = Mission & {
  /** PROPOSED — derived from `mission.service_label` or order title; null when not sourced. */
  serviceLabel: string | null
  droneCode: string | null
  droneName: string | null
  operatorName: string | null
  staffAssignments?: MissionStaffAssignmentResponse[]
}

/** Body of `PATCH /api/missions/{id}/schedule` [ĐỀ XUẤT]. */
export type PatchScheduleRequest = {
  scheduledStart: string
  scheduledEnd: string
}

/** Active incident, returned inside `GET /api/missions/{id}/live` [ĐỀ XUẤT]. */
export type MissionIncident = {
  id: string
  type: string
  description: string
  reportedAt: string
}

/**
 * PROPOSED — livestream session state, nested in `LiveTelemetry`.
 * Fields come from brief's `live_stream_session` mention; WebRTC spike
 * is out-of-scope per evd/00-PLAN.md §8.
 */
export type LivestreamState = {
  sessionId: string
  /** null until a real WebRTC/RTSP URL is available. */
  playbackUrl: string | null
  isLive: boolean
}

/**
 * `GET /api/missions/{id}/live` response [BRIEF C4].
 * Polling endpoint; field names follow the design's data labels from
 * evd/design/MNG-07.dc.html verbatim.
 */
export type LiveTelemetry = {
  missionStatus: MissionStatus
  /** null when drone not assigned or telemetry unavailable. */
  droneStatus: string | null
  droneCode: string | null
  droneName: string | null
  operatorName: string | null
  /** Battery percentage 0–100; null when no telemetry. */
  batteryPct: number | null
  /** Seconds in flight; null when not in-flight. */
  flightTimeSec: number | null
  latitude: number | null
  longitude: number | null
  /** Altitude in metres ASL; null when no telemetry. */
  altitudeM: number | null
  /** Speed in m/s; null when no telemetry. */
  speedMs: number | null
  /** Signal strength in dBm; PROPOSED. */
  signalDbm: number | null
  /** GPS satellite count; null when no telemetry. */
  satelliteCount: number | null
  connectionStatus: string | null
  telemetryActive: boolean
  lastTelemetryAt: string | null
  activeIncidents: MissionIncident[]
  /** null when no livestream session exists. PROPOSED — see LivestreamState. */
  livestream: LivestreamState | null
}

/** Body of `POST /api/missions/{id}/incidents` [ĐỀ XUẤT]. */
export type CreateIncidentRequest = {
  type: string
  description: string
}

/** Body of `POST /api/missions/{id}/cancel` [ĐỀ XUẤT]. */
export type CancelMissionRequest = {
  expectedPlanRevision: number
  reason: string
}

/** Body of `POST /api/missions/{orderId}`. */
export type CreateMissionRequest = {
  scopeLabel: string
  scheduledStart: string
  scheduledEnd: string
  checklistIds: string[]
}

export type ResourceCandidateBase = {
  score: number
  /** (AI diễn giải, điểm số do hệ thống tính) [TK MNG-05]. */
  reason: string
}

export type DroneCandidate = ResourceCandidateBase & {
  code: string
  name: string
  serialNumber: string
  droneModelName: string
  batteryPct: number
  distanceKm: number
  enduranceMarginPct: number
  payload: string
  hoursSinceMaintenance: number
}

export type OperatorCandidate = ResourceCandidateBase & {
  code: string
  fullName: string
  licenseClass: string
  licenseNumber: string
  licenseExpiry: string
  missionsWithModel: number
  successRatePct: number
  acceptanceRatePct: number
  missionsThisWeek: number
}

export type RejectedDrone = { code: string; reason: string }
export type RejectedOperator = { name: string; reason: string }

export type AlternativeSlot = {
  priority: number
  label: string
  dateLabel: string
  windowLabel: string
  eligibleDroneCount: number
  eligibleOperatorCount: number
}

export type TimelineBooking = {
  missionCode: string
  start: string | null
  end: string | null
  conflict: boolean
}

export type TimelineResource = {
  code: string
  name: string
  kind: 'DRONE' | 'OPERATOR'
  rejected: boolean
  rejectedReason: string | null
  bookings: TimelineBooking[]
}

/**
 * `GET /api/missions/{id}/resource-suggestions` [BRIEF C4]. `feasible:
 * false` mirrors the MNG-05 "không đủ nguồn lực" state — `topDrones`/
 * `topOperators` are then empty and `alternatives` lists replacement dates.
 */
export type ResourceSuggestions = {
  feasible: boolean
  missionCode: string
  attemptNumber: number
  scheduledStart: string
  scheduledEnd: string
  addressText: string | null
  centerLat: number | null
  centerLon: number | null
  radiusM: number | null
  mediaSummary: string | null
  requiredDurationLabel: string | null
  requiredSensor: string | null
  nearestBase: string | null
  eligibleDroneCount: number
  eligibleOperatorCount: number
  topDrones: DroneCandidate[]
  topOperators: OperatorCandidate[]
  rejected: {
    drones: RejectedDrone[]
    operators: RejectedOperator[]
  }
  explanation: string
  timeline: {
    date: string
    windowStart: string
    windowEnd: string
    resources: TimelineResource[]
  }
  alternatives: AlternativeSlot[]
}

export type MissionPlanResponse = {
  id: string
  planningAlgorithm: 'DIRECT' | 'ASTAR_SHORTEST' | 'ASTAR_ENERGY_AWARE'
  plannedDistanceM: number
  plannedDurationSec: number
  plannedCruiseSpeedMps: number
  maxPlannedAltitudeM: number
  estimatedEnergyMah: number
  estimatedBatteryUsedPercent: number
  batteryCapacityMah: number
  availableBatteryPercentAtPlanning: number
  estimatedRemainingBatteryPercent: number
  safetyReservePercent: number
  requiredBatteryPercent: number
  feasibilityStatus:
    | 'FEASIBLE'
    | 'INSUFFICIENT_BATTERY'
    | 'BATTERY_DATA_UNAVAILABLE'
    | 'NO_SAFE_ROUTE'
    | 'INVALID_TARGET'
  planningTimeMs: number
  planVersion: number
  replanningReason: string | null
  replanningStatus: string | null
  replannedAt: string | null
  waypoints: PlanWaypointResponse[]
}

export type PlanWaypointResponse = {
  id: string
  sequence: number
  simX: number
  simY: number
  altitudeM: number
  plannedSpeedMps: number
  reason:
    | 'START'
    | 'CRUISE'
    | 'TERRAIN_CLEARANCE'
    | 'OBSTACLE_AVOIDANCE'
    | 'TARGET_APPROACH'
    | 'TARGET'
    | 'RETURN'
}

export type MissionResponse = MissionStopMetadata & {
  replacesMissionId?: string | null
  id: string
  orderId: string
  orderCode?: string | null
  orderTitle: string
  orderPreferredDateFrom?: string | null
  orderPreferredDateTo?: string | null
  orderPreferredTimeName?: string | null
  serviceName?: string | null
  customerName: string
  missionCode: string
  status: MissionStatus
  flightPermitStatus?: FlightPermitStatus | null
  flightPermitNote?: string | null
  flightPermitFileName?: string | null
  flightPermitContentType?: string | null
  flightPermitDataUrl?: string | null
  operatorId: string | null
  staffAssignments?: MissionStaffAssignmentResponse[]
  deviceAssignments?: MissionDeviceAssignmentResponse[]
  droneId: string | null
  droneCode: string | null
  deviceId?: string | null
  deviceCode?: string | null
  deviceName?: string | null
  latitude: number | null
  longitude: number | null
  address: string | null
  scheduledStartAt: string | null
  scheduledEndAt?: string | null
  startedAt: string | null
  completedAt: string | null
  actualStartAt?: string | null
  actualEndAt?: string | null
  description: string | null
  failureReason: string | null
  rejectionReason: string | null
  mediaType: 'IMAGE' | 'VIDEO' | 'STREAMING' | null
  mediaSummary?: string | null
  plan: MissionPlanResponse | null
  preflightRetryCount: number
  preflightPassed: boolean
  preflightFaultType: string | null
  preflightFailureReason: string | null
  preflightCheckedAt: string | null
}

export type MissionStaffAssignmentResponse = {
  id: string
  staffId: string
  staffName: string | null
  staffEmail: string | null
  staffPhone: string | null
  assignedRole: 'PILOT' | 'OPERATOR' | 'MAINTAINER' | 'INSPECTOR'
  responseStatus: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  assignedAt: string | null
  respondedAt: string | null
  declineReason: string | null
}

export type MissionDeviceAssignmentResponse = {
  id: string
  deviceId: string
  deviceCode: string | null
  deviceName: string | null
  deviceSerialNumber: string | null
  deviceStatus: string | null
  deviceRole: 'MAIN' | 'SUPPORT'
  checkupStatus: 'PENDING' | 'PASSED' | 'FAILED' | 'SKIPPED'
  assignedAt: string | null
}

export type FlightTokenResponse = {
  id: string
  missionId: string
  droneCode: string
  operatorId: string
  tokenValue: string
  issuedAt: string
  expiresAt: string
  used: boolean
  revoked: boolean
}

export type PreflightCheckItemStatus =
  'PENDING' | 'CHECKING' | 'PASSED' | 'FAILED'
export type PreflightCheckItemLevel = 'CRITICAL' | 'WARNING' | 'INFO'

export type PreflightCheckItem = {
  checkType: string
  checkName: string
  status: PreflightCheckItemStatus
  checkLevel: PreflightCheckItemLevel
  message: string
  checkedAt: string
}

export type PersistedPreflightCheckResponse = {
  id: string
  missionId: string
  status: 'CHECKING' | 'PASSED' | 'FAILED' | 'CANCELLED'
  totalChecks: number
  passedChecks: number
  failedChecks: number
  startedAt: string
  completedAt: string | null
  progressPercent: number
  items: PreflightCheckItem[]
}

export type PostDeviceCheckItem = {
  checkType: string
  checkName: string
  status: PreflightCheckItemStatus
  checkLevel: PreflightCheckItemLevel
  message: string | null
  checkedAt: string | null
}

export type PersistedPostDeviceCheckResponse = {
  id: string
  missionId: string
  deviceConnectionId: string | null
  deviceId: string | null
  deviceCode: string | null
  deviceName: string | null
  deviceSerialNumber: string | null
  status: 'CHECKING' | 'PASSED' | 'FAILED' | 'CANCELLED'
  totalChecks: number
  passedChecks: number
  failedChecks: number
  startedAt: string
  completedAt: string | null
  overallOk: boolean
  landingBatteryPercent: number | null
  landingBatteryState: string | null
  checkedAt: string | null
  progressPercent: number
  items: PostDeviceCheckItem[]
}

export type MissionResultStatus =
  'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED'

export type MissionResultApprovalStatus =
  'DRAFT' | 'PENDING_MANAGER_APPROVAL' | 'APPROVED' | 'REJECTED'

export type MissionResultResponse = {
  id: string
  missionId: string
  missionCode: string
  status: MissionResultStatus
  approvalStatus: MissionResultApprovalStatus
  startedAt: string | null
  endedAt: string | null
  completedAt: string | null
  submittedAt: string | null
  approvedAt: string | null
  rejectedAt: string | null
  durationSeconds: number | null
  mediaCount: number | null
  summary: string | null
  notes: string | null
  createdBy: string | null
  reviewedBy: string | null
  reviewNote: string | null
  createdAt: string | null
  updatedAt: string | null
  mediaFiles: MediaResponse[] | null
}

export type PreflightCheckResponse = {
  id: string
  droneCode: string
  missionId: string
  overallPassed: boolean
  failureReason: string | null
  faultType: string | null
  batteryPercent: number
  gpsFixType: string
  gpsSatelliteCount: number
  gyrometerOk: boolean
  accelerometerOk: boolean
  magnetometerOk: boolean
  localPositionOk: boolean
  globalPositionOk: boolean
  homePositionOk: boolean
  armable: boolean
  connected: boolean
  inAir: boolean
  flightMode: string
  cameraOk: boolean
  gimbalOk: boolean
  storageAvailableMb: number
  storageOk: boolean
  weatherOk: boolean
  weatherNotes: string | null
  flightToken: FlightTokenResponse | null
  checkedAt: string
}

export type MediaAssetResponse = {
  id: string
  droneCode: string
  missionId: string
  type: string
  storageProvider: string
  originalFileName: string
  contentType: string
  fileSize: number
  s3Bucket: string
  s3Key: string
  s3Url: string
  capturedAt: string
  createdAt: string
}

export type MediaResponse = {
  id: string
  missionId: string
  deviceId?: string | null
  droneId: string
  type: string
  status?:
    | 'UPLOAD_PENDING'
    | 'UPLOADING'
    | 'VALIDATING'
    | 'RETRY_REQUIRED'
    | 'MANUAL_UPLOAD_REQUIRED'
    | 'PENDING_MANAGER_APPROVAL'
    | 'AVAILABLE'
    | 'REJECTED'
  url: string
  expiresIn: number
  contentType: string
  fileSize: number
  capturedAt: string
  sourceType?: string | null
  sourceReferenceId?: string | null
  sourceCapturedAt?: string | null
  captureLatitude?: number | null
  captureLongitude?: number | null
  sourceDistanceMeters?: number | null
}

/** Body of `PATCH /api/missions/{id}/postflight-status` [BE]. */
export type PostFlightStatusRequest = {
  newDroneStatus: DroneStatus
  notes: string
}

/** Body of `POST /api/weather/preflight-check` [BE]. */
export type WeatherPreflightCheckRequest = {
  missionId: string
  droneCode: string
  latitude: number
  longitude: number
}

/** `POST /api/weather/preflight-check` [BE] response. */
export type WeatherPreflightCheckResponse = {
  id?: string | null
  missionId?: string | null
  deviceId?: string | null
  status: string
  safeToFly: boolean
  summary: string
  windSpeedMps: number
  windGustMps: number
  precipitationMmH: number
  visibilityKm: number
  temperatureC: number
  humidityPercent: number
  advisories: string[]
  checkedAt: string
}
