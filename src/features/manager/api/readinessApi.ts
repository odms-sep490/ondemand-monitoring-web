import { apiRequest } from '../../../shared/api/httpClient'
import type { CriterionResult, OrderReadiness } from '../types/readiness'

export const readinessApi = {
  get: (orderId: string, signal?: AbortSignal) =>
    apiRequest<OrderReadiness>(
      `/api/manager/orders/${encodeURIComponent(orderId)}/readiness`,
      { signal },
    ),
  answer: (
    orderId: string,
    code: string,
    body: { result: Exclude<CriterionResult, 'PENDING'>; note: string | null },
  ) =>
    apiRequest<OrderReadiness>(
      `/api/manager/orders/${encodeURIComponent(orderId)}/readiness/${encodeURIComponent(code)}`,
      { method: 'PUT', body },
    ),
}
