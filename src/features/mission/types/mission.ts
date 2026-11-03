export type MissionStatus =
  | 'PLANNING'
  | 'CREATED'
  | 'WAITING_DEPOSIT'
  | 'PENDING_PAYMENT'
  | 'PENDING_CONFIRMATION'
  | 'READY'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'AWAITING_REVIEW'
  | 'PENDING_REVIEW'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  // Legacy / transition aliases kept for mock data and component compatibility:
  | 'RESOURCE_ASSIGNING'
  | 'WAITING_OPERATOR_ACCEPTANCE'
  | 'CONNECTED'
  | 'PREFLIGHT_CHECKING'
  | 'READY_TO_FLY'
  | 'FAILED_PREFLIGHT'
  | 'PENDING_APPROVAL'
  | 'IN_FLIGHT'
  | 'RETURNING'
  | 'POSTFLIGHT_CHECKING'

export type MissionCancellationResponse = {
  missionId: string
  status: 'CANCELLED'
  executionPlanRevision: number
  cancelledAt: string
  cancelledBy: string
  cancellationReason: string
}

export type MissionReworkContext = {
  missionId: string
  missionCode: string
  caseId: string
  checklists: Array<{
    caseItemId: string
    orderChecklistItemId: string
    title: string
    managerInstructions: string | null
    guidance: {
      description: string | null
      executionSteps: string[]
      inputRequirements: string[]
      expectedOutputs: string[]
    } | null
    customerFeedback: Array<{
      roundNumber: number
      reasonCode: string
      customerNote: string | null
      submittedAt: string
      evidence: Array<{
        roundEvidenceId: string
        mediaAssetId: string
        fileName: string
        mediaType: string
        url: string | null
        urlExpiresAt: string | null
        unavailableReason: string | null
      }>
    }>
  }>
}

export type MissionDeviceAssignmentStatus =
  | 'ASSIGNED'
  | 'CONNECTED'
  | 'CONNECTION_LOST'
  | 'PREFLIGHT_CHECKING'
  | 'READY_TO_FLY'
  | 'IN_PROGRESS'
  | 'RETURNING'
  | 'POSTFLIGHT_CHECKING'
  | 'COMPLETED'
  | 'FAILED'
  | 'RELEASED'

export type MissionDeviceCheckStatus =
  | 'PLANNING'
  | 'PENDING'
  | 'CHECKING'
  | 'PASSED'
  | 'FAILED'

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
  purpose?: 'ORIGINAL' | 'REWORK' | string
  resultRevisionCaseId?: string | null
  status: MissionStatus
  operatorId?: string
  staffAssignments?: MissionStaffAssignment[]
  deviceAssignments?: Array<{
    deviceId: string
    deviceRole: 'MAIN' | 'BACKUP' | string
    status: MissionDeviceAssignmentStatus
    checkupStatus: MissionDeviceCheckStatus
  }>
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
  notes?: string
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
