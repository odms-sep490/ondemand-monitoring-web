import { useEffect } from 'react'
import type { Dispatch, SetStateAction } from 'react'

export function usePreflightReadyStorage({
  requiresBackendPreflight,
  setPreflightReady,
  preflightStorageKey,
}: {
  requiresBackendPreflight: boolean
  setPreflightReady: Dispatch<SetStateAction<boolean>>
  preflightStorageKey: string
}) {
  useEffect(() => {
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
  }, [preflightStorageKey, requiresBackendPreflight])
}
