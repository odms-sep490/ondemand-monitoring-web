import { useState, useRef, useEffect } from 'react'
import {
  readStoredPreflightState,
  readStoredPreflightSession,
} from '../preflightStorage'
import type {
  RuntimePreflightStatus,
  PersistedPreflightStatus,
} from '../preflightTypes'
import { usePreflightBackendSync } from '../usePreflightBackendSync'
import { usePreflightActions } from '../usePreflightActions'
import { usePreflightRuntimeEffects } from '../usePreflightRuntimeEffects'
import { usePreflightPersistenceEffects } from '../usePreflightPersistenceEffects'
import { usePreflightGroups } from '../usePreflightGroups'
import { usePreflightProgress } from '../usePreflightProgress'
import { missionApi } from '../../../../mission/api/missionApi'
import { useI18n } from '../../../../../shared/i18n'
import { preflightPageMessages } from '../PreflightPage.messages'
import { PreflightHeader } from './PreflightHeader'
import { PreflightSummary } from './PreflightSummary'
import { PreflightGroupList } from './PreflightGroupList'
import { controlBaseUrl } from '../preflightConstants'
import {
  fetchPersistedPreflight,
  runtimeStatusFromPersisted,
  recheckPersistedPreflightItem,
  updatePersistedPreflightItem,
} from '../preflightApi'

