export type MaintenanceWorkflowStage =
  | 'DRAFT_HANDOVER'
  | 'AWAITING_TECHNICAL_RECEIPT'
  | 'RECEIPT_REJECTED'
  | 'RECEIVED'
  | 'IN_MAINTENANCE'
  | 'WAITING_PARTS'
  | 'AWAITING_MANAGER_ACCEPTANCE'
  | 'REWORK_REQUIRED'
  | 'COMPLETED'
  | 'CANCELLED'

export type HandoverDirection = 'INBOUND' | 'RETURN'

export type HandoverStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'RECEIVED'
  | 'RECEIVED_WITH_DISCREPANCY'
  | 'REJECTED'
  | 'ACCEPTED'
  | 'REWORK_REQUESTED'

export type MaintenanceWorkActionType =
  | 'INSPECT'
  | 'CLEAN'
  | 'CALIBRATE'
  | 'REPAIR'
  | 'REPLACE'
  | 'FIRMWARE_UPDATE'

export type MaintenanceWorkStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'BLOCKED'

export type MaintenanceReportStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'ACCEPTED'
  | 'REWORK_REQUIRED'

export type PostCheckResult = 'PASS' | 'FAIL' | 'NOT_APPLICABLE'

export type AcceptanceDecisionType = 'ACCEPTED' | 'REWORK_REQUIRED'

export type MaintenanceEvidenceStage =
  | 'INBOUND_HANDOVER'
  | 'TECHNICAL_RECEIPT'
  | 'WORK_ITEM'
  | 'PART_REPLACEMENT'
  | 'REPORT_BEFORE'
  | 'REPORT_AFTER'
  | 'POST_CHECK'
  | 'RETURN_HANDOVER'
  | 'MANAGER_ACCEPTANCE'

export type ActorSummary = {
  id: string
  fullName: string
  email: string
  role: string | null
}

export type DeviceSummary = {
  id: string
  name: string
  serialNumber: string
  deviceCode: string | null
  modelName: string | null
  status: string | null
}

export type HandoverItemRecord = {
  id: string
  itemName: string
  expectedQuantity: number
  receivedQuantity: number | null
  conditionNote: string | null
  actualConditionNote: string | null
  discrepancyNote: string | null
}

export type HandoverRecord = {
  id: string
  direction: HandoverDirection
  roundNumber: number
  revision: number
  status: HandoverStatus
  fromUser: ActorSummary | null
  toUser: ActorSummary | null
  maintenanceReason: string | null
  overallCondition: string | null
  existingDamageNotes: string | null
  unfinishedWorkNotes: string | null
  actualHandoverAt: string | null
  submittedAt: string | null
  confirmedAt: string | null
  confirmedBy: ActorSummary | null
  discrepancyNotes: string | null
  rejectionReason: string | null
  reportRevision: number | null
  evidenceIds: string[]
  receiptEvidenceIds: string[]
  locked: boolean
  items: HandoverItemRecord[]
}

export type WorkItemRecord = {
  id: string
  roundNumber: number
  componentArea: string
  symptom: string | null
  diagnosis: string | null
  actionType: MaintenanceWorkActionType
  workPerformed: string | null
  performedBy: ActorSummary | null
  startedAt: string | null
  endedAt: string | null
  status: MaintenanceWorkStatus
  resultSummary: string | null
  evidenceIds: string[]
}

export type PartReplacementRecord = {
  id: string
  roundNumber: number
  partName: string
  partNumber: string | null
  oldSerial: string | null
  newSerial: string | null
  quantity: number
  unit: string
  replacementReason: string
  removedPartCondition: string | null
  costAmount: number | null
  currency: string | null
  evidenceIds: string[]
  recordedBy: ActorSummary | null
}

export type PostCheckRecord = {
  id: string
  checkName: string
  checkMethod: string
  result: PostCheckResult
  notes: string | null
  notApplicableReason: string | null
  required: boolean
  evidenceRequired: boolean
  evidenceIds: string[]
}

export type ReportVersionRecord = {
  id: string
  roundNumber: number
  revision: number
  status: MaintenanceReportStatus
  receivedConditionSummary: string | null
  faultDiagnosisSummary: string | null
  workSummary: string | null
  partsSummary: string | null
  postCheckSummary: string | null
  remainingIssues: string | null
  usageLimitations: string | null
  followUpRecommendations: string | null
  beforeEvidenceIds: string[]
  afterEvidenceIds: string[]
  authoredBy: ActorSummary | null
  submittedAt: string | null
  locked: boolean
  postChecks: PostCheckRecord[]
}

export type AcceptanceDecisionRecord = {
  id: string
  returnHandoverId: string
  reportVersionId: string
  roundNumber: number
  reportRevision: number
  decision: AcceptanceDecisionType
  decidedBy: ActorSummary | null
  decidedAt: string
  deviceMatchConfirmed: boolean
  accessoriesMatchConfirmed: boolean
  verificationNotes: string | null
  reworkReason: string | null
  failedWorkItemIds: string[]
  checkpointCreated: boolean
  deviceUnlocked: boolean
  remainingBlockers: string[]
}

export type EvidenceRecord = {
  id: string
  stage: MaintenanceEvidenceStage
  referenceId: string | null
  storageKey: string
  fileName: string
  contentType: string
  fileSizeBytes: number
  caption: string | null
  uploadedBy: ActorSummary | null
  uploadedAt: string
  downloadUrl: string | null
}

export type WorkflowEventRecord = {
  id: string
  action: string
  fromStage: MaintenanceWorkflowStage | null
  toStage: MaintenanceWorkflowStage | null
  roundNumber: number
  revision: number | null
  actor: ActorSummary | null
  reason: string | null
  evidenceIds: string[]
  occurredAt: string
}

export type MaintenanceQueueItem = {
  ticketId: string
  ticketCode: string
  legacyStatus: string
  stage: MaintenanceWorkflowStage
  version: number
  currentRound: number
  legacyRecord: boolean
  issueType: string
  severity: string
  description: string | null
  device: DeviceSummary | null
  handedOverBy: ActorSummary | null
  assignedTechnical: ActorSummary | null
  receivingManager: ActorSummary | null
  openedAt: string
  workflowUpdatedAt: string | null
  availableActions: string[]
}

export type MaintenanceWorkflowDetail = {
  ticketId: string
  ticketCode: string
  legacyStatus: string
  stage: MaintenanceWorkflowStage
  version: number
  currentRound: number
  legacyRecord: boolean
  issueType: string
  severity: string
  description: string | null
  resolutionNotes: string | null
  waitingReason: string | null
  waitingPartsNeeded: string | null
  waitingExpectedAt: string | null
  acceptedReportRevision: number | null
  openedAt: string
  resolvedAt: string | null
  closedAt: string | null
  workflowUpdatedAt: string | null
  device: DeviceSummary | null
  handedOverBy: ActorSummary | null
  assignedTechnical: ActorSummary | null
  receivingManager: ActorSummary | null
  availableActions: string[]
  validationBlockers: string[]
  handovers: HandoverRecord[]
  workItems: WorkItemRecord[]
  partReplacements: PartReplacementRecord[]
  reportVersions: ReportVersionRecord[]
  acceptanceDecisions: AcceptanceDecisionRecord[]
  evidences: EvidenceRecord[]
  timeline: WorkflowEventRecord[]
}

export type QualifiedTechnicalOption = {
  id: string
  fullName: string
  email: string
  qualificationSource: string
}
