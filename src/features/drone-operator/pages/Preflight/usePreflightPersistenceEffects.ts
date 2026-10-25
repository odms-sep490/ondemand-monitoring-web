import { useEffect } from 'react'
import {
  fetchPersistedPreflight,
  persistedStatusFromRuntime,
} from './preflightApi'
import {
  controlBaseUrl,
  NO_MISSION_SENTINEL,
  NO_DRONE_SENTINEL,
} from './preflightConstants'
import { writeStoredPreflightState } from './preflightStorage'
import { missionApi } from '../../../mission/api/missionApi'
import { backendPreflightTokenStorageKey } from '../../lib/flightWorkflowStorage'
import { demoFlightToken } from './preflightHelpers'
import { preflightPageMessages } from './PreflightPage.messages'
import { useI18n } from '../../../../shared/i18n'
import type {
  WeatherPreflightStatus,
  PersistedPreflightStatus,
  RuntimePreflightStatus,
} from './preflightTypes'
import type { Dispatch, SetStateAction, RefObject } from 'react'

export function usePreflightPersistenceEffects({
  weatherStatus,
  persistedWeatherPassed,
  runtimeItemsReady,
  persistedPreflightId,
  persistedPreflightStatus,
  setPersistedPreflightStatus,
  setPersistedWeatherPassed,
  runtimeStatus,
  syncedPersistedItemsRef,
  syncRuntimeStatusToBackend,
  validatedStoredCheckRef,
  checkId,
  triggering,
  setRuntimeStatus,
  storageKey,
  runtimeSessionId,
  setCheckId,
  missionId,
  canContinueToHandover,
  isAlreadyInFlight,
  backendPreflightRegisteredRef,
  deviceId,
  setBackendPreflightRegistering,
  setBackendPreflightMessage,
}: {
  weatherStatus: WeatherPreflightStatus | null
  persistedWeatherPassed: boolean
  runtimeItemsReady: boolean
  persistedPreflightId: string | null
  persistedPreflightStatus: PersistedPreflightStatus | null
  setPersistedPreflightStatus: Dispatch<
    SetStateAction<PersistedPreflightStatus | null>
  >
  setPersistedWeatherPassed: Dispatch<SetStateAction<boolean>>
  runtimeStatus: RuntimePreflightStatus | null
  syncedPersistedItemsRef: RefObject<Record<string, string>>
  syncRuntimeStatusToBackend: (
    status: RuntimePreflightStatus,
    persistedId: string | null,
  ) => Promise<void>
  validatedStoredCheckRef: RefObject<boolean>
  checkId: string | null
  triggering: boolean
  setRuntimeStatus: Dispatch<SetStateAction<RuntimePreflightStatus | null>>
  storageKey: string
  runtimeSessionId: string | null
  setCheckId: Dispatch<SetStateAction<string | null>>
  missionId: string
  canContinueToHandover: boolean
  isAlreadyInFlight: boolean
  backendPreflightRegisteredRef: RefObject<boolean>
  deviceId: string
  setBackendPreflightRegistering: Dispatch<SetStateAction<boolean>>
  setBackendPreflightMessage: Dispatch<SetStateAction<string | null>>
}) {
  const { t } = useI18n(preflightPageMessages)
  useEffect(() => {
    const weatherPassed =
      weatherStatus?.safeToFly === true || persistedWeatherPassed
    if (
      !runtimeItemsReady ||
      !weatherPassed ||
      !persistedPreflightId ||
      persistedPreflightStatus !== 'CHECKING'
    ) {
      return
    }

    const activePersistedId = persistedPreflightId
    let alive = true
    const controller = new AbortController()

    async function refreshPersistedStatus() {
      const persisted = await fetchPersistedPreflight(
        activePersistedId,
        controller.signal,
      ).catch(() => null)
      if (!alive || !persisted || persisted.id !== activePersistedId) return

      setPersistedPreflightStatus(persisted.status)
      setPersistedWeatherPassed(
        persisted.items.some(
          (item) => item.checkType === 'WEATHER' && item.status === 'PASSED',
        ),
      )

      if (runtimeStatus) {
        let hasBackendLag = false
        for (const check of runtimeStatus.checks) {
          const expected = persistedStatusFromRuntime(check.status)
          const actual = persisted.items.find(
            (item) => item.checkType === check.key,
          )?.status
          if (
            (expected === 'PASSED' || expected === 'FAILED') &&
            actual !== expected
          ) {
            delete syncedPersistedItemsRef.current[check.key]
            hasBackendLag = true
          }
        }
        if (hasBackendLag) {
          void syncRuntimeStatusToBackend(runtimeStatus, activePersistedId)
        }
      }
    }

    void refreshPersistedStatus()
    const timer = window.setInterval(refreshPersistedStatus, 800)
    return () => {
      alive = false
      controller.abort()
      window.clearInterval(timer)
    }
  }, [
    persistedPreflightId,
    persistedPreflightStatus,
    persistedWeatherPassed,
    runtimeItemsReady,
    runtimeStatus,
    weatherStatus?.safeToFly,
  ])

  useEffect(() => {
    if (
      validatedStoredCheckRef.current ||
      checkId ||
      triggering ||
      !runtimeStatus ||
      runtimeStatus.checkId === 'triggering'
    ) {
      return
    }
    validatedStoredCheckRef.current = true
    const storedCheckId = runtimeStatus.checkId
    let alive = true

    async function validateStoredPreflight() {
      try {
        const response = await fetch(
          `${controlBaseUrl}/api/preflight/${storedCheckId}`,
          { cache: 'no-store' },
        )
        if (!response.ok) throw new Error(`Stored preflight ${response.status}`)
        const payload = await response.json()
        if (!alive) return
        setRuntimeStatus(payload)
        writeStoredPreflightState(storageKey, payload, runtimeSessionId)
        void syncRuntimeStatusToBackend(payload, persistedPreflightId)
      } catch {
        if (!alive) return
        setCheckId(null)
      }
    }

    void validateStoredPreflight()
    return () => {
      alive = false
    }
  }, [
    checkId,
    missionId,
    runtimeSessionId,
    runtimeStatus,
    persistedPreflightId,
    storageKey,
    triggering,
  ])

  useEffect(() => {
    if (
      !canContinueToHandover ||
      isAlreadyInFlight ||
      backendPreflightRegisteredRef.current ||
      missionId === NO_MISSION_SENTINEL ||
      deviceId === NO_DRONE_SENTINEL
    ) {
      return
    }

    backendPreflightRegisteredRef.current = true
    let alive = true

    async function registerBackendPreflight() {
      setBackendPreflightRegistering(true)
      setBackendPreflightMessage(t.switchingToReady)
      try {
        if (!alive) return
        const completedPreflight = await missionApi.runPreflightCheck(
          missionId,
          deviceId,
        )
        window.sessionStorage.setItem(
          backendPreflightTokenStorageKey(missionId, deviceId),
          completedPreflight.flightToken?.tokenValue ??
            demoFlightToken(missionId, deviceId),
        )
        setBackendPreflightMessage(t.backendSwitchedReady)
      } catch (cause) {
        if (!alive) return
        backendPreflightRegisteredRef.current = false
        setBackendPreflightMessage(
          cause instanceof Error
            ? cause.message
            : t.backendPreflightUnconfirmed,
        )
      } finally {
        if (alive) setBackendPreflightRegistering(false)
      }
    }

    void registerBackendPreflight()

    return () => {
      alive = false
    }
  }, [canContinueToHandover, deviceId, isAlreadyInFlight, missionId])
}
