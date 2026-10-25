import type { ExecutionPlan } from '../../../types/planning'
import type { MissionResponse } from '../../../types/missions'
import type { OrderDetail } from '../../../types/orders'
import type { Invoice } from '../../../../finance/types'
import type { Dispatch, SetStateAction } from 'react'

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
  creating: { replacesMissionId?: string | undefined } | null
  setCreating: Dispatch<
    SetStateAction<{ replacesMissionId?: string | undefined } | null>
  >
  continueToResourceAssignment: () => Promise<void>
  amending: boolean
  setAmending: Dispatch<SetStateAction<boolean>>
  setReason: Dispatch<SetStateAction<string>>
  selected: string | undefined
  dirty: boolean
  onAssignResources: ((missionId: string) => void) | undefined
  setAssigningResources: Dispatch<SetStateAction<{ missionId: string } | null>>
}) {
  return (
    <div className="odm-planning-actions">
      {writable && data.plan.planStatus === 'DRAFT' && (
        <>
          <button
            type="button"
            className="odm-btn"
            disabled={busy || saving || Boolean(creating)}
            onClick={() => setCreating({})}
          >
            {creating ? 'Đang tạo Mission' : 'Tạo thêm Mission'}
          </button>
          {data.missions.length > 0 && !data.plan.coverage.coverageReady && (
            <span className="odm-planning-next-hint" role="note">
              Còn {data.plan.coverage.uncovered} checklist chưa gán cho Mission
              nào. Gán đủ rồi mới tiếp tục được.
            </span>
          )}
          {data.missions.length > 0 && (
            <button
              type="button"
              className="odm-btn odm-btn-p"
              disabled={busy || saving || Boolean(creating)}
              onClick={() => void continueToResourceAssignment()}
            >
              Tiếp: Gán nguồn lực
            </button>
          )}
        </>
      )}
      {writable && data.plan.planStatus === 'FINALIZED' && !amending && (
        <>
          <button
            className="odm-btn"
            disabled={busy}
            onClick={() => {
              setAmending(true)
              setReason('')
            }}
          >
            Điều chỉnh kế hoạch
          </button>
          {selected && (
            <button
              className="odm-btn odm-btn-p odm-planning-next-resource"
              disabled={busy || saving || dirty}
              onClick={() =>
                onAssignResources
                  ? onAssignResources(selected)
                  : setAssigningResources({ missionId: selected })
              }
            >
              Phân công nguồn lực cho{' '}
              {data.missions.find((mission) => mission.id === selected)
                ?.missionCode ?? 'Mission'}
            </button>
          )}
        </>
      )}
    </div>
  )
}
