export type UsageSource =
  | 'TELEMETRY_ACTUAL'
  | 'VERIFIED_MANUAL'
  | 'ASSIGNMENT_ESTIMATED'
  | 'MISSION_ESTIMATED'
  | 'MIXED'
  | 'UNKNOWN'

export type PolicyFamily = 'MAINTENANCE' | 'WORKFORCE' | 'ALLOCATION'

export interface OverviewResponse {
  totalDevices: number
  healthyDevices: number
  warningDevices: number
  blockedDevices: number
  unknownHealthDevices: number
  totalStaff: number
  warningStaff: number
  blockedStaff: number
  openAlerts: number
  activeMaintenanceCycles: number
  activePolicies: number
  batteryCapabilityNote: string
}

export interface DroneHealthResponse {
  deviceId: string
  deviceName: string
  serialNumber: string
  modelId: string | null
  modelName: string | null
  operationalStatus: string
  maintenanceStatus: string
  lifetimeActualSeconds: number | null
  lifetimeEstimatedSeconds: number
  sinceMaintenanceSeconds: number | null
  sinceMaintenanceCycles: number
  lifetimeCycles: number
  measuredDistanceMeters: number | null
  remainingSeconds: number | null
  remainingCycles: number | null
  remainingDays: number | null
  utilizationPercent: number | null
  activePolicyId: string | null
  activePolicyName: string | null
  activePolicyRevision: number
  usageSource: UsageSource
  blocked: boolean
  openTicketId: string | null
  openCycleId: string | null
  lastMaintenanceAt: string | null
  reasons: string[]
  batteryTrackingStatus: string
}

export interface StaffWorkloadResponse {
  staffId: string
  fullName: string
  email: string
  dailyActualSeconds: number
  dailyEstimatedSeconds: number
  weeklyActualSeconds: number
  weeklyEstimatedSeconds: number
  monthlyActualSeconds: number
  monthlyEstimatedSeconds: number
  yearlyActualSeconds?: number
  yearlyEstimatedSeconds?: number
  restSecondsBeforeNextMission: number | null
  workloadStatus: string
  maxUtilizationPercent: number | null
  blocked: boolean
  activePolicyId: string | null
  activePolicyName: string | null
  blockingReasons: string[]
  warningReasons: string[]
}

export interface UsageRequest {
  resourceId: string
  resourceKind: 'DEVICE' | 'STAFF'
  missionId?: string | null
  assignmentId?: string | null
  role?: string | null
  startedAt: string
  endedAt: string
  seconds: number
  cycles?: number | null
  distanceM?: number | null
  idempotencyKey: string
  reason: string
  evidenceReference: string
  supersedes?: string | null
}

export interface UsageResponse {
  id: string
  resourceId: string
  resourceKind: 'DEVICE' | 'STAFF'
  missionId: string | null
  assignmentId: string | null
  role: string | null
  startedAt: string
  endedAt: string
  actualSeconds: number
  estimatedSeconds: number
  cycles: number | null
  distanceM: number | null
  source: UsageSource
  status: 'PENDING' | 'VERIFIED' | 'SUPERSEDED'
  evidenceReference: string | null
  reason: string
  idempotencyKey: string
  createdBy: string
  createdAt: string
  verifiedBy: string | null
  verifiedAt: string | null
  supersedes: string | null
}

export interface PolicyRequest {
  family: PolicyFamily
  targetId: string
  name: string
  effectiveAt: string
  rules: Record<string, unknown>
  reason: string
  expectedRevision: number
}

export interface PolicyResponse {
  id: string
  family: PolicyFamily
  targetId: string
  name: string
  revision: number
  active: boolean
  effectiveAt: string
  rules: Record<string, unknown>
  reason: string
  createdBy: string
  updatedAt: string
}

export interface PolicyVersionResponse {
  policyId: string
  revision: number
  snapshot: Record<string, unknown>
  actorId: string
  action: string
  createdAt: string
}

export interface ImpactedResource {
  resourceId: string
  displayName: string
  previousStatus: string
  projectedStatus: string
  reasons: string[]
}

export interface PolicyImpactPreview {
  policyId: string
  family: PolicyFamily
  targetId: string
  totalEvaluated: number
  newlyBlockedCount: number
  newlyWarningCount: number
  impactedResources: ImpactedResource[]
}

export interface MaintenanceCycleResponse {
  id: string
  deviceId: string
  deviceName: string
  policyId: string
  policyName: string
  cycle: number
  ticketId: string | null
  ticketCode: string | null
  ticketStatus: string | null
  detectedAt: string
  workNotes: string | null
  evidenceReference: string | null
  completedBy: string | null
  submittedAt: string | null
  inspectionPassed: boolean | null
  inspectedBy: string | null
  inspectedAt: string | null
  checkpointAt: string | null
  checkpointSeconds: number | null
  checkpointCycles: number | null
}

export interface AlertResponse {
  id: string
  resourceId: string
  missionId: string | null
  type: string
  severity: string
  description: string
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED'
  detectedAt: string
  acknowledgedBy: string | null
  resolvedBy: string | null
  resolutionNote: string | null
  updatedAt: string
}

export interface ScheduleForecastItem {
  deviceId: string
  deviceName: string
  currentSinceMaintenanceSeconds: number | null
  scheduledProjectedSeconds: number
  remainingSecondsAfterSchedule: number | null
  projectedBreach: boolean
  forecastBasis: string
}

export interface AuditLogResponse {
  id: string
  actorId: string
  action: string
  entityId: string
  beforeJson: Record<string, unknown>
  afterJson: Record<string, unknown>
  reason: string
  createdAt: string
}

export interface ScoredCandidate {
  resourceId: string
  resourceKind: string
  displayName: string
  eligible: boolean
  totalScore: number | null
  scoreBreakdown: Record<string, number>
  missingDataFlags: string[]
  blockingReasons: string[]
  warningReasons: string[]
}

export interface RecommendationResponse {
  evaluationId: string
  missionId: string
  algorithmVersion: string
  componentType: string
  elapsedMs: number
  aiExplanation: string
  aiExplanationAvailable: boolean
  devices: ScoredCandidate[]
  staff: ScoredCandidate[]
}
