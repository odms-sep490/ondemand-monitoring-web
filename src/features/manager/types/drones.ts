import type { DroneStatus } from '../../../shared/types/domain'

/** Device model summary nested in `DeviceResponse` [BE `DeviceModelResponse`]. */
export type DeviceModelResponse = {
  id: string
  code: string
  modelName: string
  manufacturer: string
}

/** [BE `DeviceResponse`] returned by `GET /api/drones` and `GET /api/drones/{id}`. */
export type DeviceResponse = {
  id: string
  serialNumber: string
  name: string | null
  deviceModel: DeviceModelResponse | null
  status: DroneStatus
  createdAt: string
  updatedAt: string
  version: number
}

/** [BE `PageResponseDeviceResponse`]. */
export type PageResponseDeviceResponse = {
  items: DeviceResponse[]
  page: number
  size: number
  totalItems: number
  totalPages: number
  first: boolean
  last: boolean
}

/** Body of `PUT /api/drones/{id}` [BE `DeviceUpdateRequest`]. */
export type DeviceUpdateRequest = {
  serialNumber?: string
  name?: string
  modelId?: string
  status?: DroneStatus
}
