import {
  HCMC_SERVICE_CENTER,
  isValidGps,
  type GpsPoint,
} from '../../../../shared/lib/serviceArea'

type OrderCenter = {
  lat: number
  lon: number
}

export type ResolvedOrderGps = {
  center: OrderCenter
  source: 'gps' | 'legacy-simulation'
}

function isFiniteCenter(center: OrderCenter) {
  return Number.isFinite(center.lat) && Number.isFinite(center.lon)
}

function legacySimulationToGps(center: OrderCenter): OrderCenter {
  const northMeters = center.lat
  const eastMeters = center.lon
  const latitude = HCMC_SERVICE_CENTER.latitude + northMeters / 111_320
  const longitude =
    HCMC_SERVICE_CENTER.longitude +
    eastMeters /
      (111_320 * Math.cos((HCMC_SERVICE_CENTER.latitude * Math.PI) / 180))

  return {
    lat: Number(latitude.toFixed(7)),
    lon: Number(longitude.toFixed(7)),
  }
}

export function resolveOrderGpsCenter(
  center: OrderCenter | null,
): ResolvedOrderGps | null {
  if (!center || !isFiniteCenter(center)) return null

  const point: GpsPoint = {
    latitude: center.lat,
    longitude: center.lon,
  }
  if (isValidGps(point)) {
    return { center, source: 'gps' }
  }

  return {
    center: legacySimulationToGps(center),
    source: 'legacy-simulation',
  }
}
