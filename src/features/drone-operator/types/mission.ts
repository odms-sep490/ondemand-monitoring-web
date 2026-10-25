import type { MissionStatus } from '../../mission/types/mission'
import type { MissionStopMetadata } from '../../mission/lib/missionOperationalState'
export type OperatorMissionStatus =
  MissionStatus | 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'UNKNOWN'

export type OperatorMission = MissionStopMetadata & {
  id: string
  missionCode?: string
  backendStatus?: string
  status: OperatorMissionStatus
  myResponseStatus?: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  title: string
  description?: string
  location: string
  date: string
  startTime: string
  endTime: string
  serviceLabel: string
  deviceId?: string | null
  deviceCode?: string | null
  deviceSerialNumber?: string | null
  deviceStatus?: string | null
  deviceModelCode?: string | null
  deviceManufacturer?: string | null
  droneCode: string | null
  droneName: string | null
  flightStartedAt?: string
  completedAt?: string
  managerSubmissionStatus?:
    'NEEDS_SUBMIT' | 'PENDING_MANAGER' | 'SENT_TO_CUSTOMER'
  permissions?: OperatorMissionPermissions
  rejectReason?: string
  acceptedAt?: string
  managerNote?: string
  managerName?: string
  managerEmail?: string
  managerPhone?: string
  respondBy?: string
  radiusMeters?: number
  ceilingMeters?: number
  latitude?: number | null
  longitude?: number | null
  targetX?: number | null
  targetY?: number | null
  photoCount?: number
  photoNote?: string
  videoCount?: number
  videoSeconds?: number
  videoResolution?: string
  droneModel?: string
  dronePayload?: string
  droneStation?: string
  droneStationDistanceKm?: number
  droneReadinessPct?: number
  droneHoursSinceMaintenance?: number
  planSummary?: OperatorMissionPlanSummary
}

export type OperatorMissionPermissions = {
  canTerminateFlight?: boolean
  canAttachChecklistEvidence?: boolean
  canDetachChecklistEvidence?: boolean
  canCompleteMission?: boolean
  canSubmitMissionResult?: boolean
  canExecuteMonitoringChecklist?: boolean
  canControlFlight: boolean
  canStartMission?: boolean
  canOperatePayload: boolean
  canInspectDevice: boolean
  canMaintainDevice: boolean
  canUploadMedia: boolean
}

export type OperatorMissionPlanSummary = {
  planningAlgorithm?: string
  feasibilityStatus?: string | null
  plannedDistanceM?: number | null
  plannedDurationSec?: number | null
  maxPlannedAltitudeM?: number | null
  estimatedEnergyMah?: number | null
  estimatedBatteryUsedPercent?: number | null
  availableBatteryPercentAtPlanning?: number | null
  estimatedRemainingBatteryPercent?: number | null
  waypointCount: number
  waypoints: OperatorMissionPlanWaypoint[]
}

export type OperatorMissionPlanWaypoint = {
  id: string
  sequence: number
  simX: number
  simY: number
  altitudeM?: number | null
  plannedSpeedMps?: number | null
  reason?: string | null
}

export type OperatorProfile = {
  id: string
  fullName: string
  email: string
  rank: string
  station: string
  certExpiry: string
}

export type OperatorMissionTab = 'pending' | 'upcoming' | 'history'

export type FlightConnection = {
  status: 'CONNECTING' | 'CONNECTED' | 'FAILED'
  token: string
  gcsId: string
  connectedAt: string
  disconnectReason?: string
}

export type ControlHandover = {
  status: 'CONFIRMED' | 'REVOKED'
  confirmedAt: string
}

export type PreflightItemKey = string

export type PreflightItemResult = 'ok' | 'fail'

export type PreflightItem = {
  key: PreflightItemKey
  result: PreflightItemResult
  note?: string
}

export type PreflightRecord = {
  items: PreflightItem[]
  savedAt: string
}

export type MediaFileType = 'PHOTO' | 'VIDEO'

export type MediaFileStatus =
  'UPLOADED' | 'UPLOADING' | 'FAILED' | 'PENDING_UPLOAD'

export type MediaFile = {
  id: string
  name: string
  type: MediaFileType
  sizeBytes: number
  progressPct: number
  attempt: number
  maxAttempts: number
  status: MediaFileStatus
  manualTaskCreated?: boolean
  validationPending?: boolean
}

export type PostflightItemKey =
  | 'battery_ok'
  | 'motor_ok'
  | 'camera_ok'
  | 'gps_ok'
  | 'communication_ok'
  | 'physical_condition_ok'

export type PostflightItem = {
  key: PostflightItemKey
  result: PreflightItemResult
}

export type PostflightRecord = {
  items: PostflightItem[]
  overallOk: boolean
  notes?: string
  savedAt: string
}

export type FaultType =
  | 'MOTOR_VIBRATION'
  | 'SIGNAL_LOSS'
  | 'BATTERY_DEGRADED'
  | 'CAMERA_GIMBAL'
  | 'PHYSICAL_DAMAGE'
  | 'OTHER'

export type MaintenanceSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type MaintenanceTicket = {
  id: string
  droneCode: string
  missionId: string
  issueType: FaultType
  severity: MaintenanceSeverity
  description: string
  createdAt: string
}
