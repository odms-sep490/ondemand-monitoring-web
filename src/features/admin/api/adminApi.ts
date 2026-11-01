import { apiRequest } from '../../../shared/api/httpClient'
import type {
  OrderExpirationSettingAudit,
  OrderExpirationSettings,
  UpdateOrderExpirationSettingsPayload,
} from '../types/operatingConfig'
import type { PricingPolicy, PricingPolicyPayload } from '../types/pricing'

export const adminApi = {
  listPricingPolicies: (signal?: AbortSignal) =>
    apiRequest<PricingPolicy[]>('/api/admin/pricing-policies', { signal }),
  createPricingPolicy: (body: PricingPolicyPayload) =>
    apiRequest<PricingPolicy>('/api/admin/pricing-policies', {
      method: 'POST',
      body,
    }),
  clonePricingPolicy: (id: string) =>
    apiRequest<PricingPolicy>(
      `/api/admin/pricing-policies/${encodeURIComponent(id)}/clone`,
      { method: 'POST' },
    ),
  updatePricingPolicy: (id: string, body: PricingPolicyPayload) =>
    apiRequest<PricingPolicy>(
      `/api/admin/pricing-policies/${encodeURIComponent(id)}`,
      { method: 'PUT', body },
    ),
  publishPricingPolicy: (id: string) =>
    apiRequest<PricingPolicy>(
      `/api/admin/pricing-policies/${encodeURIComponent(id)}/publish`,
      { method: 'POST' },
    ),
  // Operating Config — Quote and deposit expiration windows
  getOrderExpirationSettings: (signal?: AbortSignal) =>
    apiRequest<OrderExpirationSettings>('/api/admin/config/order-expiration', {
      signal,
    }),
  updateOrderExpirationSettings: (
    payload: UpdateOrderExpirationSettingsPayload,
  ) =>
    apiRequest<OrderExpirationSettings>('/api/admin/config/order-expiration', {
      method: 'PUT',
      body: payload,
    }),
  listOrderExpirationAudit: (signal?: AbortSignal) =>
    apiRequest<OrderExpirationSettingAudit[]>(
      '/api/admin/config/order-expiration/audit',
      { signal },
    ),
}
