import type { DroneStatus } from '../../../shared/types/domain'

export type DeviceTypeResponse = {
  id: string
  code: string
  name: string
  description?: string | null
  createdAt?: string
  updatedAt?: string
  version?: number
}

/** Device model summary nested in `DeviceResponse` [BE `DeviceModelResponse`]. */
export type DeviceModelResponse = {
  id: string
  code: string
  modelName: string
  manufacturer: string | null
  specsMetadata?: Record<string, unknown> | null
  deviceTypes?: DeviceTypeResponse[] | null
  createdAt?: string
  updatedAt?: string
  version?: number
}

/** [BE `DeviceResponse`] returned by `GET /api/drones` and `GET /api/drones/{id}`. */
export type DeviceResponse = {
  id: string
  serialNumber: string
  name: string | null
  deviceModel: DeviceModelResponse | null
  status: DroneStatus
  /** Short-lived signed S3 URL for the device profile image, when uploaded. */
  imageUrl?: string | null
  createdAt: string
  updatedAt: string
  version: number
}

export type DeviceCreateRequest = {
  serialNumber: string
  name: string
  modelId: string
  status?: DroneStatus
}

export type PageResponseDeviceModel = {
  items: DeviceModelResponse[]
  page: number
  size: number
  totalItems: number
  totalPages: number
  first: boolean
  last: boolean
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