export function PreflightChecklistPanel({
  missionId,
  missionLabel,
  deviceId,
  deviceAssignmentId,
  deviceAssignedAt,
  deviceLabel,
  missionStatus,
  replacementRequestPending = false,
  onReady,
  embedded = false,
}: {
  missionId: string
  missionLabel?: string
  deviceId: string
  deviceAssignmentId?: string | null
  deviceAssignedAt?: string | null
  deviceLabel?: string
  missionStatus?: string | null
  replacementRequestPending?: boolean
  onReady?: () => void
  embedded?: boolean
}) {
  const { t } = useI18n(preflightPageMessages)
  const { RUNTIME_GROUPS, ALL_ITEMS, storageKey } = usePreflightGroups({
    missionId,
    deviceId,
    deviceAssignmentId,
  })
  const [checkId, setCheckId] = useState<string | null>(null)
  const [runtimeStatus, setRuntimeStatus] =
    useState<RuntimePreflightStatus | null>(() =>
      readStoredPreflightState(storageKey),
    )
  const [error, setError] = useState<string | null>(null)
  const [backendPreflightMessage, setBackendPreflightMessage] = useState<
    string | null
  >(null)
  const [backendPreflightRegistering, setBackendPreflightRegistering] =
    useState(false)
  const backendPreflightRegisteredRef = useRef(false)
  const [triggering, setTriggering] = useState(false)
  const replacementAssignmentKey = [
    missionId,
    deviceAssignmentId ?? '',
    deviceAssignedAt ?? '',
    deviceId,
  ].join(':')
  const [replacementRequestState, setReplacementRequestState] = useState(
    () => ({
      assignmentKey: replacementAssignmentKey,
      requested: replacementRequestPending,
    }),
  )
  const replacementRequested =
    replacementRequestState.assignmentKey === replacementAssignmentKey
      ? replacementRequestState.requested
      : replacementRequestPending
  const [
    replacementRequestingAssignmentKey,
    setReplacementRequestingAssignmentKey,
  ] = useState<string | null>(null)
  const replacementRequesting =
    replacementRequestingAssignmentKey === replacementAssignmentKey
  const [replacementRequestErrorState, setReplacementRequestErrorState] =
    useState<{
      assignmentKey: string
      message: string
    } | null>(null)
  const replacementRequestError =
    replacementRequestErrorState?.assignmentKey === replacementAssignmentKey
      ? replacementRequestErrorState.message
      : null
  const validatedStoredCheckRef = useRef(false)
  const controllerOfflineMissesRef = useRef(0)
  const [controllerOnline, setControllerOnline] = useState(false)
  const [, setConnectedDeviceId] = useState<string | null>(null)
  const [runtimeSessionId, setRuntimeSessionId] = useState<string | null>(() =>
    readStoredPreflightSession(storageKey),
  )
  const [persistedPreflightId, setPersistedPreflightId] = useState<
    string | null
  >(null)
  const [persistedPreflightStatus, setPersistedPreflightStatus] =
    useState<PersistedPreflightStatus | null>(null)
  const [updatingItem, setUpdatingItem] = useState<string | null>(null)
  const syncedPersistedItemsRef = useRef<Record<string, string>>({})
  const syncingPersistedItemsRef = useRef(false)

  useEffect(() => {
    validatedStoredCheckRef.current = false
    controllerOfflineMissesRef.current = 0
    setControllerOnline(false)
    setConnectedDeviceId(null)
    syncedPersistedItemsRef.current = {}
    syncingPersistedItemsRef.current = false
    setPersistedPreflightId(null)
    setPersistedPreflightStatus(null)
    setRuntimeSessionId(readStoredPreflightSession(storageKey))
  }, [missionId, deviceId, storageKey])

  useEffect(() => {
    setReplacementRequestState((current) => {
      if (current.assignmentKey !== replacementAssignmentKey) {
        return {
          assignmentKey: replacementAssignmentKey,
          requested: replacementRequestPending,
        }
      }
      if (replacementRequestPending && !current.requested) {
        return { ...current, requested: true }
      }
      return current
    })
  }, [replacementAssignmentKey, replacementRequestPending])

  useEffect(() => {
    if (!persistedPreflightId) return
    const activePersistedPreflightId = persistedPreflightId
    let alive = true
    const controller = new AbortController()

    async function refreshPersistedCheck() {
      if (updatingItem || syncingPersistedItemsRef.current) return
      const persisted = await fetchPersistedPreflight(
        activePersistedPreflightId,
        controller.signal,
      ).catch(() => null)
      if (!alive || !persisted) return
      const nextRuntimeStatus = runtimeStatusFromPersisted(persisted)
      setPersistedPreflightStatus(persisted.status)
      setRuntimeStatus(nextRuntimeStatus)
    }

    const timer = window.setInterval(() => {
      void refreshPersistedCheck()
    }, 5000)
    return () => {
      alive = false
      controller.abort()
      window.clearInterval(timer)
    }
  }, [persistedPreflightId, updatingItem])

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

  const { handleTriggerCheck } = usePreflightActions({
    setTriggering,
    setError,
    setCheckId,
    setPersistedPreflightId,
    setPersistedPreflightStatus,
    syncedPersistedItemsRef,
    syncingPersistedItemsRef,
    backendPreflightRegisteredRef,
    missionId,
    storageKey,
    setRuntimeStatus,
    ALL_ITEMS,
  })

  async function handleRequestDroneReplacement() {
    if (
      !isFailed ||
      failedItems.length === 0 ||
      replacementRequesting ||
      replacementRequested
    )
      return
    const assignmentKey = replacementAssignmentKey
    setReplacementRequestingAssignmentKey(assignmentKey)
    setReplacementRequestErrorState(null)
    try {
      const reason = failedItems
        .map((item) => item.label)
        .join(', ')
        .slice(0, 500)
      await missionApi.requestDeviceReplacement(missionId, reason)
      setReplacementRequestState({ assignmentKey, requested: true })
    } catch (cause) {
      setReplacementRequestErrorState({
        assignmentKey,
        message:
          cause instanceof Error
            ? cause.message
            : t.droneReplacementRequestFailed,
      })
    } finally {
      setReplacementRequestingAssignmentKey((current) =>
        current === assignmentKey ? null : current,
      )
    }
  }

  useEffect(() => {
    if (canContinueToHandover) {
      setReplacementRequestState((current) =>
        current.assignmentKey === replacementAssignmentKey && current.requested
          ? { ...current, requested: false }
          : current,
      )
      setReplacementRequestErrorState((current) =>
        current?.assignmentKey === replacementAssignmentKey ? null : current,
      )
    }
  }, [canContinueToHandover, replacementAssignmentKey])

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
    deviceAssignedAt,
    controllerOfflineMissesRef,
    setRuntimeSessionId,
    setCheckId,
    setRuntimeStatus,
    setPersistedPreflightId,
    setPersistedPreflightStatus,
    syncedPersistedItemsRef,
    syncingPersistedItemsRef,
    setBackendPreflightMessage,
    backendPreflightRegisteredRef,
    validatedStoredCheckRef,
    storageKey,
    setControllerOnline,
    setConnectedDeviceId,
    controllerOnline,
    runtimeSessionId,
    checkId,
    syncRuntimeStatusToBackend,
    persistedPreflightId,
    setError,
  })

  usePreflightPersistenceEffects({
    runtimeItemsReady,
    persistedPreflightId,
    persistedPreflightStatus,
    setPersistedPreflightStatus,
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
            replacementRequesting={replacementRequesting}
            replacementRequested={replacementRequested}
            replacementRequestError={replacementRequestError}
            onRequestDroneReplacement={handleRequestDroneReplacement}
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
