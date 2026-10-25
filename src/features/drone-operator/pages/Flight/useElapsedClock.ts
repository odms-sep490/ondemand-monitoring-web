import { useEffect } from 'react'
import type { Dispatch, SetStateAction } from 'react'

export function useElapsedClock({
  setElapsed,
  setProgress,
}: {
  setElapsed: Dispatch<SetStateAction<number>>
  setProgress: Dispatch<SetStateAction<number>>
}) {
  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsed((value) => value + 1)
      setProgress((value) => Math.min(100, value + 0.04))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [])
}
