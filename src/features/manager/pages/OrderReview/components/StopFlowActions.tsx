import type { SafeStop } from '../../../types/planning'
import type { RefObject, Dispatch, SetStateAction } from 'react'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'

export function StopFlowActions({
  stop,
  requested,
  relevant,
  missionId,
  allowed,
  triggerRef,
  setIntent,
  query,
  missionCode,
  draft,
}: {
  stop: SafeStop
  requested: boolean
  relevant: boolean
  missionId: string
  allowed: boolean
  triggerRef: RefObject<HTMLButtonElement | null>
  setIntent: Dispatch<SetStateAction<'cancel' | 'replace' | null>>
  query: UseApiQueryState<SafeStop>
  missionCode: string
  draft: boolean
}) {
  return (
    <div className="odm-mission-actions">
      {(stop?.canCancelMission !== true || requested) && relevant && (
        <button
          className="odm-btn odm-btn-danger-soft"
          data-stop-trigger={`${missionId}:cancel`}
          disabled={!allowed}
          onClick={(event) => {
            triggerRef.current = event.currentTarget
            setIntent('cancel')
            query.reload()
          }}
        >
          Hủy Mission {missionCode}
        </button>
      )}
      {draft && (stop?.canCancelMission === true || relevant) && (
        <button
          className="odm-btn odm-btn-secondary-soft"
          data-stop-trigger={`${missionId}:replace`}
          disabled={!allowed}
          onClick={(event) => {
            triggerRef.current = event.currentTarget
            setIntent('replace')
            query.reload()
          }}
        >
          Thay thế Mission {missionCode}
        </button>
      )}
    </div>
  )
}
