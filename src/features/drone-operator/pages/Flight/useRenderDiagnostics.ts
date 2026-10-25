import { useRef, useEffect } from 'react'

export function useRenderDiagnostics(name: string) {
  const renders = useRef(0)
  renders.current += 1

  useEffect(() => {
    if (
      !import.meta.env.DEV ||
      import.meta.env.VITE_MISSION_CONTROL_PERF !== 'true'
    )
      return
    const timer = window.setInterval(() => {
      if (renders.current > 0)
        console.debug(
          `[MissionControlPerf] ${name} renders/s=${renders.current}`,
        )
      renders.current = 0
    }, 1000)
    return () => window.clearInterval(timer)
  }, [name])
}
