import { useEffect } from 'react'
import type { Dispatch, SetStateAction } from 'react'

export function usePreflightReadyStorage({
  requiresBackendPreflight,
  missionFlightStarted = false,
  setPreflightReady,
  preflightStorageKey,
}: {
  missionFlightStarted?: boolean
  requiresBackendPreflight: boolean
  setPreflightReady: Dispatch<SetStateAction<boolean>>
  preflightStorageKey: string
}) {
  useEffect(() => {
    if (missionFlightStarted) {
      setPreflightReady(true)
      return
    }
    if (requiresBackendPreflight) {
      setPreflightReady(false)
      return
    }
    try {
      setPreflightReady(
        window.localStorage.getItem(preflightStorageKey) === 'true',
      )
    } catch {
      setPreflightReady(false)
    }
  }, [preflightStorageKey, requiresBackendPreflight, missionFlightStarted])
}
