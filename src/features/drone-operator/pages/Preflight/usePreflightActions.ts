import { useRef } from 'react'
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
  deviceId,
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
  deviceId?: string
  missionId: string
  storageKey: string
  setRuntimeStatus: Dispatch<SetStateAction<RuntimePreflightStatus | null>>
  ALL_ITEMS: PreflightItemDef[]
}) {
  const { t, lang } = useI18n(preflightPageMessages)
  const startingPreflightRef = useRef(false)

  async function handleTriggerCheck() {
    if (startingPreflightRef.current) return
    startingPreflightRef.current = true
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
      const persisted = await startPersistedPreflight(missionId, deviceId)
      setRuntimeStatus(runtimeStatusFromPersisted(persisted))
      setPersistedPreflightId(persisted.id)
      setPersistedPreflightStatus(persisted.status)
      // Backend owns the business precheck lifecycle. Do not poll or sync the
      // removed PX4/MAVSDK simulation checklist.
      setCheckId(null)
    } catch (cause) {
      setRuntimeStatus(null)
      const message = cause instanceof Error ? cause.message : t.triggerFailed
      const translations: Record<string, string> = {
        'Preflight inspection requires staff-confirmation stage after payment.': 'Chỉ kiểm tra trước bay khi nhiệm vụ đang chờ xác nhận nhân sự sau thanh toán.',
        'No current assigned drone matches this preflight request.': 'Thiết bị này không còn được gán cho nhiệm vụ. Vui lòng tải lại danh sách.',
        'The assigned device is not eligible for preflight inspection.': 'Trạng thái thiết bị hiện tại chưa cho phép kiểm tra trước bay.',
        'Missing mission': 'Chưa chọn nhiệm vụ.',
        'Invalid preflight response': 'Kết quả kiểm tra từ hệ thống không hợp lệ.',
      }
      setError(lang === 'vi' ? (translations[message] ?? message.replace(/^Start preflight (\d+)$/, 'Không thể bắt đầu kiểm tra (mã lỗi $1).')) : message)
    } finally {
      startingPreflightRef.current = false
      setTriggering(false)
    }
  }

  return { handleTriggerCheck }
}
