import { useEffect } from 'react'
import { controlBaseUrl, NO_MISSION_SENTINEL } from './preflightConstants'
import {
  clearStoredPreflightState,
  writeStoredPreflightState,
} from './preflightStorage'
import {
  fetchCurrentPersistedPreflight,
  runtimeStatusFromPersisted,
} from './preflightApi'
import { preflightPageMessages } from './PreflightPage.messages'
import { useI18n } from '../../../../shared/i18n'
import type { RefObject, Dispatch, SetStateAction } from 'react'
import type {
  RuntimePreflightStatus,
  PersistedPreflightStatus,
} from './preflightTypes'

export function usePreflightRuntimeEffects({
  missionId,
  missionLabel,
  deviceId,
  controllerOfflineMissesRef,
  setRuntimeSessionId,
  setCheckId,
  setRuntimeStatus,
  setPersistedPreflightId,
  setPersistedPreflightStatus,
  setPersistedWeatherPassed,
  syncedPersistedItemsRef,
  syncingPersistedItemsRef,
  setBackendPreflightMessage,
  setWeatherError,
  backendPreflightRegisteredRef,
  validatedStoredCheckRef,
  storageKey,
  setControllerOnline,
  controllerOnline,
  runtimeSessionId,
  checkId,
  syncRuntimeStatusToBackend,
  persistedPreflightId,
  setError,
}: {
  missionId: string
  missionLabel: string | undefined
  deviceId: string
  controllerOfflineMissesRef: RefObject<number>
  setRuntimeSessionId: Dispatch<SetStateAction<string | null>>
  setCheckId: Dispatch<SetStateAction<string | null>>
  setRuntimeStatus: Dispatch<SetStateAction<RuntimePreflightStatus | null>>
  setPersistedPreflightId: Dispatch<SetStateAction<string | null>>
  setPersistedPreflightStatus: Dispatch<
    SetStateAction<PersistedPreflightStatus | null>
  >
  setPersistedWeatherPassed: Dispatch<SetStateAction<boolean>>
  syncedPersistedItemsRef: RefObject<Record<string, string>>
  syncingPersistedItemsRef: RefObject<boolean>
  setBackendPreflightMessage: Dispatch<SetStateAction<string | null>>
  setWeatherError: Dispatch<SetStateAction<string | null>>
  backendPreflightRegisteredRef: RefObject<boolean>
  validatedStoredCheckRef: RefObject<boolean>
  storageKey: string
  setControllerOnline: Dispatch<SetStateAction<boolean>>
  controllerOnline: boolean
  runtimeSessionId: string | null
  checkId: string | null
  syncRuntimeStatusToBackend: (
    status: RuntimePreflightStatus,
    persistedId: string | null,
  ) => Promise<void>
  persistedPreflightId: string | null
  setError: Dispatch<SetStateAction<string | null>>
}) {
  const { t } = useI18n(preflightPageMessages)
  useEffect(() => {
    let alive = true

    async function checkControllerOnline() {
      try {
        const response = await fetch(`${controlBaseUrl}/api/control/status`, {
          cache: 'no-store',
        })
        if (!response.ok) throw new Error(`Controller ${response.status}`)
        const payload = await response.json().catch(() => null)
        const boundToCurrentMission =
          !payload?.missionId ||
          payload.missionId === missionId ||
          payload.missionCode === missionLabel
        const boundToCurrentDevice =
          !payload?.deviceId || payload.deviceId === deviceId
        if (!alive) return
        if (!boundToCurrentMission || !boundToCurrentDevice) {
          throw new Error('Controller bound to another mission')
        }
        const nextRuntimeSessionId =
          typeof payload?.runtimeSessionId === 'string'
            ? payload.runtimeSessionId
            : null
        controllerOfflineMissesRef.current = 0
        setRuntimeSessionId((currentSessionId) => {
          if (
            currentSessionId &&
            nextRuntimeSessionId &&
            currentSessionId !== nextRuntimeSessionId
          ) {
            setCheckId(null)
            setRuntimeStatus(null)
            setPersistedPreflightId(null)
            setPersistedPreflightStatus(null)
            setPersistedWeatherPassed(false)
            syncedPersistedItemsRef.current = {}
            syncingPersistedItemsRef.current = false
            setBackendPreflightMessage(null)
            setWeatherError(null)
            backendPreflightRegisteredRef.current = false
            validatedStoredCheckRef.current = false
            clearStoredPreflightState(storageKey)
          }
          return nextRuntimeSessionId ?? currentSessionId
        })
        setControllerOnline(true)
      } catch {
        if (!alive) return
        setControllerOnline(false)
        controllerOfflineMissesRef.current += 1
        if (controllerOfflineMissesRef.current >= 3) {
          setRuntimeSessionId(null)
          setCheckId(null)
          setRuntimeStatus(null)
          setPersistedPreflightId(null)
          setPersistedPreflightStatus(null)
          setPersistedWeatherPassed(false)
          syncedPersistedItemsRef.current = {}
          syncingPersistedItemsRef.current = false
          setBackendPreflightMessage(null)
          setWeatherError(null)
          backendPreflightRegisteredRef.current = false
          validatedStoredCheckRef.current = false
          clearStoredPreflightState(storageKey)
        }
      }
    }

    void checkControllerOnline()
    const timer = window.setInterval(checkControllerOnline, 2500)
    return () => {
      alive = false
      window.clearInterval(timer)
    }
  }, [deviceId, missionId, missionLabel, storageKey])

  useEffect(() => {
    if (!controllerOnline) return
    if (!missionId || missionId === NO_MISSION_SENTINEL) return
    let alive = true
    const controller = new AbortController()

    async function loadMissionPreflightState() {
      const persisted = await fetchCurrentPersistedPreflight(
        missionId,
        controller.signal,
      ).catch(() => null)
      if (!alive || !persisted) return
      const persistedRuntime = runtimeStatusFromPersisted(persisted)
      setPersistedPreflightId(persisted.id)
      setPersistedPreflightStatus(persisted.status)
      setPersistedWeatherPassed(
        persisted.items.some(
          (item) => item.checkType === 'WEATHER' && item.status === 'PASSED',
        ),
      )
      setRuntimeStatus((current) => {
        if (current?.checkId === persisted.id) return current
        writeStoredPreflightState(
          storageKey,
          persistedRuntime,
          runtimeSessionId,
        )
        return persistedRuntime
      })
    }

    void loadMissionPreflightState()
    return () => {
      alive = false
      controller.abort()
    }
  }, [controllerOnline, missionId, runtimeSessionId, storageKey])

  useEffect(() => {
    if (!checkId) return
    let alive = true

    async function poll() {
      try {
        const response = await fetch(
          `${controlBaseUrl}/api/preflight/${checkId}`,
          { cache: 'no-store' },
        )
        if (!response.ok) throw new Error(`Preflight status ${response.status}`)
        const payload = await response.json()
        if (!alive) return
        setRuntimeStatus(payload)
        writeStoredPreflightState(storageKey, payload, runtimeSessionId)
        void syncRuntimeStatusToBackend(payload, persistedPreflightId)
        if (payload.status === 'READY' || payload.status === 'FAILED') {
          setCheckId(null)
        }
      } catch {
        if (!alive) return
        setError(t.precheckConnectionLost)
        setCheckId(null)
      }
    }

    void poll()
    const timer = window.setInterval(poll, 800)
    return () => {
      alive = false
      window.clearInterval(timer)
    }
  }, [checkId, persistedPreflightId, runtimeSessionId, storageKey])
}
