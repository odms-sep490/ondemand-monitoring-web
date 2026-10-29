import type { RestrictedZone } from './inFlightTypes'
import {
  type RestrictedGpsZone,
  withDefaultRestrictedGpsZones,
} from './gpsRoutePlanner'

export function useRestrictedZones() {
  return [] as RestrictedZone[]
}

export function useRestrictedGpsZones() {
  return withDefaultRestrictedGpsZones([]) as RestrictedGpsZone[]
}
