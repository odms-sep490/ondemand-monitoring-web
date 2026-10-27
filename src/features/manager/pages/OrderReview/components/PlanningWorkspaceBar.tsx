import { PlusOutlined, RightOutlined } from '@ant-design/icons'

import { useI18n } from '../../../../../shared/i18n'
import { orderMissionPlanningSectionMessages } from './OrderMissionPlanningSection.messages'

/** Top bar of the mission workspace: add mission on the left, coverage note and finalize on the right. */
export function PlanningWorkspaceBar({
  sidebarCollapsed,
  onOpenSidebar,
  uncovered,
  canEdit,
  creating,
  busy,
  canConfirmPlan,
  onAddMission,
  onFinalize,
}: {
  sidebarCollapsed: boolean
  onOpenSidebar: () => void
  uncovered: number
  /** True while the plan is a writable draft. */
  canEdit: boolean
  creating: boolean
  busy: boolean
  canConfirmPlan: boolean
  onAddMission: () => void
  onFinalize: () => void
}) {
  const { t } = useI18n(orderMissionPlanningSectionMessages)
  return (
    <div className="odm-workspace-topbar">
      <div className="odm-workspace-topbar-group">
        {sidebarCollapsed ? (
          <button
            type="button"
            className="odm-btn odm-btn-sm"
            onClick={onOpenSidebar}
            title={t.openChecklistTitle}
          >
            <RightOutlined aria-hidden="true" /> {t.openChecklist(uncovered)}
          </button>
        ) : null}
        {canEdit ? (
          <button
            type="button"
            className="odm-btn"
            disabled={busy || creating}
            onClick={onAddMission}
          >
            <PlusOutlined aria-hidden="true" /> {t.addMission}
          </button>
        ) : null}
      </div>
      <div className="odm-workspace-topbar-group">
        {uncovered > 0 ? (
          <span className="odm-workspace-uncovered">{t.uncoveredNote(uncovered)}</span>
        ) : null}
        {canEdit ? (
          <button
            type="button"
            className="odm-btn odm-btn-p"
            disabled={!canConfirmPlan}
            onClick={onFinalize}
            title={uncovered > 0 ? t.finalizeBlockedHint : undefined}
          >
            {t.finalizeAction}
          </button>
        ) : null}
      </div>
    </div>
  )
}
