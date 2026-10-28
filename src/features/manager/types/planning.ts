import type { OrderChecklistSnapshot } from './orders'

export type ExecutionPlanCoverage = {
  total: number
  covered: number
  uncovered: number
  repeated: number
  coverageReady: boolean
  uncoveredItemIds: string[]
}
export type ExecutionPlan = {
  orderId: string
  planStatus: 'DRAFT' | 'FINALIZED'
  revision: number
  missions: {
    missionId: string
    scopeLabel: string
    assignmentCount: number
    checklistItemIds?: string[]
    finalizedPlanRevision?: number | null
  }[]
  coverage: ExecutionPlanCoverage
  blockers: string[]
}
export type MissionChecklistAssignment = {
  assignmentId: string
  orderChecklistItemId: string
  content: string
  sourceType: OrderChecklistSnapshot['sourceType']
  displayOrder: number
  active: boolean
  version: number | null
}
export type ChecklistAssignmentSelection = {
  missionId: string
  revision: number
  assignments: MissionChecklistAssignment[]
}
export type RevisionReasonRequest = {
  expectedPlanRevision: number
  reason: string
}
export type MissionCancellationResponse = {
  missionId: string
  status: 'CANCELLED'
  resourcePrepareStatus: 'CANCELLED'
  executionPlanRevision: number
  cancelledAt: string
  cancelledBy: string
  cancellationReason: string
}
export type SafeStopStatus =
  'REQUESTED' | 'IN_PROGRESS' | 'READY_FOR_CANCELLATION' | 'FAILED'
export type SafeStop = {
  missionId: string
  status: SafeStopStatus | null
  requestedAt: string | null
  confirmedAt: string | null
  cleanedAt: string | null
  failureReason: string | null
  requiresLanding: boolean
  requestedBy?: string | null
  reason?: string | null
  confirmedBy?: string | null
  confirmation?: string | null
  // Optional during coordinated deployment with older BE: absent always means false, never role/status inference.
  canRequestSafeStop?: boolean
  canConfirmSafeStop?: boolean
  canCleanupSafeStop?: boolean
  canCancelMission?: boolean
}
