export type MissionStatus =
  | 'PLANNING'
  | 'CREATED'
  | 'WAITING_DEPOSIT'
  | 'READY'
  | 'RESOURCE_ASSIGNING'
  | 'WAITING_OPERATOR_ACCEPTANCE'
  | 'SCHEDULED'
  | 'CONNECTED'
  | 'PREFLIGHT_CHECKING'
  | 'READY_TO_FLY'
  | 'FAILED_PREFLIGHT'
  | 'PENDING_APPROVAL'
  | 'IN_FLIGHT'
  | 'IN_PROGRESS'
  | 'RETURNING'
  | 'POSTFLIGHT_CHECKING'
  | 'PENDING_REVIEW'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'

export type MissionResourcePrepareStatus = 'PLANNING' | 'PENDING' | 'READY'

export type DeviceStatus =
  | 'AVAILABLE'
  | 'PREFLIGHT'
  | 'ACTIVE_MISSION'
  | 'IDLE_CHARGING'
  | 'MAINTENANCE'
  | 'OFFLINE'

export type MediaType = 'IMAGE' | 'VIDEO' | 'THERMAL'

export type PlanningAlgorithm =
  'DIRECT' | 'ASTAR_SHORTEST' | 'ASTAR_ENERGY_AWARE'

export type FeasibilityStatus =
  | 'FEASIBLE'
  | 'INSUFFICIENT_BATTERY'
  | 'BATTERY_DATA_UNAVAILABLE'
  | 'NO_SAFE_ROUTE'
  | 'INVALID_TARGET'

export interface PlanWaypoint {
  id: string
  sequence: number
  simX: number
  simY: number
  altitudeM: number
  plannedSpeedMps?: number | null
  reason: 'START' | 'CRUISE' | 'TARGET'
}

export interface MissionPlan {
  id: string
  planningAlgorithm: PlanningAlgorithm
  plannedDistanceM?: number | null
  plannedDurationSec?: number | null
  plannedCruiseSpeedMps?: number | null
  maxPlannedAltitudeM?: number | null
  estimatedEnergyMah?: number | null
  estimatedBatteryUsedPercent?: number | null
  batteryCapacityMah?: number | null
  availableBatteryPercentAtPlanning?: number | null
  estimatedRemainingBatteryPercent?: number | null
  safetyReservePercent?: number | null
  requiredBatteryPercent?: number | null
  feasibilityStatus: FeasibilityStatus
  planningTimeMs?: number | null
  waypoints: PlanWaypoint[]
}

export interface Mission {
  safeStopStatus?: string | null
  safeStopRequestedAt?: string | null
  safeStopConfirmedAt?: string | null
  safeStopCleanedAt?: string | null
  id: string
  orderId?: string
  orderCode?: string | null
  orderTitle?: string
  orderPreferredDateFrom?: string | null
  orderPreferredDateTo?: string | null
  orderPreferredTimeName?: string | null
  serviceName?: string | null
  customerName?: string
  missionCode: string
  status: MissionStatus
  operatorId?: string
  staffAssignments?: MissionStaffAssignment[]
  deviceId?: string
  deviceCode?: string
  droneId?: string
  droneCode?: string
  latitude?: number
  longitude?: number
  radiusM?: number | null
  address?: string
  scheduledStartAt?: string
  scheduledEndAt?: string
  startedAt?: string
  completedAt?: string
  description?: string
  failureReason?: string
  rejectionReason?: string
  mediaType?: MediaType
  plan?: MissionPlan | null
}

export type MissionResultStatus =
  'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED'

export type MissionResultApprovalStatus =
  'DRAFT' | 'PENDING_MANAGER_APPROVAL' | 'APPROVED' | 'REJECTED'

export interface MissionResult {
  id: string
  missionId: string
  missionCode: string
  status: MissionResultStatus
  approvalStatus: MissionResultApprovalStatus
  submittedAt?: string | null
  approvedAt?: string | null
  rejectedAt?: string | null
  reviewNote?: string | null
  mediaFiles?: MissionResultMedia[] | null
}

export interface MissionResultMedia {
  id: string
  missionId: string
  deviceId?: string | null
  droneId?: string | null
  type?: string | null
  status?:
    | 'UPLOAD_PENDING'
    | 'UPLOADING'
    | 'VALIDATING'
    | 'RETRY_REQUIRED'
    | 'MANUAL_UPLOAD_REQUIRED'
    | 'PENDING_MANAGER_APPROVAL'
    | 'AVAILABLE'
    | 'REJECTED'
    | null
  url: string
  expiresIn?: number | null
  contentType?: string | null
  fileSize?: number | null
  capturedAt?: string | null
  /** DRONE_CAMERA | MANUAL_UPLOAD | MAPILLARY_REFERENCE; absent on legacy media. */
  sourceType?: string | null
  sourceReferenceId?: string | null
  sourceCapturedAt?: string | null
  sourceLatitude?: number | null
  sourceLongitude?: number | null
  captureLatitude?: number | null
  captureLongitude?: number | null
  captureAltitudeM?: number | null
  sourceDistanceMeters?: number | null
}

export interface ReferenceCaptureResult {
  mediaAssetId: string
  missionId: string
  sourceType: string
  dronePosition: {
    lat: number | null
    lon: number | null
    altitude: number | null
  }
  sourcePosition: { lat: number | null; lon: number | null }
  distanceMeters: number | null
  mapillaryImageId: string | null
  capturedAt: string | null
  mediaUrl: string | null
  duplicate?: boolean
}

export type MissionStaffRole = 'PILOT' | 'OPERATOR' | 'MAINTAINER' | 'INSPECTOR'
export type StaffResponseStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED'

export interface MissionStaffAssignment {
  id: string
  staffId: string
  staffName?: string | null
  staffEmail?: string | null
  staffPhone?: string | null
  assignedRole: MissionStaffRole
  responseStatus: StaffResponseStatus
  assignedAt?: string | null
  respondedAt?: string | null
  declineReason?: string | null
}

export interface PreflightCheck {
  id: string
  deviceCode: string
  missionId?: string
  checkedAt: string
  overallPassed: boolean
  batteryPercent: number
  batteryPassed: boolean
  gpsSatelliteCount: number
  gpsPassed: boolean
  sensorsPassed: boolean
  positioningPassed: boolean
  faultType?: 'BATTERY' | 'HARDWARE' | 'NONE'
  failureReason?: string
  flightToken?: FlightToken
  notes?: string
}

export interface FlightToken {
  id: string
  tokenValue: string
  missionId: string
  deviceCode: string
  issuedAt: string
  expiresAt: string
  usedAt?: string
  revoked: boolean
}

export interface DeviceImage {
  id: string
  missionId?: string
  deviceCode?: string
  droneId?: string
  storageKey?: string
  fileName?: string
  contentType?: string
  fileSizeBytes?: number
  capturedAt?: string
  presignedUrl?: string
}

export interface TelemetryData {
  deviceCode: string
  connected: boolean
  batteryPercent: number
  gpsSatelliteCount: number
  gpsFixType: string
  gyrometerOk: boolean
  accelerometerOk: boolean
  magnetometerOk: boolean
  localPositionOk: boolean
  globalPositionOk: boolean
  homePositionOk: boolean
  armable: boolean
  inAir: boolean
  altitude: number
  speed: number
}
