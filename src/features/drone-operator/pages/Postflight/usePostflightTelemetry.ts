import { useEffect } from 'react'
import { flightControlApi } from '../../api/flightControlApi'
import {
  isUsablePostflightTelemetry,
  postflightTelemetryKey,
} from './postflightHelpers'
import type { Dispatch, SetStateAction } from 'react'
import type { FlightControlStatus } from '../../api/flightControlApi'

export function usePostflightTelemetry({
  effectiveMissionId,
  deviceId,
  setLiveTelemetrySnapshot,
}: {
  effectiveMissionId: string
  deviceId: string
  setLiveTelemetrySnapshot: Dispatch<SetStateAction<FlightControlStatus | null>>
}) {
  useEffect(() => {
    if (!effectiveMissionId || !deviceId) {
      setLiveTelemetrySnapshot(null)
      return
    }
    let cancelled = false
    flightControlApi
      .status()
      .then((status) => {
        if (cancelled) return
        if (isUsablePostflightTelemetry(status, effectiveMissionId)) {
          setLiveTelemetrySnapshot(status)
          window.sessionStorage.setItem(
            postflightTelemetryKey(effectiveMissionId),
            JSON.stringify(status),
          )
        }
      })
      .catch(() => {
        // Postflight can still be recorded manually if the controller is offline.
      })
    return () => {
      cancelled = true
    }
  }, [deviceId, effectiveMissionId])
}
