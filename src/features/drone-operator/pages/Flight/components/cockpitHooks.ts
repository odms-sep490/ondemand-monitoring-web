import { useState, useEffect } from 'react'
import type { CockpitLayout } from './cockpitTypes'

export const LAYOUT_KEY = 'odm.cockpit.layout'

export function useCockpitLayout() {
  const [layout, setLayout] = useState<CockpitLayout>(() => {
    try {
      const saved = window.localStorage.getItem(LAYOUT_KEY)
      return saved === 'camera' || saved === 'map' ? saved : 'split'
    } catch {
      return 'split'
    }
  })
  useEffect(() => {
    try {
      window.localStorage.setItem(LAYOUT_KEY, layout)
    } catch {
      /* storage unavailable */
    }
    // Leaflet only re-measures on window resize, so nudge it after the grid animates.
    const timer = window.setTimeout(
      () => window.dispatchEvent(new Event('resize')),
      280,
    )
    return () => window.clearTimeout(timer)
  }, [layout])
  return [layout, setLayout] as const
}

export function useFlightClock(inAir: boolean) {
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (inAir && startedAt === null) setStartedAt(Date.now())
  }, [inAir, startedAt])
  useEffect(() => {
    if (!inAir) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [inAir])
  if (startedAt === null) return '00:00:00'
  const total = Math.max(0, Math.floor((now - startedAt) / 1000))
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`
}
