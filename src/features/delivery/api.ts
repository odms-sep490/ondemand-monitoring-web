import { apiRequest } from '../../shared/api/httpClient'
import type { Delivery } from './types'

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
  accept: (orderId: string) =>
    apiRequest<Delivery>(`/api/orders/${enc(orderId)}/result/accept`, {
      method: 'POST',
    }),
  requestRevision: (orderId: string, reason: string, mediaAssetIds: string[]) =>
    apiRequest<Delivery>(
      `/api/orders/${enc(orderId)}/result/revision-request`,
      {
        method: 'POST',
        body: { reason, mediaAssetIds },
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
