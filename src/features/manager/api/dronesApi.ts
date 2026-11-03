import { apiRequest } from '../../../shared/api/httpClient'
import type {
  DeviceResponse,
  DeviceCreateRequest,
  DeviceUpdateRequest,
  PageResponseDeviceModel,
  PageResponseDeviceResponse,
} from '../types/drones'

const PAGE_SIZE = 100
const MAX_PAGES = 50

export const dronesApi = {
  async listDeviceModels(options?: {
    signal?: AbortSignal
  }): Promise<PageResponseDeviceModel> {
    const items: PageResponseDeviceModel['items'] = []
    let page = 0
    let last: PageResponseDeviceModel
    do {
      last = await apiRequest<PageResponseDeviceModel>('/api/device-models', {
        query: { page: String(page), size: String(PAGE_SIZE) },
        signal: options?.signal,
      })
      items.push(...last.items)
      page += 1
    } while (!last.last && page < last.totalPages && page < MAX_PAGES)
    return {
      ...last,
      items,
      page: 0,
      size: items.length,
      totalPages: 1,
      first: true,
      last: true,
    }
  },

  /**
   * `GET /api/drones?page=&size=` [BE, Spring `pageable`, 0-based]. The
   * backend only supports paging, so every page is requested (`size=100`)
   * and merged into a single response; filtering happens client-side.
   */
  async listDrones(options?: {
    signal?: AbortSignal
  }): Promise<PageResponseDeviceResponse> {
    const items: DeviceResponse[] = []
    let page = 0
    let last: PageResponseDeviceResponse
    do {
      last = await apiRequest<PageResponseDeviceResponse>('/api/drones', {
        query: { page: String(page), size: String(PAGE_SIZE) },
        signal: options?.signal,
      })
      items.push(...last.items)
      page += 1
    } while (!last.last && page < last.totalPages && page < MAX_PAGES)
    return {
      items,
      page: 0,
      size: items.length,
      totalItems: last.totalItems,
      totalPages: 1,
      first: true,
      last: true,
    }
  },

  /** `GET /api/drones/{id}` [BE]. */
  getDrone(id: string, signal?: AbortSignal): Promise<DeviceResponse> {
    return apiRequest<DeviceResponse>(`/api/drones/${id}`, { signal })
  },

  /** `PUT /api/drones/{id}` [BE `DeviceUpdateRequest`]. */
  updateDrone(id: string, data: DeviceUpdateRequest): Promise<DeviceResponse> {
    return apiRequest<DeviceResponse>(`/api/drones/${id}`, {
      method: 'PUT',
      body: data,
    })
  },

  createDrone(
    data: DeviceCreateRequest,
    image?: File,
  ): Promise<DeviceResponse> {
    if (!image) {
      return apiRequest<DeviceResponse>('/api/drones', {
        method: 'POST',
        body: data,
      })
    }

    const body = new FormData()
    body.append(
      'device',
      new Blob([JSON.stringify(data)], { type: 'application/json' }),
    )
    body.append('file', image)
    return apiRequest<DeviceResponse>('/api/drones/with-image', {
      method: 'POST',
      body,
    })
  },
}
