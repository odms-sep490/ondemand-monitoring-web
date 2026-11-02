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

const enc = encodeURIComponent

export const deliveryApi = {
  get: (orderId: string, signal?: AbortSignal) =>
    apiRequest<Delivery>(`/api/orders/${enc(orderId)}/delivery`, { signal }),
  previews: (orderId: string, signal?: AbortSignal) =>
    apiRequest<Delivery>(`/api/orders/${enc(orderId)}/deliverables/preview`, {
      signal,
    }),
  originals: (orderId: string, signal?: AbortSignal) =>
    apiRequest<Delivery>(`/api/orders/${enc(orderId)}/deliverables`, {
      signal,
    }),
  getResultReview: (orderId: string, signal?: AbortSignal) =>
    apiRequest<ResultReview>(`/api/orders/${enc(orderId)}/result-review?size=100`, {
      signal,
    }),
  accept: (
    orderId: string,
    reviewRoundId: string,
    expectedRoundVersion: number,
  ) =>
    apiRequest<void>(`/api/orders/${enc(orderId)}/result/accept`, {
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
  managerGet: (orderId: string, signal?: AbortSignal) =>
    apiRequest<Delivery>(`/api/manager/orders/${enc(orderId)}/delivery`, {
      signal,
    }),
  releasePreview: (orderId: string, mediaAssetIds: string[], notes: string) =>
    apiRequest<Delivery>(
      `/api/manager/orders/${enc(orderId)}/delivery/release-preview`,
      {
        method: 'POST',
        body: { mediaAssetIds, notes: notes || null },
      },
    ),
  releaseOriginals: (orderId: string) =>
    apiRequest<Delivery>(
      `/api/manager/orders/${enc(orderId)}/delivery/release-originals`,
      { method: 'POST' },
    ),
}
