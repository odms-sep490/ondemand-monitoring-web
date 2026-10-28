import { StatusBadge, toUiTone } from '../../../../../shared/components/ui'
import {
  missionStatusLabel,
  missionStatusTone,
} from '../../../../../shared/lib/statusTone'
import type { MissionResponse } from '../../../types/missions'
import type { ExecutionPlan } from '../../../types/planning'
import { STAFF_ROLE_LABELS } from '../../../components/common/missionDetailHelpers'
import { assignmentReadiness } from '../../../lib/assignmentReadiness'
import { planningSchedule } from '../../../components/common/planningSchedule'
import {
  missionBucket,
  missionProgress,
} from '../../../components/common/workflowModel'
import { workflowStepperMessages } from '../../../components/common/WorkflowStepper.messages'
import { useI18n, useLanguage } from '../../../../../shared/i18n'
import { localizePlanningScopeLabel } from './planningScopeLabel'

export function MissionSelector({
  missions,
  plan,
  selectedId,
  noChecklist,
  disabled,
  drafts,
  onSelect,
}: {
  missions: MissionResponse[]
  plan: ExecutionPlan
  selectedId?: string
  noChecklist: boolean
  disabled: boolean
  drafts: Record<string, { dirty: boolean; busy: boolean }>
  onSelect: (id: string) => void
}) {
  const { lang } = useLanguage()
  const { t: wf } = useI18n(workflowStepperMessages)
  return (
    <nav className="odm-workspace-selector" aria-label="Mission trong Order">
      {missions.map((mission, missionIndex) => {
        const bucket = missionBucket(mission.status)
        const stage = wf.missionStages[missionProgress(mission.status).current]
        const scope = plan.missions.find(
          (item) => item.missionId === mission.id,
        )
        const {
          missingRoles: missing,
          device,
          complete,
        } = assignmentReadiness(mission)
        const historical =
          !scope ||
          ['COMPLETED', 'CANCELLED', 'FAILED'].includes(mission.status)
        const count = scope?.assignmentCount ?? 0
        const checklistEditable =
          plan.planStatus === 'DRAFT' &&
          mission.status === 'PLANNING'
        const resourcesEditable =
          plan.planStatus === 'FINALIZED' &&
          ['READY', 'READY'].includes(
            mission.status,
          )
        return (
          <button
            type="button"
            key={mission.id}
            className={`odm-workspace-choice ${selectedId === mission.id ? 'is-selected' : ''}`}
            aria-pressed={selectedId === mission.id}
            disabled={disabled}
            onClick={() => onSelect(mission.id)}
          >
            <span className="odm-workspace-choice-head">
              <strong>{mission.missionCode || 'Mission'}</strong>
              <StatusBadge
                tone={toUiTone(missionStatusTone[mission.status] ?? 'gray')}
              >
                {missionStatusLabel[mission.status] ?? 'Chưa xác định'}
              </StatusBadge>
            </span>
            <span className={`odm-workspace-rank is-${bucket}`}>
              {bucket === 'finished'
                ? '✓'
                : bucket === 'active'
                  ? '●'
                  : bucket === 'blocked'
                    ? '🔒'
                    : '○'}{' '}
              {wf.missionOf(missionIndex + 1, missions.length)}
              {bucket === 'active' ? ` · ${stage.label}` : ''}
            </span>
            <span className="odm-workspace-scope">
              {scope?.scopeLabel
                ? localizePlanningScopeLabel(scope.scopeLabel, lang)
                : 'Lịch sử nhiệm vụ'}
            </span>
            <small>
              {planningSchedule(
                mission.scheduledStartAt,
                mission.scheduledEndAt,
              )}
            </small>
            <span className="odm-workspace-readiness">
              <span
                className={count > 0 || noChecklist ? 'is-ready' : 'is-missing'}
                title={
                  count > 0 || noChecklist
                    ? 'Đã phân công checklist'
                    : 'Cần phân công checklist'
                }
              >
                {count > 0 || noChecklist ? '✓' : '!'} Checklist{' '}
                {noChecklist ? '—' : count}
              </span>
              <span
                className={device ? 'is-ready' : 'is-missing'}
                title={device ? 'Đã có thiết bị' : 'Chưa phân công thiết bị'}
              >
                {device ? '✓' : '!'} Thiết bị
              </span>
              <span
                className={!missing.length ? 'is-ready' : 'is-missing'}
                title={
                  missing.length
                    ? `Thiếu: ${missing.map((role) => STAFF_ROLE_LABELS[role]).join(', ')}`
                    : 'Đủ nhân sự'
                }
              >
                {!missing.length ? '✓' : '!'} Nhân sự {4 - missing.length}/4
              </span>
            </span>
            {historical && (
              <small className="odm-workspace-plan-state">
                Lịch sử · chỉ xem
              </small>
            )}
            {mission.replacesMissionId && (
              <small>
                Thay thế{' '}
                {missions.find((m) => m.id === mission.replacesMissionId)
                  ?.missionCode || 'Mission trước'}
              </small>
            )}
            {missions
              .filter((m) => m.replacesMissionId === mission.id)
              .map((m) => (
                <small key={m.id}>Được thay thế bởi {m.missionCode}</small>
              ))}
            {(drafts[mission.id]?.dirty ||
              drafts[`resources:${mission.id}`]?.dirty) && (
              <small>Thay đổi chưa lưu được giữ tại Mission này</small>
            )}
            <span className="odm-workspace-choice-action">
              {historical
                ? 'Xem lịch sử'
                : checklistEditable
                  ? 'Phân công checklist'
                  : !resourcesEditable
                    ? 'Xem phân công'
                    : complete
                      ? 'Chỉnh sửa phân công'
                      : 'Tiếp tục phân công'}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
