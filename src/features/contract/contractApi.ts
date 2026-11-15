import { apiRequest } from '../../shared/api/httpClient'
import type { OrderContract } from './types'
const path = (orderId: string) =>
  `/api/orders/${encodeURIComponent(orderId)}/contract`
export const contractApi = {
  get: (orderId: string, signal?: AbortSignal) =>
    apiRequest<OrderContract>(path(orderId), { signal }),
  issue: (
    orderId: string,
    quoteId: string,
    contractNumber: string,
    file: File,
  ) => {
    const body = new FormData()
    body.set('quoteId', quoteId)
    body.set('contractNumber', contractNumber)
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
  download: (orderId: string, submissionId?: string) =>
    apiRequest<{ url: string; expiresAt: string; fileName: string }>(
      `${path(orderId)}/download`,
      { method: 'POST', query: { submissionId } },
    ),
}
