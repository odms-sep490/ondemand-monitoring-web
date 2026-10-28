import { MissionPlanningCard } from './MissionPlanningCard'
import { MissionChecklistAssignmentEditor } from './MissionChecklistAssignmentEditor'
import { ManagerMissionStopFlow } from './ManagerMissionStopFlow'
import { MissionExecutionPanel } from './MissionExecutionPanel'
import type { MissionResponse } from '../../../types/missions'
import type { ExecutionPlan } from '../../../types/planning'
import type { OrderDetail } from '../../../types/orders'
import type { Invoice } from '../../../../finance/types'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import type { Dispatch, SetStateAction } from 'react'
import { Button } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { planningMissionItemMessages } from './PlanningMissionItem.messages'

export function PlanningMissionItem({
  mission,
  selected,
  scope,
  data,
  writable,
  busy,
  draft,
  query,
  updateDraft,
  cancelCapabilities,
  runtimeBlocked,
  cancelling,
  saving,
  dirty,
  setCancelling,
  setReason,
  mutate,
  reason,
  setCreating,
  updateCancelCapability,
  updateRuntimeBlocked,
}: {
  mission: MissionResponse
  selected: string | undefined
  scope:
    | {
        missionId: string
        scopeLabel: string
        assignmentCount: number
        finalizedPlanRevision: number | null
      }
    | undefined
  data: {
    plan: ExecutionPlan
    missions: MissionResponse[]
    order: OrderDetail
    invoice: Invoice | null
  }
  writable: boolean
  busy: boolean
  draft: boolean
  query: UseApiQueryState<{
    plan: ExecutionPlan
    missions: MissionResponse[]
    order: OrderDetail
    invoice: Invoice | null
  }>
  updateDraft: (id: string, dirty: boolean, saving: boolean) => void
  cancelCapabilities: Record<string, boolean>
  runtimeBlocked: Record<string, boolean>
  cancelling: string | null
  saving: boolean
  dirty: boolean
  setCancelling: Dispatch<SetStateAction<string | null>>
  setReason: Dispatch<SetStateAction<string>>
  mutate: (
    action: 'finalize' | 'amend' | 'cancel',
    missionId?: string | undefined,
  ) => Promise<void>
  reason: string
  setCreating: Dispatch<
    SetStateAction<{ replacesMissionId?: string | undefined } | null>
  >
  updateCancelCapability: (missionId: string, canCancel: boolean) => void
  updateRuntimeBlocked: (id: string, blocked: boolean) => void
}) {
  const { t } = useI18n(planningMissionItemMessages)
  return (
    <div hidden={mission.id !== selected}>
      <MissionPlanningCard
        mission={mission}
        scope={scope}
        missions={data.missions}
        key={mission.id}
      >
        <MissionChecklistAssignmentEditor
          missionId={mission.id}
          revision={data.plan.revision}
          editable={
            writable &&
            !busy &&
            draft &&
            scope?.finalizedPlanRevision == null &&
            mission.status === 'RESOURCE_ASSIGNING'
          }
          items={data.order.checklistItems ?? []}
          onChanged={query.reload}
          onDraftState={updateDraft}
        />
        {((writable &&
          !['COMPLETED', 'CANCELLED'].includes(mission.status) &&
          cancelCapabilities[mission.id] === true &&
          runtimeBlocked[mission.id] === false) ||
          (cancelling === mission.id && runtimeBlocked[mission.id] !== true) ||
          (writable && draft && mission.status === 'CANCELLED')) && (
          <div className="odm-mission-actions">
            {writable &&
              !['COMPLETED', 'CANCELLED'].includes(mission.status) &&
              cancelCapabilities[mission.id] === true &&
              runtimeBlocked[mission.id] === false && (
                <Button
                  type="submit"
                  variant="danger"
                  disabled={busy || saving || dirty}
                  onClick={() => {
                    setCancelling(mission.id)
                    setReason('')
                  }}
                >
                  {t.cancelMission(mission.missionCode)}
                </Button>
              )}
            {cancelling === mission.id &&
              runtimeBlocked[mission.id] !== true && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    void mutate('cancel', mission.id)
                  }}
                >
                  <label>
                    {t.cancelReason(mission.missionCode)}
                    <textarea
                      required
                      maxLength={1000}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </label>
                  <Button
                    type="submit"
                    disabled={
                      busy ||
                      !reason.trim() ||
                      !writable ||
                      cancelCapabilities[mission.id] !== true
                    }
                  >
                    {t.confirmCancel}
                  </Button>
                  <Button type="button" onClick={() => setCancelling(null)}>
                    {t.close}
                  </Button>
                </form>
              )}
            {writable && draft && mission.status === 'CANCELLED' && (
              <Button
                type="button"
                disabled={busy || saving}
                onClick={() => setCreating({ replacesMissionId: mission.id })}
              >
                {t.createReplacement(mission.missionCode)}
              </Button>
            )}
          </div>
        )}
        <ManagerMissionStopFlow
          missionId={mission.id}
          missionCode={mission.missionCode || 'Mission'}
          status={mission.status}
          revision={data.plan.revision}
          refreshKey={data}
          writable={writable}
          draft={draft}
          active={mission.id === selected}
          blocked={busy || saving || dirty}
          onChanged={query.reload}
          onCapabilitiesChanged={updateCancelCapability}
          onRuntimeBlocked={updateRuntimeBlocked}
          onBusyChanged={updateDraft}
          onReplacement={(id) => setCreating({ replacesMissionId: id })}
        />
        {mission.id === selected && scope?.finalizedPlanRevision != null && (
          <MissionExecutionPanel key={mission.id} mission={mission} />
        )}
      </MissionPlanningCard>
    </div>
  )
}
