import { apiRequest } from '../../../shared/api/httpClient'
import { displayOrderCode } from '../../../shared/lib/orderCode'
import type { OrderStatus } from '../../../shared/types/domain'
import type { CustomerOrderItem } from '../types/orders'
import { normalizeStatus } from '../lib/orders/mapOrder'
import type { OrderCreateResponse } from './orderApi'
import type {
  ChecklistInput,
  ServiceChecklistItem,
} from '../lib/checklist/types'

export type FindingDecision = {
  findingId: string
  state: 'ACCEPTED' | 'IGNORED'
}

export type CreateOrderPayload = {
  checklistItems?: ChecklistInput[] | null
  title: string
  description?: string
  serviceId: string
  address?: string
  longitude: number
  latitude: number
  coverageArea: GeoJsonPolygon
  preferredDateFrom: string
  preferredDateTo: string
  preferredTimeId: string
  recurrenceType?: string
  recurrenceOccurrences?: number
  weatherFallback?: string
  resultDeadline?: string
  usagePurpose?: string
  flightPurpose?: string
  altitudeM?: number
  estimatedLengthM?: number
  siteContactName?: string
  siteContactPhone?: string
  accessNotes?: string
  monitoringRelationship?: string
  monitoringAuthorizationConfirmed?: boolean
  monitoringAuthorizationDocuments?: Array<{
    id: string
    documentType: string
    documentName: string
    fileName: string
    contentType: string
    sizeBytes: number
    dataUrl: string
    notes?: string
  }>
  resultFormats?: string[]
  deliveryMethods?: string[]
  dataRetentionDays?: number
  termsAccepted?: boolean
  deliverables: Array<{
    deliverableTypeId: string
    requirement: Record<string, unknown>
  }>
}

export type ServicePricingEstimate = {
  serviceId: string
  servicePrice: number
  additionalRequirements: Array<{
    type: 'AI_IMAGE_ANALYSIS' | string
    description: string
    additionalPrice: number
  }>
  totalPrice: number
  quotePending?: boolean
  /** Visits of a repeating order; the figures already include them. */
  occurrences?: number
}

export type GeoJsonPolygon = {
  type: 'Polygon'
  coordinates: number[][][]
}

