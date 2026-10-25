import { useEffect } from 'react'
import { flightControlApi } from '../../api/flightControlApi'
import {
  STATUS_MAX_FAILURES,
  STATUS_RETRY_MS,
  STATUS_POLL_MS,
} from './inFlightConstants'
import type { Dispatch, SetStateAction } from 'react'
import type { ControlStatus } from './inFlightTypes'

export function useControlStatus({
  setControlStatus,
  setIsOnline,
  setStreamRevision,
}: {
  setControlStatus: Dispatch<SetStateAction<ControlStatus | null>>
  setIsOnline: Dispatch<SetStateAction<boolean>>
  setStreamRevision: Dispatch<SetStateAction<number>>
}) {
  useEffect(() => {
    let alive = true

    // Poll telemetry fast enough for smooth motion (was every 2.5s, which made the drone
    // "jump then stand still"). Requests never overlap, and a single failed poll no longer
    // wipes the drone off the map: we only drop the status after several misses in a row.
    let timer: number | undefined
    let failures = 0

    async function checkStatus() {
      try {
        const status = await flightControlApi.status()
        failures = 0
        if (alive) {
          setControlStatus(status)
          setIsOnline((wasOnline) => {
            if (!wasOnline && status.online)
              setStreamRevision((value) => value + 1)
            return status.online
          })
        }
      } catch {
        failures += 1
        if (alive && failures >= STATUS_MAX_FAILURES) {
          setControlStatus(null)
          setIsOnline(false)
        }
      } finally {
        if (alive) {
          timer = window.setTimeout(
            checkStatus,
            failures > 0 ? STATUS_RETRY_MS : STATUS_POLL_MS,
          )
        }
      }
    }

    void checkStatus()
    return () => {
      alive = false
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [])
}
