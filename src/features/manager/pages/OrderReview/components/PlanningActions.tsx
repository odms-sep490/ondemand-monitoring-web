import type { ExecutionPlan } from '../../../types/planning'
import type { MissionResponse } from '../../../types/missions'
import type { OrderDetail } from '../../../types/orders'
import type { Invoice } from '../../../../finance/types'
import type { Dispatch, SetStateAction } from 'react'
import { Button } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { planningActionsMessages } from './PlanningActions.messages'

export function PlanningActions({
  writable,
  data,
  busy,
  saving,
  creating,
  setCreating,
  continueToResourceAssignment,
  amending,
  setAmending,
  setReason,
  selected,
  dirty,
  onAssignResources,
  setAssigningResources,
}: {
  writable: true
  data: {
    plan: ExecutionPlan
    missions: MissionResponse[]
    order: OrderDetail
    invoice: Invoice | null
  }
  busy: boolean
  saving: boolean
  creating: object | null
  setCreating: Dispatch<SetStateAction<object | null>>
  continueToResourceAssignment: () => Promise<void>
  amending: boolean
  setAmending: Dispatch<SetStateAction<boolean>>
  setReason: Dispatch<SetStateAction<string>>
  selected: string | undefined
  dirty: boolean
  onAssignResources: ((missionId: string) => void) | undefined
  setAssigningResources: Dispatch<SetStateAction<{ missionId: string } | null>>
}) {
  const { t } = useI18n(planningActionsMessages)
  return (
    <div className="odm-planning-actions mgr-actionbar">
      {writable && data.plan.planStatus === 'DRAFT' && (
        <>
          <Button
            type="button"
            disabled={busy || saving || Boolean(creating)}
            onClick={() => setCreating({})}
          >
            {creating ? t.creating : t.addMission}
          </Button>
          {data.missions.length > 0 && !data.plan.coverage.coverageReady && (
            <span className="odm-planning-next-hint" role="note">
              {t.uncoveredHint(data.plan.coverage.uncovered)}
            </span>
          )}
          {data.missions.length > 0 && (
            <Button
              type="button"
              variant="primary"
              disabled={busy || saving || Boolean(creating)}
              onClick={() => void continueToResourceAssignment()}
            >
              {t.nextAssignResources}
            </Button>
          )}
        </>
      )}
      {writable && data.plan.planStatus === 'FINALIZED' && !amending && (
        <>
          <Button
            disabled={busy}
            onClick={() => {
              setAmending(true)
              setReason('')
            }}
          >
            {t.adjustPlan}
          </Button>
          {selected && (
            <Button
              variant="primary"
              className="odm-planning-next-resource"
              disabled={busy || saving || dirty}
              onClick={() =>
                onAssignResources
                  ? onAssignResources(selected)
                  : setAssigningResources({ missionId: selected })
              }
            >
              {t.assignResourcesFor}{' '}
              {data.missions.find((mission) => mission.id === selected)
                ?.missionCode ?? 'Mission'}
            </Button>
          )}
        </>
      )}
    </div>
  )
}
