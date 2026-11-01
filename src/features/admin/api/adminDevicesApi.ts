import { apiRequest } from '../../../shared/api/httpClient'
import type {
  DeviceCreateRequest,
  DeviceListParams,
  DeviceModelResponse,
  DeviceResponse,
  DeviceUpdateRequest,
  PageResponseDeviceResponse,
} from '../types/devices'

type ModelsPayload = DeviceModelResponse[] | { items: DeviceModelResponse[] }

export const adminDevicesApi = {
  /** `GET /api/devices` (Spring pageable, `page` is 0-based). */
  list({ signal, keyword, status, modelId, page, size }: DeviceListParams) {
    return apiRequest<PageResponseDeviceResponse>('/api/devices', {
      query: { page, size, keyword: keyword || undefined, status, modelId },
      signal,
    })
  },
  /** `GET /api/devices/{id}`. */
  get(id: string, signal?: AbortSignal) {
    return apiRequest<DeviceResponse>(
      `/api/devices/${encodeURIComponent(id)}`,
      { signal },
    )
  },
  /** `POST /api/devices`. */
  create(body: DeviceCreateRequest) {
    return apiRequest<DeviceResponse>('/api/devices', { method: 'POST', body })
  },
  /** `PUT /api/devices/{id}`. */
  update(id: string, body: DeviceUpdateRequest) {
    return apiRequest<DeviceResponse>(
      `/api/devices/${encodeURIComponent(id)}`,
      { method: 'PUT', body },
    )
  },
  /** `DELETE /api/devices/{id}`. */
  remove(id: string) {
    return apiRequest<void>(`/api/devices/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
  },
  /** `GET /api/device-models` (plain array or a page envelope). */
  async listModels(signal?: AbortSignal): Promise<DeviceModelResponse[]> {
    const payload = await apiRequest<ModelsPayload>('/api/device-models', {
      signal,
    })
    return Array.isArray(payload) ? payload : (payload?.items ?? [])
  },
}
