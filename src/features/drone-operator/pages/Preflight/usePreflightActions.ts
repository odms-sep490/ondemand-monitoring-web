import { clearStoredPreflightState } from './preflightStorage'
import {
  NO_MISSION_SENTINEL,
} from './preflightConstants'
import { runtimeStatusFromPersisted, startPersistedPreflight } from './preflightApi'
import { preflightPageMessages } from './PreflightPage.messages'
import { useI18n } from '../../../../shared/i18n'
import type { Dispatch, SetStateAction, RefObject } from 'react'
import type {
  PersistedPreflightStatus,
  RuntimePreflightStatus,
} from './preflightTypes'
import type { PreflightItemDef } from './components/PreflightItem'

export function usePreflightActions({
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
}: {
  setTriggering: Dispatch<SetStateAction<boolean>>
  setError: Dispatch<SetStateAction<string | null>>
  setCheckId: Dispatch<SetStateAction<string | null>>
  setPersistedPreflightId: Dispatch<SetStateAction<string | null>>
  setPersistedPreflightStatus: Dispatch<
    SetStateAction<PersistedPreflightStatus | null>
  >
  syncedPersistedItemsRef: RefObject<Record<string, string>>
  syncingPersistedItemsRef: RefObject<boolean>
  backendPreflightRegisteredRef: RefObject<boolean>
  missionId: string
  storageKey: string
  setRuntimeStatus: Dispatch<SetStateAction<RuntimePreflightStatus | null>>
  ALL_ITEMS: PreflightItemDef[]
}) {
  const { t } = useI18n(preflightPageMessages)
  async function handleTriggerCheck() {
    setTriggering(true)
    setError(null)
    setCheckId(null)
    setPersistedPreflightId(null)
    setPersistedPreflightStatus(null)
    syncedPersistedItemsRef.current = {}
    syncingPersistedItemsRef.current = false
    backendPreflightRegisteredRef.current = false
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
      if (missionId === NO_MISSION_SENTINEL) {
        throw new Error('Missing mission')
      }
      const persisted = await startPersistedPreflight(missionId)
      setRuntimeStatus(runtimeStatusFromPersisted(persisted))
      setPersistedPreflightId(persisted.id)
      setPersistedPreflightStatus(persisted.status)
      // Backend owns the business precheck lifecycle. Do not poll or sync the
      // removed PX4/MAVSDK simulation checklist.
      setCheckId(null)
    } catch {
      setRuntimeStatus(null)
      setError(t.triggerFailed)
    } finally {
      setTriggering(false)
    }
  }

  return { handleTriggerCheck }
}
