import { apiRequest } from '../../shared/api/httpClient'
import type { Delivery } from './types'

export type ResultReviewEvidence = {
  roundEvidenceId: string
  mediaAssetId: string
  type: string
  fileName: string
  size: number
  capturedAt: string | null
  url: string | null
  thumbnailUrl?: string | null
  previewUrl?: string | null
  previewStatus?:
    'PENDING' | 'PROCESSING' | 'READY' | 'FAILED' | 'UNSUPPORTED' | null
  urlExpiresAt: string | null
  downloadable: boolean
  accessReason: 'RETENTION_EXPIRED' | 'MEDIA_UNAVAILABLE' | null
}

export type ResultReviewItem = {
  roundItemId: string
  orderChecklistItemId: string
  title: string
  description: string | null
  executionSteps: string[]
  inputRequirements: string[]
  expectedOutputs: string[]
  missionId: string | null
  missionCode: string | null
  evidence: ResultReviewEvidence[]
  changedInRound?: boolean
  canRequestRevision?: boolean
}

export type ResultReview = {
  reviewRoundId: string
  roundNumber: number
  roundVersion: number
  publishedAt: string
  checklistRevision: number
  canSubmitRevision: boolean
  canAcceptResult: boolean
  blockedReason: string | null
  existingRequest: {
    revisionRequestId: string
    ticketId: string
    ticketCode: string
  } | null
  page: number
  size: number
  totalItems: number
  items: ResultReviewItem[]
}

export type ResultReviewHistory = {
  page: number
  size: number
  totalItems: number
  rounds: {
    reviewRoundId: string
    roundNumber: number
    roundVersion: number
    publishedAt: string
    status: string
    items: ResultReviewItem[]
  }[]
}

export type RevisionReasonCode =
  | 'MISSING_EVIDENCE'
  | 'POOR_QUALITY'
  | 'WRONG_LOCATION'
  | 'REQUIREMENT_NOT_MET'
  | 'OTHER'

export type RevisionRequestBody = {
  reviewRoundId: string
  expectedRoundVersion: number
  clientRequestId: string
  generalNote: string
  items: {
    roundItemId: string
    reasonCode: RevisionReasonCode
    note: string
    roundEvidenceIds: string[]
  }[]
}

export type RevisionRequestResponse = {
  revisionRequestId: string
  ticketId: string
  ticketCode: string
  reviewRoundId: string
  submittedAt: string
  deliveryStatus: string
}

export type ChecklistDeliveryAsset = {
  previewStatus?: ResultReviewEvidence['previewStatus']
  roundEvidenceId: string | null
  mediaAssetId: string
  type: string
  fileName: string
  size: number | null
  capturedAt: string | null
  missionId: string | null
  missionCode: string | null
  url: string | null
  thumbnailUrl?: string | null
  previewUrl?: string | null
  urlExpiresAt: string | null
  accessReason: 'RETENTION_EXPIRED' | 'MEDIA_UNAVAILABLE' | null
  changeType: 'INITIAL' | 'RETAINED' | 'ADDED' | 'REPLACEMENT' | null
}

export type ManagerChecklistDelivery = {
  orderId: string
  deliveryStatus: string
  deliveryVersion: number | null
  currentReviewRoundId: string | null
  currentReviewRoundVersion: number | null
  checklists: {
    orderChecklistItemId: string
    title: string
    minimumImageCount: number
    minimumVideoCount: number
    minimumEvidenceCount: number
    requiredEvidenceType: string
    eligibleMedia: ChecklistDeliveryAsset[]
    currentBundle: ChecklistDeliveryAsset[]
  }[]
}

export type ResultRevisionCase = {
  caseId: string
  orderId: string
  ticketId: string
  ticketCode: string
  status: string
  active: boolean
  version: number
  openedAt: string
  items: {
    caseItemId: string
    orderChecklistItemId: string
    title: string
    scopeDecision: 'PENDING' | 'IN_SCOPE' | 'OUT_OF_SCOPE'
    strategy: 'UNDECIDED' | 'RESERVE_MEDIA' | 'REWORK'
    status: string
    scopeReason: string | null
    managerInstructions: string | null
    assignedReworkMissionId: string | null
    assignedReworkMissionStatus: string | null
    version: number
    feedback: {
      requestId: string
      roundNumber: number
      reasonCode: RevisionReasonCode
      customerNote: string
      submittedAt: string
      evidence?: ResultReviewEvidence[]
    }[]
  }[]
}

