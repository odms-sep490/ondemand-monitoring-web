export type MissionState =
  | 'WAITING_DEPOSIT'
  | 'WAITING_CREW_CONFIRMATION'
  | 'WAITING_OPERATOR_ACCEPTANCE'
  | 'RESOURCE_ASSIGNING'
  | 'SCHEDULED'
  | 'CONNECTED'
  | 'PREFLIGHT_CHECKING'
  | 'READY_TO_FLY'
  | 'FAILED_PREFLIGHT'
  | 'PENDING_APPROVAL'
  | 'IN_FLIGHT'
  | 'RETURNING'
  | 'POSTFLIGHT_CHECKING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'

export type DroneState =
  'AVAILABLE' | 'PREFLIGHT' | 'ACTIVE_MISSION' | 'IDLE_CHARGING' | 'MAINTENANCE'

export type CheckStatus = 'PASS' | 'FAIL' | 'WARNING' | 'PENDING'

export interface CheckItem {
  id: string
  label: string
  icon: 'battery' | 'gps' | 'camera' | 'storage' | 'signal' | 'weather'
  value: string
  requirement: string
  status: CheckStatus
  explanation: string
  action?: string
}

export interface Drone {
  id: string
  name: string
  model: string
  serialNumber: string
  state: DroneState
  battery: number // %
  gpsCount: number // satellites
  gpsHdop: number
  altitude: number // m AGL
  groundSpeed: number // m/s
  verticalSpeed: number // m/s
  heading: number // degrees
  lat: number
  lng: number
  storageMB: number
  telemetryAge: number // seconds
  cameraOk: boolean
  gimbalOk: boolean
  rssi: number // %
  voltage: number // V
  currentAmps: number
  tempC: number
}

export interface Mission {
  id: string
  backendId?: string
  orderRef: string
  orderTitle?: string
  title: string
  state: MissionState
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL'
  droneId: string
  droneCode?: string
  droneName?: string
  operatorId: string
  customer: string
  location: string
  lat: number
  lng: number
  scheduledAt: string
  estimatedMinutes: number
  distanceKm: number
  flightPlanId: string
  maxAltitudeM: number
  notes: string
  rejectionReason?: string
  targetSimX?: number
  targetSimY?: number
  routePoints?: MissionRoutePoint[]
  planSummary?: MissionPlanSummary
}

export interface MissionPlanSummary {
  planningAlgorithm?: string
  plannedDistanceM?: number | null
  estimatedEnergyMah?: number | null
  estimatedBatteryUsedPercent?: number | null
  batteryCapacityMah?: number | null
  availableBatteryPercentAtPlanning?: number | null
  estimatedRemainingBatteryPercent?: number | null
  safetyReservePercent?: number | null
  requiredBatteryPercent?: number | null
  feasibilityStatus?: string
}

export interface MissionRoutePoint {
  id: string
  sequence: number
  simX: number
  simY: number
  altitudeM: number
  speedMps?: number
  reason: string
}

export interface FlightToken {
  token: string
  issuedAt: number
  expiresAt: number
  missionId: string
  droneId: string
}

export type Role = 'operator' | 'customer' | 'manager' | 'sysop' | 'admin'

export type Screen =
  | 'operator-overview'
  | 'customer-overview'
  | 'manager-overview'
  | 'sysop-overview'
  | 'admin-overview'
  | 'mission-list'
  | 'mission-detail'
  | 'accept-reject'
  | 'gcs-connect'
  | 'preflight'
  | 'preflight-failure'
  | 'drone-replacement'
  | 'control-handover'
  | 'ready-to-fly'
  | 'in-flight'
  | 'return-to-base'
  | 'postflight'
  | 'mission-completed'
  | 'mission-failed'
  | 'media-upload'
  | 'manual-upload'
  | 'simulation-zones'

export type NavId =
  | 'dashboard'
  | 'my-missions'
  | 'mission-control'
  | 'preflight'
  | 'media'
  | 'history'
  | 'zone-map'
  | 'my-requests'
  | 'media-downloads'
  | 'billing'
  | 'support'
  | 'team'
  | 'approvals'
  | 'fleet'
  | 'reports'
  | 'fleet-health'
  | 'maintenance'
  | 'systems'
  | 'sys-alerts'
  | 'users'
  | 'configuration'
  | 'audit'
  | 'integrations'
  | 'notifications'
  | 'profile'

export type ChecklistScenario =
  | 'all-pass'
  | 'battery-fail'
  | 'hardware-fail'
  | 'telemetry-stale'
  | 'weather-warn'
