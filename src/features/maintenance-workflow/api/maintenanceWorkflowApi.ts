import { apiRequest } from '../../../shared/api/httpClient'
import type {
  ActorSummary,
  EvidenceRecord,
  MaintenanceEvidenceStage,
  MaintenanceQueueItem,
  MaintenanceWorkActionType,
  MaintenanceWorkStatus,
  MaintenanceWorkflowDetail,
  PostCheckResult,
  QualifiedTechnicalOption,
} from '../types'

export type HandoverAccessoryInput = {
  itemName: string
  expectedQuantity: number
  conditionNote?: string
}

export type HandoverItemReceiptInput = {
  itemId: string
  receivedQuantity: number
  actualConditionNote?: string
  discrepancyNote?: string
}

export type PostCheckInput = {
  checkName: string
  checkMethod: string
  result: PostCheckResult
  notes?: string
  notApplicableReason?: string
  required: boolean
  evidenceRequired: boolean
  evidenceIds?: string[]
}

export const maintenanceWorkflowApi = {
  getWorkflow: (ticketId: string, signal?: AbortSignal) =>
    apiRequest<MaintenanceWorkflowDetail>(
      `/api/maintenance-tickets/${encodeURIComponent(ticketId)}/workflow`,
      { signal },
    ),

  createHandoverDraft: (body: {
    deviceId: string
    issueType: string
    severity: string
    description: string
    /** Omit to publish the ticket to the shared Technical queue. */
    technicalUserId?: string
    maintenanceReason?: string
    overallCondition?: string
    existingDamageNotes?: string
    actualHandoverAt?: string
    accessories?: HandoverAccessoryInput[]
    evidenceIds?: string[]
  }) =>
    apiRequest<MaintenanceWorkflowDetail>(
      '/api/maintenance-tickets/handover-drafts',
      { method: 'POST', body },
    ),

  saveInboundDraft: (
    ticketId: string,
    body: {
      expectedVersion?: number
      technicalUserId?: string
      maintenanceReason: string
      overallCondition: string
      existingDamageNotes?: string
      actualHandoverAt?: string
      accessories?: HandoverAccessoryInput[]
      evidenceIds?: string[]
    },
  ) =>
    apiRequest<MaintenanceWorkflowDetail>(
      `/api/maintenance-tickets/${encodeURIComponent(ticketId)}/handover`,
      { method: 'PUT', body },
    ),

  submitInboundHandover: (
    ticketId: string,
    body: { expectedVersion: number; idempotencyKey?: string },
  ) =>
    apiRequest<MaintenanceWorkflowDetail>(
      `/api/maintenance-tickets/${encodeURIComponent(ticketId)}/handover`,
      { method: 'POST', body },
    ),

  receiveHandover: (
    ticketId: string,
    body: {
      expectedVersion: number
      accepted: boolean
      hasDiscrepancy: boolean
      discrepancyNotes?: string
      rejectionReason?: string
      itemReceipts?: HandoverItemReceiptInput[]
      receiptEvidenceIds?: string[]
      idempotencyKey?: string
    },
  ) =>
    apiRequest<MaintenanceWorkflowDetail>(
      `/api/maintenance-tickets/${encodeURIComponent(ticketId)}/receive`,
      { method: 'POST', body },
    ),

  claimTicket: (ticketId: string, body: { expectedVersion: number }) =>
    apiRequest<MaintenanceWorkflowDetail>(
      `/api/maintenance-tickets/${encodeURIComponent(ticketId)}/claim`,
      { method: 'POST', body },
    ),

  releaseTicket: (ticketId: string, body: { expectedVersion: number; reason: string }) =>
    apiRequest<MaintenanceWorkflowDetail>(
      `/api/maintenance-tickets/${encodeURIComponent(ticketId)}/release`,
      { method: 'POST', body },
    ),

  startWork: (
    ticketId: string,
    body: { expectedVersion: number; notes?: string },
  ) =>
    apiRequest<MaintenanceWorkflowDetail>(
      `/api/maintenance-tickets/${encodeURIComponent(ticketId)}/start-work`,
      { method: 'POST', body },
    ),

  waitParts: (
    ticketId: string,
    body: {
      expectedVersion: number
      reason: string
      partsNeeded: string
      expectedAt?: string
    },
  ) =>
    apiRequest<MaintenanceWorkflowDetail>(
      `/api/maintenance-tickets/${encodeURIComponent(ticketId)}/wait-parts`,
      { method: 'POST', body },
    ),

  resumeWork: (
    ticketId: string,
    body: { expectedVersion: number; notes?: string },
  ) =>
    apiRequest<MaintenanceWorkflowDetail>(
      `/api/maintenance-tickets/${encodeURIComponent(ticketId)}/resume-work`,
      { method: 'POST', body },
    ),

  addWorkItem: (
    ticketId: string,
    body: {
      expectedVersion: number
      componentArea: string
      symptom?: string
      diagnosis?: string
      actionType: MaintenanceWorkActionType
      workPerformed?: string
      startedAt?: string
      endedAt?: string
      status: MaintenanceWorkStatus
      resultSummary?: string
      evidenceIds?: string[]
    },
  ) =>
    apiRequest<MaintenanceWorkflowDetail>(
      `/api/maintenance-tickets/${encodeURIComponent(ticketId)}/work-items`,
      { method: 'POST', body },
    ),

  addPartReplacement: (
    ticketId: string,
    body: {
      expectedVersion: number
      partName: string
      partNumber?: string
      oldSerial?: string
      newSerial?: string
      quantity: number
      unit: string
      replacementReason: string
      removedPartCondition?: string
      costAmount?: number
      currency?: string
      evidenceIds?: string[]
    },
  ) =>
    apiRequest<MaintenanceWorkflowDetail>(
      `/api/maintenance-tickets/${encodeURIComponent(ticketId)}/part-replacements`,
      { method: 'POST', body },
    ),

  saveReportDraft: (
    ticketId: string,
    body: {
      expectedVersion: number
      receivedConditionSummary?: string
      faultDiagnosisSummary?: string
      workSummary?: string
      partsSummary?: string
      postCheckSummary?: string
      remainingIssues?: string
      usageLimitations?: string
      followUpRecommendations?: string
      beforeEvidenceIds?: string[]
      afterEvidenceIds?: string[]
      postChecks: PostCheckInput[]
    },
  ) =>
    apiRequest<MaintenanceWorkflowDetail>(
      `/api/maintenance-tickets/${encodeURIComponent(ticketId)}/report`,
      { method: 'PUT', body },
    ),

  submitReturn: (
    ticketId: string,
    body: {
      expectedVersion: number
      managerUserId: string
      postMaintenanceCondition: string
      unfinishedWorkNotes?: string
      returnedAccessories?: HandoverAccessoryInput[]
      evidenceIds?: string[]
      idempotencyKey?: string
    },
  ) =>
    apiRequest<MaintenanceWorkflowDetail>(
      `/api/maintenance-tickets/${encodeURIComponent(ticketId)}/submit-return`,
      { method: 'POST', body },
    ),

  acceptReturn: (
    ticketId: string,
    body: {
      expectedVersion: number
      reportRevision: number
      deviceMatchConfirmed: boolean
      accessoriesMatchConfirmed: boolean
      verificationNotes?: string
      idempotencyKey?: string
    },
  ) =>
    apiRequest<MaintenanceWorkflowDetail>(
      `/api/maintenance-tickets/${encodeURIComponent(ticketId)}/accept-return`,
      { method: 'POST', body },
    ),

  requestRework: (
    ticketId: string,
    body: {
      expectedVersion: number
      reportRevision: number
      reason: string
      failedWorkItemIds?: string[]
      idempotencyKey?: string
    },
  ) =>
    apiRequest<MaintenanceWorkflowDetail>(
      `/api/maintenance-tickets/${encodeURIComponent(ticketId)}/request-rework`,
      { method: 'POST', body },
    ),

  uploadEvidence: (
    ticketId: string,
    stage: MaintenanceEvidenceStage,
    file: File,
    caption?: string,
  ) => {
    const formData = new FormData()
    formData.append('file', file)
    const query: Record<string, string> = { stage }
    if (caption) query.caption = caption
    return apiRequest<EvidenceRecord>(
      `/api/maintenance-tickets/${encodeURIComponent(ticketId)}/evidences`,
      { method: 'POST', query, body: formData },
    )
  },

  listTechnicalQueue: (
    queueType: 'POOL' | 'AWAITING_RECEIPT' | 'IN_PROGRESS' | 'ALL' = 'ALL',
    signal?: AbortSignal,
  ) =>
    apiRequest<MaintenanceQueueItem[]>(
      '/api/maintenance-tickets/queues/technical',
      { query: { queueType }, signal },
    ),

  listManagerAcceptanceQueue: (includeAll = false, signal?: AbortSignal) =>
    apiRequest<MaintenanceQueueItem[]>(
      '/api/maintenance-tickets/queues/manager-acceptance',
      { query: { includeAll: String(includeAll) }, signal },
    ),

  listQualifiedTechnicals: (signal?: AbortSignal) =>
    apiRequest<QualifiedTechnicalOption[]>(
      '/api/maintenance-tickets/qualified-technicals',
      { signal },
    ),

  listReceivingManagers: (signal?: AbortSignal) =>
    apiRequest<ActorSummary[]>(
      '/api/maintenance-tickets/receiving-managers',
      { signal },
    ),

  getReportPdfUrl: (ticketId: string, revision?: number) =>
    `/api/maintenance-tickets/${encodeURIComponent(ticketId)}/report/pdf${
      revision != null ? `?revision=${revision}` : ''
    }`,
}
