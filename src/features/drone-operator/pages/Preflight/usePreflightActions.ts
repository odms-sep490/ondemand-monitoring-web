import { backendPreflightTokenStorageKey } from '../../lib/flightWorkflowStorage'
import {
  clearStoredPreflightState,
  writeStoredWeatherState,
} from './preflightStorage'
import {
  controlBaseUrl,
  NO_MISSION_SENTINEL,
  NO_DRONE_SENTINEL,
} from './preflightConstants'
import { authenticatedFetch } from '../../../auth/api/authApi'
import { env } from '../../../../config/env'
import { isWeatherStatus, weatherFormFromStatus } from './preflightHelpers'
import { fetchCurrentPersistedPreflight } from './preflightApi'
import { preflightPageMessages } from './PreflightPage.messages'
import { useI18n } from '../../../../shared/i18n'
import type { Dispatch, SetStateAction, RefObject } from 'react'
import type {
  PersistedPreflightStatus,
  RuntimePreflightStatus,
  WeatherObservationForm,
  WeatherPreflightStatus,
} from './preflightTypes'
import type { PreflightItemDef } from './components/PreflightItem'

export function usePreflightActions({
  setTriggering,
  setError,
  setCheckId,
  setPersistedPreflightId,
  setPersistedPreflightStatus,
  setPersistedWeatherPassed,
  syncedPersistedItemsRef,
  syncingPersistedItemsRef,
  backendPreflightRegisteredRef,
  missionId,
  deviceId,
  storageKey,
  setRuntimeStatus,
  ALL_ITEMS,
  setWeatherSuggesting,
  setWeatherError,
  latitude,
  longitude,
  setWeatherForm,
  setWeatherStatus,
  weatherStorageKey,
}: {
  setTriggering: Dispatch<SetStateAction<boolean>>
  setError: Dispatch<SetStateAction<string | null>>
  setCheckId: Dispatch<SetStateAction<string | null>>
  setPersistedPreflightId: Dispatch<SetStateAction<string | null>>
  setPersistedPreflightStatus: Dispatch<
    SetStateAction<PersistedPreflightStatus | null>
  >
  setPersistedWeatherPassed: Dispatch<SetStateAction<boolean>>
  syncedPersistedItemsRef: RefObject<Record<string, string>>
  syncingPersistedItemsRef: RefObject<boolean>
  backendPreflightRegisteredRef: RefObject<boolean>
  missionId: string
  deviceId: string
  storageKey: string
  setRuntimeStatus: Dispatch<SetStateAction<RuntimePreflightStatus | null>>
  ALL_ITEMS: PreflightItemDef[]
  setWeatherSuggesting: Dispatch<SetStateAction<boolean>>
  setWeatherError: Dispatch<SetStateAction<string | null>>
  latitude: number | null | undefined
  longitude: number | null | undefined
  setWeatherForm: Dispatch<SetStateAction<WeatherObservationForm>>
  setWeatherStatus: Dispatch<SetStateAction<WeatherPreflightStatus | null>>
  weatherStorageKey: string
}) {
  const { t } = useI18n(preflightPageMessages)
  async function handleTriggerCheck() {
    setTriggering(true)
    setError(null)
    setCheckId(null)
    setPersistedPreflightId(null)
    setPersistedPreflightStatus(null)
    setPersistedWeatherPassed(false)
    syncedPersistedItemsRef.current = {}
    syncingPersistedItemsRef.current = false
    backendPreflightRegisteredRef.current = false
    window.sessionStorage.removeItem(
      backendPreflightTokenStorageKey(missionId, deviceId),
    )
    clearStoredPreflightState(storageKey)
    setRuntimeStatus({
      checkId: 'triggering',
      status: 'CHECKING',
      progress: 0,
      checks: ALL_ITEMS.map((item) => ({
        key: item.key,
        name: item.label,
        status: 'CHECKING',
        message: t.statusChecking,
        critical: true,
      })),
    })

    try {
      const response = await fetch(`${controlBaseUrl}/api/preflight/check`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error(`Preflight API ${response.status}`)
      const payload = await response.json()
      setCheckId(payload.checkId)
      setPersistedPreflightId(payload.checkId)
      setPersistedPreflightStatus('CHECKING')
    } catch {
      setRuntimeStatus(null)
      setError(t.triggerFailed)
    } finally {
      setTriggering(false)
    }
  }

  async function handleWeatherSuggestion() {
    setWeatherSuggesting(true)
    setWeatherError(null)

    try {
      if (
        typeof latitude !== 'number' ||
        typeof longitude !== 'number' ||
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      ) {
        throw new Error('Missing mission coordinates')
      }

      const response = await authenticatedFetch(
        `${env.apiBaseUrl}/api/weather/preflight-check`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            missionId:
              missionId === NO_MISSION_SENTINEL ? undefined : missionId,
            deviceId: deviceId === NO_DRONE_SENTINEL ? undefined : deviceId,
            latitude,
            longitude,
          }),
        },
      )
      if (!response.ok) throw new Error(`Weather API ${response.status}`)
      const payload = await response.json()
      const nextStatus = payload.data ?? payload
      if (!isWeatherStatus(nextStatus)) {
        throw new Error('Invalid weather payload')
      }

      setWeatherForm({
        ...weatherFormFromStatus(nextStatus),
        source: 'Hệ thống thời tiết theo tọa độ mission',
      })
      setWeatherStatus(nextStatus)
      writeStoredWeatherState(weatherStorageKey, nextStatus)
      if (missionId !== NO_MISSION_SENTINEL) {
        const persisted = await fetchCurrentPersistedPreflight(missionId)
        if (persisted) {
          setPersistedPreflightId(persisted.id)
          setPersistedPreflightStatus(persisted.status)
          setPersistedWeatherPassed(
            persisted.items.some(
              (item) =>
                item.checkType === 'WEATHER' && item.status === 'PASSED',
            ),
          )
        }
      }
    } catch {
      setWeatherError(t.weatherForecastUnavailable)
    } finally {
      setWeatherSuggesting(false)
    }
  }
  return { handleTriggerCheck, handleWeatherSuggestion }
}
