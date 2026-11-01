// DTOs mirror the backend OpenAPI schemas DeviceResponse, DeviceModelResponse,
// PageResponseDeviceResponse and DeviceUpdateRequest (see manager/types/drones.ts).

export const DEVICE_STATUSES = [
  'AVAILABLE',
  'RESERVED',
  'PREFLIGHT',
  'IN_MISSION',
  'ACTIVE_MISSION',
  'RETURNING',
  'CHARGING',
  'IDLE_CHARGING',
  'MAINTENANCE',
  'OUT_OF_SERVICE',
  'OFFLINE',
] as const

export type DeviceStatus = (typeof DEVICE_STATUSES)[number]

export type DeviceModelResponse = {
  id: string
  code: string
  modelName: string
  manufacturer: string
}

export type DeviceResponse = {
  id: string
  serialNumber: string
  name: string | null
  deviceModel: DeviceModelResponse | null
  status: DeviceStatus
  createdAt: string
  updatedAt: string
  version: number
}

export type PageResponseDeviceResponse = {
  items: DeviceResponse[]
  page: number
  size: number
  totalItems: number
  totalPages: number
  first: boolean
  last: boolean
}

/** Body of `PUT /api/devices/{id}`. */
export type DeviceUpdateRequest = {
  serialNumber?: string
  name?: string
  modelId?: string
  status?: DeviceStatus
}

/** Body of `POST /api/devices`: same fields as update, serial + model required. */
export type DeviceCreateRequest = DeviceUpdateRequest & {
  serialNumber: string
  modelId: string
}

export type DeviceListParams = {
  page: number
  size: number
  keyword?: string
  status?: DeviceStatus
  modelId?: string
  signal?: AbortSignal
}

// UI shapes

export type AdminDeviceModel = {
  id: string
  code: string
  name: string
  manufacturer: string
}

export type AdminDevice = {
  id: string
  serialNumber: string
  name: string
  model: AdminDeviceModel | null
  status: DeviceStatus
  createdAt: string
  updatedAt: string
  version: number
}

export type AdminDevicePage = {
  items: AdminDevice[]
  page: number
  size: number
  totalItems: number
  totalPages: number
}

export type DeviceFormValues = {
  serialNumber: string
  name?: string
  modelId: string
  status: DeviceStatus
}