export type ChecklistDeliveryPublishBody = {
  clientRequestId: string
  expectedDeliveryVersion: number | null
  baseReviewRoundId: string | null
  expectedReviewRoundVersion: number | null
  notes: string
  confirmSurplus: boolean
  surplusConfirmationFingerprint: string | null
  checklists: {
    orderChecklistItemId: string
    addMediaAssetIds: string[]
    removeRoundEvidenceIds: string[]
    replacements: { sourceRoundEvidenceId: string; newMediaAssetId: string }[]
  }[]
}

export type ChecklistDeliveryDraft = {
  orderId: string
  version: number
  caseId: string | null
  baseReviewRoundId: string | null
  expectedDeliveryVersion: number | null
  notes: string | null
  checklists: {
    orderChecklistItemId: string
    addMediaAssetIds: string[] | null
    removeRoundEvidenceIds: string[] | null
    replacements:
      { sourceRoundEvidenceId: string; newMediaAssetId: string }[] | null
  }[]
  updatedAt: string | null
  stale: boolean
}

const enc = encodeURIComponent

export type MissionDeliverySummary = {
  missionId: string
  missionCode: string
  status: Delivery['deliveryStatus']
  relatedMissionIds?: string[]
}

function scopedPath(path: string, missionId?: string) {
  return missionId
    ? `${path}${path.includes('?') ? '&' : '?'}missionId=${enc(missionId)}`
    : path
}

