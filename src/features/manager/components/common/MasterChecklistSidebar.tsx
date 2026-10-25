import { useState } from 'react'
import type { OrderChecklistSnapshot } from '../../types/orders'
import type { ExecutionPlan } from '../../types/planning'
import type { MissionResponse } from '../../types/missions'
import { OrderIcon } from './OrderIcon'

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
  const [filterQuery, setFilterQuery] = useState('')

  // Map each assigned checklist item ID to the mission code
  const assignedItemMap = new Map<string, { missionId: string; missionCode: string }>()
  plan.missions.forEach((mScope) => {
    const mission = missions.find((m) => m.id === mScope.missionId)
    const missionCode = mission?.missionCode || mScope.scopeLabel || 'Nhiệm vụ'
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
    <aside className="odm-master-checklist-sidebar" aria-label="Danh sách nhiệm vụ">
      <header className="odm-sidebar-header">
        <h3>
          <OrderIcon name="check" size={18} /> Danh sách nhiệm vụ
        </h3>
        <button
          type="button"
          className="odm-btn odm-btn-sm"
          onClick={onToggleCollapse}
          title="Thu gọn "
          aria-label="Thu gọn "
        >
          Thu gọn ‹
        </button>
      </header>

      {items.length > 5 && (
        <input
          type="search"
          placeholder="Tìm nhiệm vụ..."
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          className="odm-input odm-input-sm"
          style={{ width: '100%', boxSizing: 'border-box' }}
        />
      )}

      {/* Row Block 1: Checklist đã được assign */}
      <div className="odm-checklist-block">
        <div className="odm-checklist-block-head">
          <span style={{ color: '#059669' }}>
            Đã phân công ({assignedItems.length}/{items.length})
          </span>
        </div>
        <div className="odm-checklist-card-list">
          {filteredAssigned.length === 0 ? (
            <p className="odm-mission-meta" style={{ fontStyle: 'italic', margin: '4px 0' }}>
              Chưa có nhiệm vụ nào được phân công.
            </p>
          ) : (
            filteredAssigned.map((item) => (
              <div key={item.id} className="odm-master-item-card is-assigned">
                <span style={{ fontWeight: 600 }}>{item.content}</span>
                {item.description && (
                  <span style={{ fontSize: 12, color: 'var(--tx3)' }}>{item.description}</span>
                )}
                <div className="odm-master-item-meta">
                  <span className="odm-mcard-sec-badge" style={{ background: '#d1fae5', color: '#065f46' }}>
                    {item.missionCode}
                  </span>
                  <span>• {item.sourceType === 'CUSTOMER_CUSTOM' ? 'Khách yêu cầu' : 'Tiêu chuẩn'}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Row Block 2: Checklist chưa được assign */}
      <div className="odm-checklist-block">
        <div className="odm-checklist-block-head">
          <span style={{ color: unassignedItems.length > 0 ? '#d97706' : '#6b7280' }}>
            Chưa phân công ({unassignedItems.length})
          </span>
        </div>
        <div className="odm-checklist-card-list">
          {filteredUnassigned.length === 0 ? (
            <p className="odm-mission-meta" style={{ fontStyle: 'italic', margin: '4px 0', color: '#10b981' }}>
              Tất cả nhiệm vụ đã được phân công đầy đủ
            </p>
          ) : (
            filteredUnassigned.map((item) => (
              <div key={item.id} className="odm-master-item-card is-unassigned">
                <span style={{ fontWeight: 600 }}>{item.content}</span>
                {item.description && (
                  <span style={{ fontSize: 12, color: 'var(--tx3)' }}>{item.description}</span>
                )}
                <div className="odm-master-item-meta">
                  <span>Thứ tự #{item.displayOrder}</span>
                  <span>• {item.sourceType === 'CUSTOMER_CUSTOM' ? 'Khách yêu cầu' : 'Tiêu chuẩn'}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  )
}
