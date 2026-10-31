import { useEffect, useRef, useState } from 'react'

export function useDeadline(value: string | null | undefined, onExpire?: () => void) {
  const deadline = value ? Date.parse(value) : Number.NaN
  const calculate = () => (Number.isFinite(deadline) ? Math.max(0, deadline - Date.now()) : null)
  const [remainingMs, setRemainingMs] = useState<number | null>(calculate)
  const notified = useRef(false)
  const callback = useRef(onExpire)
  callback.current = onExpire

  useEffect(() => {
    notified.current = false
    const update = () => {
      const remaining = calculate()
      setRemainingMs(remaining)
      if (remaining === 0 && !notified.current) {
        notified.current = true
        callback.current?.()
      }
    }
    update()
    if (!Number.isFinite(deadline) || deadline <= Date.now()) return
    const timer = window.setInterval(update, 1000)
    return () => window.clearInterval(timer)
  }, [deadline])

  return {
    expired: remainingMs === 0,
    remaining: remainingMs == null ? null : formatRemaining(remainingMs),
  }
}

function formatRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return hours > 0
    ? `${hours}h ${String(minutes).padStart(2, '0')}m`
    : `${minutes}m ${String(seconds).padStart(2, '0')}s`
}
