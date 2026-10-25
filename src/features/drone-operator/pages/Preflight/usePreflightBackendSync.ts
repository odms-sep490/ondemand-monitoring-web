import { useEffect } from 'react'
import type {
  RuntimePreflightStatus,
  PersistedPreflightItemStatus,
} from './preflightTypes'
import {
  persistedStatusFromRuntime,
  updatePersistedPreflightItem,
} from './preflightApi'
import type { RefObject, Dispatch, SetStateAction } from 'react'
import type {
  PersistedPreflightStatus,
  WeatherPreflightStatus,
} from './preflightTypes'

export function usePreflightBackendSync({
  backendPreflightRegisteredRef,
  setBackendPreflightMessage,
  missionId,
  deviceId,
  syncingPersistedItemsRef,
  syncedPersistedItemsRef,
  setPersistedPreflightStatus,
  persistedPreflightId,
  weatherStatus,
  setPersistedWeatherPassed,
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
  persistedPreflightId: string | null
  weatherStatus: WeatherPreflightStatus | null
  setPersistedWeatherPassed: Dispatch<SetStateAction<boolean>>
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

  useEffect(() => {
    if (!persistedPreflightId || !weatherStatus) return

    const itemStatus: PersistedPreflightItemStatus = weatherStatus.safeToFly
      ? 'PASSED'
      : 'FAILED'
    const syncKey = `WEATHER:${itemStatus}:${weatherStatus.summary}`
    if (syncedPersistedItemsRef.current.WEATHER === syncKey) return

    let alive = true
    syncedPersistedItemsRef.current.WEATHER = syncKey

    updatePersistedPreflightItem(persistedPreflightId, 'WEATHER', {
      status: itemStatus,
      message: weatherStatus.summary,
    })
      .then((persisted) => {
        if (!alive || persisted.id !== persistedPreflightId) return
        setPersistedPreflightStatus(persisted.status)
        setPersistedWeatherPassed(itemStatus === 'PASSED')
      })
      .catch(() => {
        if (alive) delete syncedPersistedItemsRef.current.WEATHER
      })

    return () => {
      alive = false
    }
  }, [persistedPreflightId, weatherStatus])
  return { syncRuntimeStatusToBackend }
}
