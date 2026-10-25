import { missionDispatchPageMessages } from '../MissionDispatchPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { Dispatch, SetStateAction } from 'react'
import type { LockedDrone } from '../dispatchTypes'
import type { ResourceSuggestions } from '../../../types/missions'

export function DispatchBottomBar({
  setReleaseModal,
  bothAssigned,
  lockedDrone,
  handleAutoAssign,
  lockingDrone,
  assigning,
  suggestions,
  handleAssignOperator,
  selectedOperator,
}: {
  setReleaseModal: Dispatch<SetStateAction<boolean>>
  bothAssigned: boolean
  lockedDrone: LockedDrone | null
  handleAutoAssign: () => Promise<void>
  lockingDrone: boolean
  assigning: boolean
  suggestions: ResourceSuggestions
  handleAssignOperator: () => Promise<void>
  selectedOperator: string | null
}) {
  const { t } = useI18n(missionDispatchPageMessages)
  return (
    <div className="odm-mgr-dispatch-bottombar">
      <span style={{ flex: 1 }} />
      <button
        type="button"
        className="odm-btn"
        onClick={() => setReleaseModal(true)}
        disabled={!bothAssigned}
      >
        {t.releaseAssignment}
      </button>
      {!lockedDrone ? (
        <button
          type="button"
          className="odm-btn"
          onClick={handleAutoAssign}
          disabled={lockingDrone || assigning || !suggestions.feasible}
        >
          {t.autoAssignRank1}
        </button>
      ) : (
        <button
          type="button"
          className="odm-btn odm-btn-ok"
          onClick={handleAssignOperator}
          disabled={!selectedOperator || assigning}
        >
          {assigning ? t.assigning : t.assign}
        </button>
      )}
    </div>
  )
}
