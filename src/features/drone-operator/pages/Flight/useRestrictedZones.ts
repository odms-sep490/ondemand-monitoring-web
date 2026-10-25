import { useState, useEffect } from 'react'
import type { RestrictedZone, ZonePayload } from './inFlightTypes'
import { env } from '../../../../config/env'
import { restrictedZoneTypes } from './inFlightConstants'
import { inFlightControlMessages } from './components/InFlightControl.messages'
import { getLanguage } from '../../../../shared/i18n'
import { normalizeRing } from './geofence'
import {
  type RestrictedGpsZone,
  withDefaultRestrictedGpsZones,
  isRestrictedGpsZonePayload,
  isValidGps,
} from './gpsRoutePlanner'

export function useRestrictedZones() {
  const [zones, setZones] = useState<RestrictedZone[]>([])

  useEffect(() => {
    let alive = true

    async function loadZones() {
      try {
        const response = await fetch(`${env.apiBaseUrl}/api/zones`, {
          cache: 'no-store',
        })
        const payload = await response.json()
        const items = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : []
        const restricted = (items as ZonePayload[])
          .filter(
            (zone) =>
              zone.restricted ||
              restrictedZoneTypes.has(
                String(zone.zoneType ?? '').toUpperCase(),
              ),
          )
          .map((zone) => ({
            id: String(zone.id ?? zone.code ?? zone.name ?? 'restricted-zone'),
            code: String(zone.code ?? ''),
            name: String(
              zone.name ??
                zone.code ??
                inFlightControlMessages[getLanguage()].geofence
                  .restrictedZoneName,
            ),
            coordinates: normalizeRing(zone.coordinates),
          }))
          .filter((zone) => zone.coordinates.length >= 4)
        if (alive) setZones(restricted)
      } catch {
        if (alive) setZones([])
      }
    }

    void loadZones()
    const timer = window.setInterval(loadZones, 5000)
    return () => {
      alive = false
      window.clearInterval(timer)
    }
  }, [])

  return zones
}

export function useRestrictedGpsZones() {
  const [zones, setZones] = useState<RestrictedGpsZone[]>(() =>
    withDefaultRestrictedGpsZones([]),
  )

  useEffect(() => {
    let alive = true

    async function loadZones() {
      try {
        const response = await fetch(`${env.apiBaseUrl}/api/zones`, {
          cache: 'no-store',
        })
        const payload = await response.json()
        const items = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : []
        const restrictedGps = withDefaultRestrictedGpsZones(
          (
            items as Array<{
              id?: string
              code?: string
              name?: string
              restricted?: boolean
              zoneType?: string
              coordinates?: number[][]
            }>
          )
            .filter(isRestrictedGpsZonePayload)
            .map((zone) => ({
              id: String(
                zone.id ?? zone.code ?? zone.name ?? 'restricted-zone',
              ),
              code: zone.code,
              name: zone.name,
              coordinates: (zone.coordinates ?? [])
                .map((point) => ({
                  longitude: Number(point[0]),
                  latitude: Number(point[1]),
                }))
                .filter(isValidGps),
            }))
            .filter((zone) => zone.coordinates.length >= 3),
        )
        if (alive) setZones(restrictedGps)
      } catch {
        if (alive) setZones(withDefaultRestrictedGpsZones([]))
      }
    }

    void loadZones()
    const timer = window.setInterval(loadZones, 10000)
    return () => {
      alive = false
      window.clearInterval(timer)
    }
  }, [])

  return zones
}