export const deliveryApi = {
  missionDeliveries: (orderId: string, manager = false, signal?: AbortSignal) =>
    apiRequest<MissionDeliverySummary[]>(
      manager
        ? `/api/manager/orders/${enc(orderId)}/delivery/missions`
        : `/api/orders/${enc(orderId)}/mission-deliveries`,
      { signal },
    ),
  get: (orderId: string, signal?: AbortSignal, missionId?: string) =>
    apiRequest<Delivery>(
      scopedPath(`/api/orders/${enc(orderId)}/delivery`, missionId),
      { signal },
    ),
  previews: (orderId: string, signal?: AbortSignal, missionId?: string) =>
    apiRequest<Delivery>(
      scopedPath(`/api/orders/${enc(orderId)}/deliverables/preview`, missionId),
      {
        signal,
      },
    ),
  originals: (orderId: string, signal?: AbortSignal, missionId?: string) =>
    apiRequest<Delivery>(
      scopedPath(`/api/orders/${enc(orderId)}/deliverables`, missionId),
      {
        signal,
      },
    ),
  getResultReview: (
    orderId: string,
    signal?: AbortSignal,
    missionId?: string,
  ) =>
    apiRequest<ResultReview>(
      scopedPath(
        `/api/orders/${enc(orderId)}/result-review?size=100`,
        missionId,
      ),
      {
        signal,
      },
    ),
  getResultReviewHistory: (
    orderId: string,
    signal?: AbortSignal,
    missionId?: string,
  ) =>
    apiRequest<ResultReviewHistory>(
      scopedPath(
        `/api/orders/${enc(orderId)}/result-review/history?page=0&size=20`,
        missionId,
      ),
      { signal },
    ),
  accept: (
    orderId: string,
    reviewRoundId: string,
    expectedRoundVersion: number,
  ) =>
    apiRequest<Delivery>(`/api/orders/${enc(orderId)}/result/accept`, {
      method: 'POST',
      body: { expectedReviewRoundId: reviewRoundId, expectedRoundVersion },
    }),
  requestRevision: (orderId: string, body: RevisionRequestBody) =>
    apiRequest<RevisionRequestResponse>(
      `/api/orders/${enc(orderId)}/result/revision-request`,
      {
        method: 'POST',
        body,
      },
    ),
  managerGet: (orderId: string, signal?: AbortSignal, missionId?: string) =>
    apiRequest<Delivery>(
      scopedPath(`/api/manager/orders/${enc(orderId)}/delivery`, missionId),
      {
        signal,
      },
    ),
  managerGetChecklists: (
    orderId: string,
    signal?: AbortSignal,
    missionId?: string,
  ) =>
    apiRequest<ManagerChecklistDelivery>(
      scopedPath(
        `/api/manager/orders/${enc(orderId)}/delivery/checklists`,
        missionId,
      ),
      { signal },
    ),
  managerGetChecklistDraft: (
    orderId: string,
    signal?: AbortSignal,
    missionId?: string,
  ) =>
    apiRequest<ChecklistDeliveryDraft>(
      scopedPath(
        `/api/manager/orders/${enc(orderId)}/delivery/draft`,
        missionId,
      ),
      { signal },
    ),
  managerSaveChecklistDraft: (
    orderId: string,
    body: Omit<
      ChecklistDeliveryDraft,
      'orderId' | 'updatedAt' | 'stale' | 'version'
    > & { expectedDraftVersion: number },
    missionId?: string,
  ) =>
    apiRequest<ChecklistDeliveryDraft>(
      scopedPath(
        `/api/manager/orders/${enc(orderId)}/delivery/draft`,
        missionId,
      ),
      { method: 'PUT', body },
    ),
  managerClearChecklistDraft: (
    orderId: string,
    expectedDraftVersion: number,
    missionId?: string,
  ) =>
    apiRequest<void>(
      scopedPath(
        `/api/manager/orders/${enc(orderId)}/delivery/draft?expectedDraftVersion=${expectedDraftVersion}`,
        missionId,
      ),
      {
        method: 'DELETE',
      },
    ),
  managerPublishChecklists: (
    orderId: string,
    body: ChecklistDeliveryPublishBody,
    missionId?: string,
  ) =>
    apiRequest<Delivery>(
      scopedPath(
        `/api/manager/orders/${enc(orderId)}/delivery/checklists/publish`,
        missionId,
      ),
      { method: 'POST', body },
    ),
  managerGetRevisionCase: (orderId: string, signal?: AbortSignal) =>
    apiRequest<ResultRevisionCase>(
      `/api/manager/orders/${enc(orderId)}/result-revision-case`,
      { signal },
    ),
  managerDecideRevisionCaseItem: (
    caseId: string,
    caseItemId: string,
    body: {
      expectedVersion: number
      scopeDecision: 'IN_SCOPE' | 'OUT_OF_SCOPE'
      strategy: 'UNDECIDED' | 'RESERVE_MEDIA' | 'REWORK'
      reason: string
      managerInstructions: string
    },
  ) =>
    apiRequest<ResultRevisionCase>(
      `/api/manager/result-revision-cases/${enc(caseId)}/items/${enc(caseItemId)}/decision`,
      { method: 'PUT', body },
    ),
  managerNotifyOutOfScope: (
    caseId: string,
    caseItemId: string,
    body: { expectedVersion: number; clientRequestId: string },
  ) =>
    apiRequest<ResultRevisionCase>(
      `/api/manager/result-revision-cases/${enc(caseId)}/items/${enc(caseItemId)}/notify-out-of-scope`,
      { method: 'POST', body },
    ),
  managerFinalizeReworkPlan: (caseId: string, expectedPlanRevision: number) =>
    apiRequest<void>(
      `/api/manager/result-revision-cases/${enc(caseId)}/rework-plan/finalize`,
      {
        method: 'POST',
        body: { expectedPlanRevision, decompositionConfirmed: true },
      },
    ),
  managerCreateReworkMission: (
    caseId: string,
    body: {
      expectedCaseVersion: number
      clientRequestId: string
      scopeLabel: string
      scheduledStartAt: string
      scheduledEndAt: string
      caseItemIds: string[]
    },
  ) =>
    apiRequest<{
      caseId: string
      missionId: string
      missionCode: string
      status: string
      checklistCount: number
    }>(`/api/manager/result-revision-cases/${enc(caseId)}/rework-missions`, {
      method: 'POST',
      body,
    }),
  releasePreview: (orderId: string, mediaAssetIds: string[], notes: string) =>
    apiRequest<Delivery>(
      `/api/manager/orders/${enc(orderId)}/delivery/release-preview`,
      {
        method: 'POST',
        body: { mediaAssetIds, notes: notes || null },
      },
    ),
  releaseOriginals: (orderId: string, missionId?: string) =>
    apiRequest<Delivery>(
      scopedPath(
        `/api/manager/orders/${enc(orderId)}/delivery/release-originals`,
        missionId,
      ),
      { method: 'POST' },
    ),
}
