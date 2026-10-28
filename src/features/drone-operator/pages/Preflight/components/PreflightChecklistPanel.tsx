import { useState, useRef, useEffect } from 'react'
import {
  readStoredPreflightState,
  readStoredWeatherState,
  readStoredPreflightSession,
} from '../preflightStorage'
import type {
  RuntimePreflightStatus,
  WeatherPreflightStatus,
  WeatherObservationForm,
  PersistedPreflightStatus,
} from '../preflightTypes'
import { weatherFormFromStatus } from '../preflightHelpers'
import { WeatherCheckPanel } from './WeatherCheckPanel'
import { usePreflightBackendSync } from '../usePreflightBackendSync'
import { usePreflightActions } from '../usePreflightActions'
import { usePreflightRuntimeEffects } from '../usePreflightRuntimeEffects'
import { usePreflightPersistenceEffects } from '../usePreflightPersistenceEffects'
import { usePreflightGroups } from '../usePreflightGroups'
import { usePreflightProgress } from '../usePreflightProgress'
import { PreflightHeader } from './PreflightHeader'
import { PreflightSummary } from './PreflightSummary'
import { PreflightGroupList } from './PreflightGroupList'
import { controlBaseUrl } from '../preflightConstants'
import {
  runtimeStatusFromPersisted,
  recheckPersistedPreflightItem,
  updatePersistedPreflightItem,
} from '../preflightApi'

