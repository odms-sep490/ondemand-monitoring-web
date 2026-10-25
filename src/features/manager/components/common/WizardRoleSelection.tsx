import { planningError } from '../../lib/planningErrors'
import { assignmentReadiness } from '../../lib/assignmentReadiness'
import { planningSchedule } from './planningSchedule'
import type { UseApiQueryState } from '../../../../shared/hooks/useApiQuery'
import type { ExecutionPlan, SafeStop } from '../../types/planning'
import type { MissionResponse } from '../../types/missions'
import type { OrderDetail } from '../../types/orders'
import type { Dispatch, SetStateAction } from 'react'

export function WizardRoleSelection({
  busy,
  query,
  data,
  eligible,
  orderId,
  candidateId,
  setCandidateId,
}: {
  busy: boolean
  query: UseApiQueryState<{
    plan: ExecutionPlan
    missions: MissionResponse[]
    order: OrderDetail
    stops: (SafeStop | null)[]
  }>
  data:
    | {
        plan: ExecutionPlan
        missions: MissionResponse[]
        order: OrderDetail
        stops: (SafeStop | null)[]
      }
    | undefined
  eligible: (id: string) => boolean
  orderId: string
  candidateId: string | null
  setCandidateId: Dispatch<SetStateAction<string | null>>
}) {
  return (
    <section className="odm-or-card" aria-label="Chọn nhiệm vụ để phân công">
      <header className="odm-or-card-head">
        <span className="odm-or-card-title">Chọn nhiệm vụ để phân công</span>
        <button
          className="odm-or-btn-outline"
          disabled={busy || query.loading}
          onClick={query.reload}
        >
          Làm mới nhiệm vụ
        </button>
      </header>
      <div className="odm-or-card-body">
        {query.loading && <p role="status">Đang tải nhiệm vụ…</p>}
        {query.error ? <p role="alert">{planningError(query.error)}</p> : null}
        <div className="odm-or-role-grid">
          {data?.missions.map((mission) => {
            const readiness = assignmentReadiness(mission)
            const count = 4 - readiness.missingRoles.length
            const device = readiness.device
            const historical = ['COMPLETED', 'CANCELLED'].includes(
              mission.status,
            )
            const label = historical
              ? 'Lịch sử · chỉ xem'
              : readiness.complete
                ? 'Đã phân công nguồn lực'
                : data.plan.planStatus !== 'FINALIZED' ||
                    !data.plan.missions.find((m) => m.missionId === mission.id)
                      ?.finalizedPlanRevision
                  ? 'Chưa chốt kế hoạch'
                  : !eligible(mission.id)
                    ? 'Chưa đủ điều kiện phân công'
                    : device && count === 4
                      ? 'Chờ xác nhận phân công'
                      : `Đã phân công ${count}/4 vai trò`
            return (
              <label className="odm-or-role-card" key={mission.id}>
                <span>
                  <input
                    type="radio"
                    name={`mission-for-${orderId}`}
                    value={mission.id}
                    checked={candidateId === mission.id}
                    disabled={busy || !eligible(mission.id)}
                    onChange={() => setCandidateId(mission.id)}
                  />{' '}
                  {mission.missionCode}
                </span>
                <span>
                  {
                    data.plan.missions.find((m) => m.missionId === mission.id)
                      ?.scopeLabel
                  }
                </span>
                <small>
                  {planningSchedule(
                    mission.scheduledStartAt,
                    mission.scheduledEndAt,
                  )}
                </small>
                <small>{label}</small>
              </label>
            )
          })}
        </div>
      </div>
    </section>
  )
}
