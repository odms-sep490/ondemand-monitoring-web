import { apiRequest } from '../../shared/api/httpClient'
import type {
  OrderContract,
  ContractCancellation,
  CancellationResponsibility,
} from './types'
const path = (orderId: string) =>
  `/api/orders/${encodeURIComponent(orderId)}/contract`
export const contractApi = {
  cancellation: (orderId: string, signal?: AbortSignal) =>
    apiRequest<ContractCancellation | null>(`${path(orderId)}/cancellation`, {
      signal,
    }),
  cancel: (
    orderId: string,
    body: {
      clientRequestId: string
      expectedVersion: number
      responsibility: CancellationResponsibility
      reason: string
      basis: string | null
      customerLiabilityAcknowledged: boolean
    },
  ) =>
    apiRequest<ContractCancellation>(`${path(orderId)}/cancellation`, {
      method: 'POST',
      body,
    }),
  decideCancellation: (
    orderId: string,
    body: {
      expectedVersion: number
      responsibility: CancellationResponsibility
      basis: string
      customerLiabilityAcknowledged: boolean
    },
  ) =>
    apiRequest<ContractCancellation>(`${path(orderId)}/cancellation/decision`, {
      method: 'POST',
      body,
    }),
  get: (orderId: string, signal?: AbortSignal, quoteId?: string) =>
    apiRequest<OrderContract>(path(orderId), { signal, query: { quoteId } }),
  issue: (
    orderId: string,
    quoteId: string,
    contractNumber: string | undefined,
    file: File,
    expectedPricingRevision?: number,
  ) => {
    const body = new FormData()
    body.set('quoteId', quoteId)
    if (expectedPricingRevision != null)
      body.set('expectedPricingRevision', String(expectedPricingRevision))
    if (contractNumber?.trim())
      body.set('contractNumber', contractNumber.trim())
    body.set('file', file)
    return apiRequest<OrderContract>(`${path(orderId)}/issue`, {
      method: 'POST',
      body,
    })
  },
  submit: (orderId: string, expectedVersion: number, file: File) => {
    const body = new FormData()
    body.set('expectedVersion', String(expectedVersion))
    body.set('file', file)
    return apiRequest<OrderContract>(`${path(orderId)}/submissions`, {
      method: 'POST',
      body,
    })
  },
  confirm: (orderId: string, expectedVersion: number, submissionId: string) =>
    apiRequest<OrderContract>(`${path(orderId)}/confirm`, {
      method: 'POST',
      body: { expectedVersion, submissionId },
    }),
  requestChanges: (
    orderId: string,
    expectedVersion: number,
    submissionId: string,
    reason: string,
  ) =>
    apiRequest<OrderContract>(`${path(orderId)}/request-changes`, {
      method: 'POST',
      body: { expectedVersion, submissionId, reason },
    }),
  download: (orderId: string, submissionId?: string, quoteId?: string) =>
    apiRequest<{ url: string; expiresAt: string; fileName: string }>(
      `${path(orderId)}/download`,
      { method: 'POST', query: { submissionId, quoteId } },
    ),
}