export function PreflightChecklistPanel({
  missionId,
  missionLabel,
  deviceId,
  deviceLabel,
  missionStatus,
  latitude,
  longitude,
  onReady,
  embedded = false,
}: {
  missionId: string
  missionLabel?: string
  deviceId: string
  deviceLabel?: string
  missionStatus?: string | null
  latitude?: number | null
  longitude?: number | null
  onReady?: () => void
  embedded?: boolean
}) {
  const { RUNTIME_GROUPS, ALL_ITEMS, storageKey, weatherStorageKey } =
    usePreflightGroups({ missionId, deviceId })
  const [checkId, setCheckId] = useState<string | null>(null)
  const [runtimeStatus, setRuntimeStatus] =
    useState<RuntimePreflightStatus | null>(() =>
      readStoredPreflightState(storageKey),
    )
  const [weatherStatus, setWeatherStatus] =
    useState<WeatherPreflightStatus | null>(() =>
      readStoredWeatherState(weatherStorageKey),
    )
  const [weatherForm, setWeatherForm] = useState<WeatherObservationForm>(() =>
    weatherFormFromStatus(readStoredWeatherState(weatherStorageKey)),
  )
  const [error, setError] = useState<string | null>(null)
  const [backendPreflightMessage, setBackendPreflightMessage] = useState<
    string | null
  >(null)
  const [backendPreflightRegistering, setBackendPreflightRegistering] =
    useState(false)
  const backendPreflightRegisteredRef = useRef(false)
  const [triggering, setTriggering] = useState(false)
  const [weatherSuggesting, setWeatherSuggesting] = useState(false)
  const [weatherError, setWeatherError] = useState<string | null>(null)
  const validatedStoredCheckRef = useRef(false)
  const controllerOfflineMissesRef = useRef(0)
  const [controllerOnline, setControllerOnline] = useState(false)
  const [runtimeSessionId, setRuntimeSessionId] = useState<string | null>(() =>
    readStoredPreflightSession(storageKey),
  )
  const [persistedPreflightId, setPersistedPreflightId] = useState<
    string | null
  >(null)
  const [persistedPreflightStatus, setPersistedPreflightStatus] =
    useState<PersistedPreflightStatus | null>(null)
  const [persistedWeatherPassed, setPersistedWeatherPassed] = useState(false)
  const [updatingItem, setUpdatingItem] = useState<string | null>(null)
  const syncedPersistedItemsRef = useRef<Record<string, string>>({})
  const syncingPersistedItemsRef = useRef(false)

  useEffect(() => {
    validatedStoredCheckRef.current = false
    controllerOfflineMissesRef.current = 0
    syncedPersistedItemsRef.current = {}
    syncingPersistedItemsRef.current = false
    setPersistedPreflightId(null)
    setPersistedPreflightStatus(null)
    setPersistedWeatherPassed(false)
    const storedWeather = readStoredWeatherState(weatherStorageKey)
    setWeatherStatus(storedWeather)
    setWeatherForm(weatherFormFromStatus(storedWeather))
    setRuntimeSessionId(readStoredPreflightSession(storageKey))
  }, [missionId, deviceId, storageKey, weatherStorageKey])

  const {
    itemStates,
    nOk,
    nTotal,
    failedItems,
    runtimeItemsReady,
    progress,
    hasTriggered,
    canContinueToHandover,
    isAlreadyInFlight,
    isFailed,
  } = usePreflightProgress({
    runtimeStatus,
    ALL_ITEMS,
    weatherStatus,
    persistedWeatherPassed,
    persistedPreflightStatus,
    checkId,
    triggering,
    missionStatus,
  })

  const { syncRuntimeStatusToBackend } = usePreflightBackendSync({
    backendPreflightRegisteredRef,
    setBackendPreflightMessage,
    missionId,
    deviceId,
    syncingPersistedItemsRef,
    syncedPersistedItemsRef,
    setPersistedPreflightStatus,
  })

  const { handleTriggerCheck, handleWeatherSuggestion } = usePreflightActions({
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
  })

  async function handleRecheckItem(checkType: string) {
    if (!persistedPreflightId || checkType !== 'battery_health') {
      setError('Hãy bắt đầu kiểm tra preflight trước.')
      return
    }
    setUpdatingItem(checkType)
    setError(null)
    try {
      const controllerResponse = await fetch(
        `${controlBaseUrl}/api/control/status`,
        { cache: 'no-store' },
      ).catch(() => null)
      const controllerStatus = controllerResponse?.ok
        ? await controllerResponse.json().catch(() => null)
        : null
      const batteryPercent = Number(controllerStatus?.batteryPercent)
      const persisted = Number.isFinite(batteryPercent)
        ? await updatePersistedPreflightItem(
            persistedPreflightId,
            'battery_health',
            {
              status: 'CHECKING',
              message: 'Hệ thống tự động đọc pin từ Gazebo',
              measuredValue: String(batteryPercent),
            },
          )
        : await recheckPersistedPreflightItem(
            persistedPreflightId,
            'battery_health',
          )
      setPersistedPreflightStatus(persisted.status)
      setRuntimeStatus(runtimeStatusFromPersisted(persisted))
      if (!Number.isFinite(batteryPercent)) {
        setError('Gazebo chưa trả về dữ liệu pin hiện tại.')
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Không thể lấy pin hiện tại từ Gazebo.',
      )
      throw cause
    } finally {
      setUpdatingItem(null)
    }
  }

  async function handleUpdateItem(
    checkType: string,
    status: 'PASSED' | 'FAILED',
    message: string,
  ) {
    if (!persistedPreflightId) {
      setError('Hãy bắt đầu kiểm tra preflight trước.')
      return
    }
    setUpdatingItem(checkType)
    setError(null)
    try {
      const persisted = await updatePersistedPreflightItem(
        persistedPreflightId,
        checkType,
        { status, message },
      )
      setPersistedPreflightStatus(persisted.status)
      setRuntimeStatus(runtimeStatusFromPersisted(persisted))
      setPersistedWeatherPassed(
        persisted.items.some(
          (item) =>
            item.checkType === 'weather_conditions' &&
            item.status === 'PASSED',
        ),
      )
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Không thể lưu kết quả kiểm tra.',
      )
      throw cause
    } finally {
      setUpdatingItem(null)
    }
  }

  usePreflightRuntimeEffects({
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
  })

  usePreflightPersistenceEffects({
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
  })

  return (
    <div
      className="odm-card"
      style={{
        marginBottom: 0,
        height: embedded ? '100%' : undefined,
        display: embedded ? 'flex' : undefined,
        flexDirection: embedded ? 'column' : undefined,
        overflow: embedded ? 'hidden' : undefined,
      }}
    >
      <PreflightHeader
        missionLabel={missionLabel}
        missionId={missionId}
        isAlreadyInFlight={isAlreadyInFlight}
        deviceId={deviceId}
        deviceLabel={deviceLabel}
      />
      <div
        style={{
          padding: '18px 22px',
          overflow: embedded ? 'auto' : undefined,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <PreflightSummary
            nOk={nOk}
            nTotal={nTotal}
            progress={progress}
            canContinueToHandover={canContinueToHandover}
            isFailed={isFailed}
            failedItems={failedItems}
            error={error}
            hasTriggered={hasTriggered}
            triggering={triggering}
            handleTriggerCheck={handleTriggerCheck}
            onReady={onReady}
            missionId={missionId}
            backendPreflightMessage={backendPreflightMessage}
            backendPreflightRegistering={backendPreflightRegistering}
          />
          <WeatherCheckPanel
            status={weatherStatus}
            form={weatherForm}
            suggesting={weatherSuggesting}
            error={weatherError}
            latitude={latitude}
            longitude={longitude}
            onFormChange={setWeatherForm}
            onSuggest={handleWeatherSuggestion}
          />

          <PreflightGroupList
            RUNTIME_GROUPS={RUNTIME_GROUPS}
            itemStates={itemStates}
            onUpdateItem={handleUpdateItem}
            onRecheckItem={handleRecheckItem}
            updatingItem={updatingItem}
          />
        </div>
      </div>
    </div>
  )
}
