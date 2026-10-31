import { PlusOutlined, ReloadOutlined, RightOutlined } from '@ant-design/icons'

import { useI18n } from '../../../../../shared/i18n'
import { orderMissionPlanningSectionMessages } from './OrderMissionPlanningSection.messages'

/** Top bar for mission creation, plan refresh, coverage and finalization actions. */
export function PlanningWorkspaceBar({
  sidebarCollapsed,
  onOpenSidebar,
  uncovered,
  canEdit,
  creating,
  busy,
  canConfirmPlan,
  reloading,
  onAddMission,
  onReload,
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
  reloading: boolean
  onAddMission: () => void
  onReload: () => void
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
        <button
          type="button"
          className="odm-btn"
          disabled={busy || reloading}
          onClick={onReload}
        >
          <ReloadOutlined aria-hidden="true" /> {t.reloadPlan}
        </button>
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
