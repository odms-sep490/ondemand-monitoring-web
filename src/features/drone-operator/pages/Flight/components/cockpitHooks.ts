import { useState, useEffect } from 'react'

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
