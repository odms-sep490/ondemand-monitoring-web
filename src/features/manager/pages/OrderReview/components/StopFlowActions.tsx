import type { SafeStop } from '../../../types/planning'
import type { RefObject, Dispatch, SetStateAction } from 'react'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import { Button } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { stopFlowActionsMessages } from './StopFlowActions.messages'

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
}: {
  stop: SafeStop
  requested: boolean
  relevant: boolean
  missionId: string
  allowed: boolean
  triggerRef: RefObject<HTMLButtonElement | null>
  setIntent: Dispatch<SetStateAction<'cancel' | null>>
  query: UseApiQueryState<SafeStop>
  missionCode: string
}) {
  const { t } = useI18n(stopFlowActionsMessages)
  return (
    <div className="odm-mission-actions">
      {(stop?.canCancelMission !== true || requested) && relevant && (
        <Button
          variant="danger"
          data-stop-trigger={`${missionId}:cancel`}
          disabled={!allowed}
          onClick={(event) => {
            triggerRef.current = event.currentTarget
            setIntent('cancel')
            query.reload()
          }}
        >
          {t.cancelMission(missionCode)}
        </Button>
      )}
    </div>
  )
}
