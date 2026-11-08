import { useState, useEffect } from 'react'
import type { MapMeta } from './inFlightTypes'
import { env } from '../../../../config/env'

const FALLBACK_MAP_META: MapMeta = {
  image: '/simulation-viewer/simulation_map_top.png',
  imageVersion: '20260924211422',
  minX: -452,
  maxX: 450,
  minY: -415,
  maxY: 686.497,
  imageBounds: {
    minX: -417.15933531249993,
    maxX: 415.15933531249993,
    minY: -414.65578218749977,
    maxY: 417.66288843749993,
  },
}

function isValidMapMeta(value: unknown): value is MapMeta {
  if (!value || typeof value !== 'object') return false
  const meta = value as Partial<MapMeta>
  const hasFiniteBounds = [meta.minX, meta.maxX, meta.minY, meta.maxY].every(
    (coordinate) => typeof coordinate === 'number' && Number.isFinite(coordinate),
  )
  const imageBounds = meta.imageBounds
  const hasFiniteImageBounds =
    imageBounds === undefined ||
    [imageBounds.minX, imageBounds.maxX, imageBounds.minY, imageBounds.maxY].every(
      (coordinate) => typeof coordinate === 'number' && Number.isFinite(coordinate),
    )
  return hasFiniteBounds && hasFiniteImageBounds
}

export function useSimulationMap() {
  const [meta, setMeta] = useState<MapMeta>(FALLBACK_MAP_META)

  useEffect(() => {
    let alive = true

    async function loadMap() {
      try {
        const metaRes = await fetch(
          `${env.apiBaseUrl}/simulation-viewer/simulation-map.json`,
          { cache: 'no-store' },
        )
        const metaPayload = await metaRes.json()
        if (!alive) return
        setMeta(isValidMapMeta(metaPayload) ? metaPayload : FALLBACK_MAP_META)
      } catch {
        if (!alive) return
        setMeta(FALLBACK_MAP_META)
      }
    }

    void loadMap()
    return () => {
      alive = false
    }
  }, [])

  return { meta }
}
