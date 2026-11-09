import { useEffect } from 'react'
import type {
  RuntimePreflightStatus,
} from './preflightTypes'
import {
  persistedStatusFromRuntime,
  updatePersistedPreflightItem,
} from './preflightApi'
import type { RefObject, Dispatch, SetStateAction } from 'react'
import type {
  PersistedPreflightStatus,
} from './preflightTypes'

export function usePreflightBackendSync({
  backendPreflightRegisteredRef,
  setBackendPreflightMessage,
  missionId,
  deviceId,
  syncingPersistedItemsRef,
  syncedPersistedItemsRef,
  setPersistedPreflightStatus,
}: {
  backendPreflightRegisteredRef: RefObject<boolean>
  setBackendPreflightMessage: Dispatch<SetStateAction<string | null>>
  missionId: string
  deviceId: string
  syncingPersistedItemsRef: RefObject<boolean>
  syncedPersistedItemsRef: RefObject<Record<string, string>>
  setPersistedPreflightStatus: Dispatch<
    SetStateAction<PersistedPreflightStatus | null>
  >
}) {
  useEffect(() => {
    backendPreflightRegisteredRef.current = false
    setBackendPreflightMessage(null)
  }, [missionId, deviceId])

  async function syncRuntimeStatusToBackend(
    status: RuntimePreflightStatus,
    persistedId: string | null,
  ) {
    if (
      !persistedId ||
      status.checkId === 'triggering' ||
      syncingPersistedItemsRef.current
    ) {
      return
    }

    syncingPersistedItemsRef.current = true

    try {
      for (const check of status.checks) {
        const itemStatus = persistedStatusFromRuntime(check.status)
        if (itemStatus === 'PENDING') continue

        const syncKey = `${check.key}:${itemStatus}:${check.message}`
        if (syncedPersistedItemsRef.current[check.key] === syncKey) continue

        const persisted = await updatePersistedPreflightItem(
          persistedId,
          check.key,
          {
            status: itemStatus,
            message: check.message,
          },
        )
        syncedPersistedItemsRef.current[check.key] = syncKey
        if (persisted?.id === persistedId) {
          setPersistedPreflightStatus(persisted.status)
        }
      }
    } catch {
      // The persisted-status poll retries items that have not been saved yet.
    } finally {
      syncingPersistedItemsRef.current = false
    }
  }

  // Weather is evaluated by the backend from MissionWeatherCheck when a
  // business preflight starts. It is not a manual item and must not be PATCHed
  // using the removed legacy key `WEATHER`.
  return { syncRuntimeStatusToBackend }
}
