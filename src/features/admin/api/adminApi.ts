import { apiRequest } from '../../../shared/api/httpClient'
import type { AdminDashboard } from '../types/accounts'
import type {
  AdminStation,
  CreateStationPayload,
  UpdateStationPayload,
} from '../types/catalog'
import type {
  CreateNoFlyZonePayload,
  DispatchWeight,
  NoFlyZone,
  OperatingPolicy,
  OrderExpirationSettingAudit,
  OrderExpirationSettings,
  UpdateNoFlyZonePayload,
  UpdateOrderExpirationSettingsPayload,
  UpdatePolicyPayload,
  UpdateWeightsPayload,
} from '../types/operatingConfig'
import type { AuditLogFilters, AuditLogPage } from '../types/auditLog'
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
  // Dashboard
  getDashboard: (signal?: AbortSignal) =>
    apiRequest<AdminDashboard>('/api/admin/dashboard', { signal }),

  // Accounts
  // Account list/detail/create/status/update use `adminUsersApi` (real BE endpoints).
  // Catalog — Stations
  listStations: (signal?: AbortSignal) =>
    apiRequest<{ items: AdminStation[] }>('/api/admin/catalog/stations', {
      signal,
    }),

  createStation: (payload: CreateStationPayload) =>
    apiRequest<AdminStation>('/api/admin/catalog/stations', {
      method: 'POST',
      body: payload,
    }),

  updateStation: (stationId: string, payload: UpdateStationPayload) =>
    apiRequest<AdminStation>(`/api/admin/catalog/stations/${stationId}`, {
      method: 'PATCH',
      body: payload,
    }),

  toggleStationActive: (stationId: string, isActive: boolean) =>
    apiRequest<AdminStation>(`/api/admin/catalog/stations/${stationId}`, {
      method: 'PATCH',
      body: { isActive },
    }),

  // Operating Config — Policies
  listPolicies: (signal?: AbortSignal) =>
    apiRequest<{ items: OperatingPolicy[] }>('/api/admin/config/policies', {
      signal,
    }),

  updatePolicy: (policyId: string, payload: UpdatePolicyPayload) =>
    apiRequest<OperatingPolicy>(`/api/admin/config/policies/${policyId}`, {
      method: 'PATCH',
      body: payload,
    }),

  // Operating Config — Dispatch Weights
  listWeights: (signal?: AbortSignal) =>
    apiRequest<{ items: DispatchWeight[] }>('/api/admin/config/weights', {
      signal,
    }),

  updateWeights: (payload: UpdateWeightsPayload) =>
    apiRequest<{ items: DispatchWeight[] }>('/api/admin/config/weights', {
      method: 'PUT',
      body: payload,
    }),

  // Operating Config — Quote and deposit expiration windows
  getOrderExpirationSettings: (signal?: AbortSignal) =>
    apiRequest<OrderExpirationSettings>('/api/admin/config/order-expiration', {
      signal,
    }),

  updateOrderExpirationSettings: (payload: UpdateOrderExpirationSettingsPayload) =>
    apiRequest<OrderExpirationSettings>('/api/admin/config/order-expiration', {
      method: 'PUT',
      body: payload,
    }),

  listOrderExpirationAudit: (signal?: AbortSignal) =>
    apiRequest<OrderExpirationSettingAudit[]>(
      '/api/admin/config/order-expiration/audit',
      { signal },
    ),

  // Operating Config — No-fly Zones
  listNoFlyZones: (signal?: AbortSignal) =>
    apiRequest<{ items: NoFlyZone[] }>('/api/admin/config/no-fly-zones', {
      signal,
    }),

  createNoFlyZone: (payload: CreateNoFlyZonePayload) =>
    apiRequest<NoFlyZone>('/api/admin/config/no-fly-zones', {
      method: 'POST',
      body: payload,
    }),

  updateNoFlyZone: (zoneId: string, payload: UpdateNoFlyZonePayload) =>
    apiRequest<NoFlyZone>(`/api/admin/config/no-fly-zones/${zoneId}`, {
      method: 'PATCH',
      body: payload,
    }),

  // Audit Log
  listAuditLog: (filters: AuditLogFilters = {}, signal?: AbortSignal) => {
    const qs = new URLSearchParams()
    if (filters.actorId) qs.set('actorId', filters.actorId)
    if (filters.action) qs.set('action', filters.action)
    if (filters.entityType) qs.set('entityType', filters.entityType)
    if (filters.from) qs.set('from', filters.from)
    if (filters.to) qs.set('to', filters.to)
    if (filters.page) qs.set('page', String(filters.page))
    if (filters.limit) qs.set('limit', String(filters.limit))
    const query = qs.toString() ? `?${qs.toString()}` : ''
    return apiRequest<AuditLogPage>(`/api/admin/audit-log${query}`, { signal })
  },
}
