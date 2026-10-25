import { useState, useEffect } from 'react'
import type { MapMeta } from './inFlightTypes'
import { env } from '../../../../config/env'

export function useSimulationMap() {
  const [meta, setMeta] = useState<MapMeta | null>(null)

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
        setMeta(metaPayload)
      } catch {
        if (!alive) return
        setMeta(null)
      }
    }

    void loadMap()
    return () => {
      alive = false
    }
  }, [])

  return { meta }
}
