import { env } from '../../../config/env'
import { getLanguage } from '../../../shared/i18n'
import { authenticatedFetch } from '../../auth/api/authApi'
import { droneApiMessages } from './droneApi.messages'

interface DroneResponse {
  id: string
  serialNumber: string
  name?: string
  status?: string | null
  deviceModel?: { modelCode?: string; name?: string } | null
  droneModel?: { modelCode?: string; name?: string } | null
}

interface DronePage {
  items: DroneResponse[]
}

interface ApiResponse<T> {
  data: T
  message?: string
}

export interface AvailableDrone {
  id: string
  label: string
  status?: string | null
}

function isAvailableDrone(device: DroneResponse) {
  const status = device.status?.trim().toUpperCase()
  return !status || status === 'AVAILABLE'
}

export const droneApi = {
  async getAvailable(missionId?: string): Promise<AvailableDrone[]> {
    const response = await authenticatedFetch(
      missionId
        ? `${env.apiBaseUrl}/api/drones/available?missionId=${encodeURIComponent(missionId)}`
        : `${env.apiBaseUrl}/api/drones?status=AVAILABLE&size=100`,
    )

    const t = droneApiMessages[getLanguage()]
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || t.loadFailed(response.status))
    }

    const payload: ApiResponse<DronePage | DroneResponse[]> =
      await response.json()
    const devices = Array.isArray(payload.data)
      ? payload.data
      : payload.data.items
    return devices
      .filter((device) => Boolean(missionId) || isAvailableDrone(device))
      .map((device) => {
        const model = device.deviceModel ?? device.droneModel
        return {
          id: device.id,
          label: `${device.serialNumber || device.name || device.id} (${model?.modelCode ?? model?.name ?? t.unknownModel})`,
          status: device.status,
        }
      })
  },
}