export type ServiceOption = {
  id: string
  name: string
  description?: string
  basePrice: number
  /** Default price from the default checklists; falls back to basePrice while none is priced. */
  defaultPrice?: number
  imageUrl?: string | null
  fallbackImageUrl?: string | null
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export type WeatherSuitability = 'GOOD' | 'CAUTION' | 'POOR'

/**
 * `GET /api/weather/forecast` data. `FORECAST_NOT_AVAILABLE` is a normal 200
 * response (date outside the provider range); every measurement is then absent.
 * Advisory only - it never blocks creating an order.
 */
export type WeatherForecast = {
  status: 'AVAILABLE' | 'FORECAST_NOT_AVAILABLE'
  latitude: number
  longitude: number
  forecastTime?: string
  temperatureC?: number
  relativeHumidityPercent?: number
  precipitationProbabilityPercent?: number
  precipitationMm?: number
  windSpeedKmh?: number
  windGustKmh?: number
  cloudCoverPercent?: number
  visibilityMeters?: number
  weatherCode?: number
  weatherLabel?: string
  suitability?: WeatherSuitability
  warnings?: string[]
}

/** Advisory result only; final flight conditions are confirmed during planning and preflight. */
export type FlightAreaRiskLevel = 'FAVORABLE' | 'NEEDS_REVIEW' | 'HIGH_RISK'
export type FlightAreaFindingSeverity = 'INFO' | 'WARNING' | 'HIGH'

export type FlightAreaNearbyFeature = {
  type: string
  name?: string | null
  distanceMeters?: number | null
  heightMeters?: number | null
  latitude?: number | null
  longitude?: number | null
  source?: string
}

export type FlightAreaAssessment = {
  location: { latitude: number; longitude: number; radiusMeters: number }
  elevation: {
    available: boolean
    terrainElevationMeters?: number | null
    reference?: string
    requestedAltitudeAglMeters?: number | null
    estimatedFlightAltitudeAmslMeters?: number | null
    provider?: string
    errorCode?: string | null
  }
  restrictedZones: {
    dataAvailable: boolean
    pointInsideRestrictedZone: boolean
    monitoringAreaIntersectsRestrictedZone: boolean
    nearestRestrictedZoneDistanceMeters?: number | null
    affectedZones: Array<{
      id: string
      code: string
      name: string
      zoneType?: string
      purpose?: string | null
      restricted: boolean
      distanceMeters?: number | null
      intersectsMonitoringArea: boolean
    }>
  }
  osmContext: {
    available: boolean
    errorCode?: string | null
    queryRadiusMeters?: number | null
    buildingCount: number
    towerCount: number
    mastCount: number
    powerTowerCount: number
    aerodromeNearby: boolean
    helipadNearby: boolean
    importantFeatures: FlightAreaNearbyFeature[]
  }
  ministryFlightBan?: {
    available: boolean
    totalAreaSquareMeters?: number | null
    violatedAreaSquareMeters?: number | null
    safeAreaSquareMeters?: number | null
    violatedZones: string[]
    sourceUrl: string
    errorCode?: string | null
  }
  assessment: {
    level: FlightAreaRiskLevel
    findings: Array<{
      code: string
      severity: FlightAreaFindingSeverity
      message: string
    }>
    disclaimer: string
  }
}

export type FlightAreaAssessmentQuery = {
  latitude: number
  longitude: number
  radiusMeters: number
  requestedAltitudeAgl?: number
  includeOsm?: boolean
}

export type WeatherForecastQuery = {
  latitude: number
  longitude: number
  /** yyyy-MM-dd, local date at the location. */
  date: string
  /** HH:mm, local time at the location. */
  time: string
}

export type PreferredTimeOption = {
  id: string
  code?: string
  name: string
  startTime?: string
  endTime?: string
}

export type ServiceDeliverableOption = {
  id: string
  serviceId: string
  serviceName?: string
  deliverableTypeId: string
  deliverableTypeName?: string
}


const BACKEND_ORDER_STATUSES = new Set<OrderStatus>([
  'PENDING',
  'APPROVED',
  'REJECTED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
])

function getPreferredDate(order: OrderCreateResponse) {
  return (
    order.preferredDateFrom ??
    order.preferredDateTo ??
    order.createdAt ??
    new Date().toISOString()
  )
}

function toCustomerOrderItem(order: OrderCreateResponse): CustomerOrderItem {
  const status = normalizeStatus(order.orderStatus)
  const orderCode = displayOrderCode(order.orderCode, order.id)
  return {
    id: order.id,
    orderCode,
    title: order.title ?? orderCode,
    addressText: order.address ?? null,
    preferredDate: getPreferredDate(order),
    preferredTimeLabel: order.preferredTimeName ?? null,
    radiusM: order.radiusM ?? null,
    status,
    serviceNames: order.serviceName ? [order.serviceName] : [],
    hasNewMedia: false,
    submittedAt: order.createdAt ?? null,
    canCancel: status === 'PENDING',
  }
}

export const customerApi = {
  getChecklistCatalog: (signal?: AbortSignal) =>
    apiRequest<import('../lib/checklist/types').CatalogChecklistItem[]>(
      '/api/checklists/catalog',
      { signal },
    ),
  getServiceChecklist: (serviceId: string, signal?: AbortSignal) =>
    apiRequest<ServiceChecklistItem[]>(
      `/api/services/${encodeURIComponent(serviceId)}/checklists`,
      { signal },
    ),
  /** `GET /api/orders/mine[?status]` [BE]: the whole list, no paging. */
  listMyOrders: (params: { status?: OrderStatus; signal?: AbortSignal } = {}) =>
    apiRequest<OrderCreateResponse[]>('/api/orders/mine', {
      query: { status: params.status },
      signal: params.signal,
    }),

  /** `GET /api/orders/{id}` [BE] `OrderCreateResponse`. */
  getOrderById: (orderId: string, signal?: AbortSignal) =>
    apiRequest<OrderCreateResponse>(
      `/api/orders/${encodeURIComponent(orderId)}`,
      { signal },
    ),

  /** Legacy list shape, still used by the support ticket dialog. */
  listOrders: (params: {
    status?: string
    serviceId?: string
    signal?: AbortSignal
  }) => {
    const status = params.status as OrderStatus | undefined
    if (status && !BACKEND_ORDER_STATUSES.has(status)) {
      return Promise.resolve({ items: [] as CustomerOrderItem[] })
    }
    return customerApi
      .listMyOrders({ status, signal: params.signal })
      .then((orders) => ({ items: orders.map(toCustomerOrderItem) }))
  },

  listServices: (signal?: AbortSignal) =>
    apiRequest<ServiceOption[]>('/api/services', {
      query: { activeOnly: true },
      signal,
    }),

  listPreferredTimes: (signal?: AbortSignal) =>
    apiRequest<PreferredTimeOption[]>('/api/preferred-times', { signal }),

  getWeatherForecast: (query: WeatherForecastQuery, signal?: AbortSignal) =>
    apiRequest<WeatherForecast>('/api/weather/forecast', {
      query: {
        latitude: query.latitude.toFixed(6),
        longitude: query.longitude.toFixed(6),
        date: query.date,
        time: query.time,
      },
      signal,
    }),

  getFlightAreaAssessment: (query: FlightAreaAssessmentQuery, signal?: AbortSignal) =>
    apiRequest<FlightAreaAssessment>('/api/flight-area-assessment', {
      query: {
        latitude: query.latitude.toFixed(7),
        longitude: query.longitude.toFixed(7),
        radiusMeters: Math.round(query.radiusMeters),
        requestedAltitudeAgl: query.requestedAltitudeAgl,
        includeOsm: query.includeOsm,
      },
      signal,
    }),

  listServiceDeliverables: (serviceId: string, signal?: AbortSignal) =>
    apiRequest<ServiceDeliverableOption[]>('/api/service-deliverables', {
      query: { serviceId },
      signal,
    }),

  getPricingEstimate: (
    serviceId: string,
    params: { aiImageAnalysis?: boolean; signal?: AbortSignal } = {},
  ) =>
    apiRequest<ServicePricingEstimate>('/api/services/pricing-estimate', {
      query: {
        serviceId,
        aiImageAnalysis: Boolean(params.aiImageAnalysis),
      },
      signal: params.signal,
    }),


  /** `POST /api/orders` [BE] `OrderCreateRequest` -> `OrderCreateResponse`. */
  createOrder: (payload: CreateOrderPayload) =>
    apiRequest<OrderCreateResponse>('/api/orders', {
      method: 'POST',
      body: payload,
    }),


  /** Mock only: the BE has no endpoint to accept a finding suggestion. */
  applyFindingSuggestion: (orderId: string, findingId: string) =>
    apiRequest<FindingDecision>(
      `/api/customer/orders/${encodeURIComponent(orderId)}/analysis/findings/${encodeURIComponent(findingId)}/apply`,
      { method: 'POST' },
    ),

  /** Mock only: the BE has no endpoint to ignore a finding suggestion. */
  ignoreFinding: (orderId: string, findingId: string) =>
    apiRequest<FindingDecision>(
      `/api/customer/orders/${encodeURIComponent(orderId)}/analysis/findings/${encodeURIComponent(findingId)}/ignore`,
      { method: 'POST' },
    ),
}
