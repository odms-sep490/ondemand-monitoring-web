import { apiRequest } from '../../../shared/api/httpClient'

// DTOs mirror the backend OpenAPI schemas (http://localhost:8080/v3/api-docs).
export type ServiceResponse = {
  id: string
  name: string
  description?: string
  basePrice: number
  defaultPrice?: number
  priceSource?: 'CHECKLISTS' | 'UNPRICED'
  imageUrl?: string | null
  fallbackImageUrl?: string | null
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

/** `ServiceRequest`: only `name` is required. */
export type ServiceRequest = {
  name: string
  description?: string
  basePrice: number
  isActive?: boolean
}

export const PREFERRED_TIME_CODES = [
  'MORNING',
  'AFTERNOON',
  'EVENING',
  'NIGHT',
] as const

export type PreferredTimeCode = (typeof PREFERRED_TIME_CODES)[number]

// The OpenAPI schema describes LocalTime as an object, but Jackson serialises
// it as an "HH:mm[:ss]" string, which is what we send and receive.
export type PreferredTimeResponse = {
  id: string
  code: PreferredTimeCode
  name: string
  startTime: string
  endTime: string
}

/** `PreferredTimeCreateRequest`: all four fields are required. */
export type PreferredTimeCreateRequest = {
  code: PreferredTimeCode
  name: string
  startTime: string
  endTime: string
}

/** `PreferredTimeUpdateRequest`: every field optional. */
export type PreferredTimeUpdateRequest = Partial<PreferredTimeCreateRequest>

const enc = encodeURIComponent

export const catalogApi = {
  /** `GET /api/services` [BE]: a plain list, no paging. */
  listServices(signal?: AbortSignal) {
    return apiRequest<ServiceResponse[]>('/api/services', { signal })
  },
  /** `GET /api/services/{id}` [BE]. */
  getService(id: string, signal?: AbortSignal) {
    return apiRequest<ServiceResponse>(`/api/services/${enc(id)}`, { signal })
  },
  /** `POST /api/services` [BE]. */
  createService(body: ServiceRequest) {
    return apiRequest<ServiceResponse>('/api/services', {
      method: 'POST',
      body,
    })
  },
  /** `PUT /api/services/{id}` [BE]. */
  updateService(id: string, body: ServiceRequest) {
    return apiRequest<ServiceResponse>(`/api/services/${enc(id)}`, {
      method: 'PUT',
      body,
    })
  },
  /** `PUT /api/services/{id}/image` [BE]: multipart illustration upload. */
  uploadServiceImage(id: string, file: File) {
    const body = new FormData()
    body.append('file', file)
    return apiRequest<ServiceResponse>(`/api/services/${enc(id)}/image`, {
      method: 'PUT',
      body,
    })
  },
  /** `DELETE /api/services/{id}/image` [BE]. */
  removeServiceImage(id: string) {
    return apiRequest<ServiceResponse>(`/api/services/${enc(id)}/image`, {
      method: 'DELETE',
    })
  },
  /** `DELETE /api/services/{id}` [BE]. */
  deleteService(id: string) {
    return apiRequest<void>(`/api/services/${enc(id)}`, { method: 'DELETE' })
  },

  /** `GET /api/preferred-times` [BE]. */
  listPreferredTimes(signal?: AbortSignal) {
    return apiRequest<PreferredTimeResponse[]>('/api/preferred-times', {
      signal,
    })
  },
  /** `GET /api/preferred-times/{id}` [BE]. */
  getPreferredTime(id: string, signal?: AbortSignal) {
    return apiRequest<PreferredTimeResponse>(
      `/api/preferred-times/${enc(id)}`,
      { signal },
    )
  },
  /** `POST /api/preferred-times` [BE]. */
  createPreferredTime(body: PreferredTimeCreateRequest) {
    return apiRequest<PreferredTimeResponse>('/api/preferred-times', {
      method: 'POST',
      body,
    })
  },
  /** `PUT /api/preferred-times/{id}` [BE]. */
  updatePreferredTime(id: string, body: PreferredTimeUpdateRequest) {
    return apiRequest<PreferredTimeResponse>(
      `/api/preferred-times/${enc(id)}`,
      { method: 'PUT', body },
    )
  },
  /** `DELETE /api/preferred-times/{id}` [BE]. */
  deletePreferredTime(id: string) {
    return apiRequest<void>(`/api/preferred-times/${enc(id)}`, {
      method: 'DELETE',
    })
  },
}
