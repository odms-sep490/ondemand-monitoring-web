import type {
  MissionResponse,
  PersistedPreflightCheckResponse,
  PersistedPostDeviceCheckResponse,
  MissionResultResponse,
  MediaResponse,
  WeatherPreflightCheckResponse,
} from '../../types/missions'
import type { OrderDetail } from '../../types/orders'

export type DetailData = {
  mission: MissionResponse | null
  order: OrderDetail | null
  preflight: PersistedPreflightCheckResponse | null
  postcheck: PersistedPostDeviceCheckResponse | null
  result: MissionResultResponse | null
  media: MediaResponse[]
  weather: WeatherPreflightCheckResponse | null
}
