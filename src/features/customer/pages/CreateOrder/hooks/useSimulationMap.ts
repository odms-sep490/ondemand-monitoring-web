import { useEffect, useMemo, useState } from 'react'

import { env } from '../../../../../config/env'
import {
  validateMonitoringZone,
  validateRestrictedZones,
} from '../../../lib/createOrder/geometry'
import { toNumber } from '../../../lib/createOrder/format'
import type {
  SimulationMapMeta,
  SimulationZone,
} from '../../../lib/createOrder/types'

const MAP_TOP_IMAGE = '/simulation-viewer/simulation_map_top.png'

type LocationInput = { longitude: string; latitude: string; radiusM: number }

/** Loads the simulation map metadata + zones and validates the picked point. */
export function useSimulationMap(input: LocationInput) {
  const [meta, setMeta] = useState<SimulationMapMeta | null>(null)
  const [metaFailed, setMetaFailed] = useState(false)
  const zones: SimulationZone[] = []

  useEffect(() => {
    let alive = true
    fetch(`${env.apiBaseUrl}/simulation-viewer/simulation-map.json`, {
      cache: 'no-store',
    })
      .then((response) => response.json() as Promise<SimulationMapMeta>)
      .then((payload) => alive && setMeta(payload))
      .catch(() => alive && setMetaFailed(true))
    return () => {
      alive = false
    }
  }, [])

  const point = useMemo<[number, number]>(
    () => [toNumber(input.longitude, 0), toNumber(input.latitude, 0)],
    [input.longitude, input.latitude],
  )
  const restricted = useMemo(
    () => validateRestrictedZones(point, input.radiusM, zones),
    [point, input.radiusM, zones],
  )
  const monitoring = useMemo(
    () => validateMonitoringZone(point, zones),
    [point, zones],
  )
  const version = meta?.imageVersion
  const imageUrl = `${env.apiBaseUrl}${MAP_TOP_IMAGE}${
    version ? `?v=${encodeURIComponent(version)}` : ''
  }`

  return { meta, metaFailed, zones, imageUrl, restricted, monitoring }
}
