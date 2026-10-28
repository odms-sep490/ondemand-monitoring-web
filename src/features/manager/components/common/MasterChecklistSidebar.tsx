import './missionPages.css'
import { useState } from 'react'
import type { OrderChecklistSnapshot } from '../../types/orders'
import type { ExecutionPlan } from '../../types/planning'
import type { MissionResponse } from '../../types/missions'
import { useI18n } from '../../../../shared/i18n'
import { OrderIcon } from './OrderIcon'
import { masterChecklistSidebarMessages } from './MasterChecklistSidebar.messages'

interface MasterChecklistSidebarProps {
  items: OrderChecklistSnapshot[]
  plan: ExecutionPlan
  missions: MissionResponse[]
  collapsed: boolean
  onToggleCollapse: () => void
}

export function MasterChecklistSidebar({
  items,
  plan,
  missions,
  collapsed,
  onToggleCollapse,
}: MasterChecklistSidebarProps) {
  const { t } = useI18n(masterChecklistSidebarMessages)
  const [filterQuery, setFilterQuery] = useState('')

  // Map each assigned checklist item ID to the mission code
  const assignedItemMap = new Map<string, { missionId: string; missionCode: string }>()
  plan.missions.forEach((mScope) => {
    const mission = missions.find((m) => m.id === mScope.missionId)
    const missionCode = mission?.missionCode || mScope.scopeLabel || t.fallbackMission
    mScope.checklistItemIds?.forEach((cId: string) => {
      assignedItemMap.set(cId, { missionId: mScope.missionId, missionCode })
    })
  })

  const assignedItems: Array<OrderChecklistSnapshot & { missionCode: string }> = []
  const unassignedItems: OrderChecklistSnapshot[] = []

  items.forEach((item) => {
    const isUncovered = plan.coverage.uncoveredItemIds.includes(item.id)
    const assignment = assignedItemMap.get(item.id)
    if (!isUncovered && assignment) {
      assignedItems.push({ ...item, missionCode: assignment.missionCode })
    } else {
      unassignedItems.push(item)
    }
  })

  const filteredAssigned = assignedItems.filter((i) =>
    (i.content || i.description || '').toLowerCase().includes(filterQuery.toLowerCase()),
  )
  const filteredUnassigned = unassignedItems.filter((i) =>
    (i.content || i.description || '').toLowerCase().includes(filterQuery.toLowerCase()),
  )

  if (collapsed) {
    return null
  }

  return (
    <aside className="odm-master-checklist-sidebar" aria-label={t.title}>
      <header className="odm-sidebar-header">
        <h3>
          <OrderIcon name="check" size={18} /> {t.title}
        </h3>
        <button
          type="button"
          className="odm-btn odm-btn-sm"
          onClick={onToggleCollapse}
          title={t.collapse}
          aria-label={t.collapse}
        >
          {t.collapse} ‹
        </button>
      </header>

      {items.length > 5 && (
        <input
          type="search"
          placeholder={t.searchPlaceholder}
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          className="odm-input odm-input-sm odm-master-search"
        />
      )}

      {/* Row Block 1: Checklist đã được assign */}
      <div className="odm-checklist-block">
        <div className="odm-checklist-block-head">
          <span className="odm-master-head is-ok">
            {t.assigned(assignedItems.length, items.length)}
          </span>
        </div>
        <div className="odm-checklist-card-list">
          {filteredAssigned.length === 0 ? (
            <p className="odm-mission-meta odm-master-note">
              {t.assignedEmpty}
            </p>
          ) : (
            filteredAssigned.map((item) => (
              <div key={item.id} className="odm-master-item-card is-assigned">
                <span className="odm-master-name">{item.content}</span>
                {item.description && (
                  <span className="odm-master-desc">{item.description}</span>
                )}
                <div className="odm-master-item-meta">
                  <span className="odm-mcard-sec-badge is-assigned">
                    {item.missionCode}
                  </span>
                  <span>• {item.sourceType === 'CUSTOMER_CUSTOM' ? t.customer : t.standard}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Row Block 2: Checklist chưa được assign */}
      <div className="odm-checklist-block">
        <div className="odm-checklist-block-head">
          <span className={`odm-master-head ${unassignedItems.length > 0 ? 'is-warn' : 'is-idle'}`}>
            {t.unassigned(unassignedItems.length)}
          </span>
        </div>
        <div className="odm-checklist-card-list">
          {filteredUnassigned.length === 0 ? (
            <p className="odm-mission-meta odm-master-note is-ok">
              {t.unassignedEmpty}
            </p>
          ) : (
            filteredUnassigned.map((item) => (
              <div key={item.id} className="odm-master-item-card is-unassigned">
                <span className="odm-master-name">{item.content}</span>
                {item.description && (
                  <span className="odm-master-desc">{item.description}</span>
                )}
                <div className="odm-master-item-meta">
                  <span>{t.order(item.displayOrder)}</span>
                  <span>• {item.sourceType === 'CUSTOMER_CUSTOM' ? t.customer : t.standard}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  )
}
