import type {
  AdminDevice,
  AdminDeviceModel,
  AdminDevicePage,
  DeviceModelResponse,
  DeviceResponse,
  PageResponseDeviceResponse,
} from '../types/devices'

export function mapDeviceModel(dto: DeviceModelResponse): AdminDeviceModel {
  return {
    id: dto.id,
    code: dto.code,
    name: dto.modelName,
    manufacturer: dto.manufacturer,
  }
}

export function mapDevice(dto: DeviceResponse): AdminDevice {
  return {
    id: dto.id,
    serialNumber: dto.serialNumber,
    name: dto.name?.trim() || dto.serialNumber,
    model: dto.deviceModel ? mapDeviceModel(dto.deviceModel) : null,
    status: dto.status,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    version: dto.version,
  }
}

export function mapDevicePage(
  dto: PageResponseDeviceResponse,
): AdminDevicePage {
  return {
    items: (dto.items ?? []).map(mapDevice),
    page: dto.page,
    size: dto.size,
    totalItems: dto.totalItems,
    totalPages: dto.totalPages,
  }
}

export type DeviceStats = {
  total: number
  available: number
  maintenance: number
  offline: number
}

/** KPI counts over a set of devices (in-use statuses only count towards the total). */
export function computeDeviceStats(
  devices: readonly AdminDevice[],
): DeviceStats {
  const stats: DeviceStats = {
    total: devices.length,
    available: 0,
    maintenance: 0,
    offline: 0,
  }
  for (const d of devices) {
    if (d.status === 'AVAILABLE') stats.available++
    else if (d.status === 'MAINTENANCE') stats.maintenance++
    else if (d.status === 'OFFLINE' || d.status === 'OUT_OF_SERVICE')
      stats.offline++
  }
  return stats
}
