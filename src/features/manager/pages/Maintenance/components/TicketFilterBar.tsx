import { maintenancePageMessages } from '../MaintenancePage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { Dispatch, SetStateAction } from 'react'

export function TicketFilterBar({
  searchQuery,
  setSearchQuery,
  priorityFilter,
  setPriorityFilter,
  assignedFilter,
  setAssignedFilter,
}: {
  searchQuery: string
  setSearchQuery: Dispatch<SetStateAction<string>>
  priorityFilter: string
  setPriorityFilter: Dispatch<SetStateAction<string>>
  assignedFilter: string
  setAssignedFilter: Dispatch<SetStateAction<string>>
}) {
  const { t } = useI18n(maintenancePageMessages)
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        marginBottom: 16,
        background: '#ffffff',
        padding: '10px 16px',
        borderRadius: 12,
        border: '1px solid #e2e8f0',
      }}
    >
      <div style={{ flex: 1 }}>
        <input
          className="odm-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.page.searchPlaceholder}
          style={{
            width: '100%',
            height: 38,
            borderRadius: 8,
            paddingLeft: 12,
            fontSize: 13,
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: '#64748b' }}>
          {t.page.priorityLabel}
        </span>
        <select
          className="odm-input"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          style={{ height: 38, borderRadius: 8, fontSize: 13 }}
        >
          <option value="ALL">{t.page.priorityAll}</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        <span style={{ fontSize: 13, color: '#64748b' }}>
          {t.page.assignedLabel}
        </span>
        <select
          className="odm-input"
          value={assignedFilter}
          onChange={(e) => setAssignedFilter(e.target.value)}
          style={{ height: 38, borderRadius: 8, fontSize: 13 }}
        >
          <option value="ALL">{t.page.assignedAll}</option>
          <option value="UNASSIGNED">{t.page.assignedUnassigned}</option>
          <option value="ASSIGNED">{t.page.assignedAssigned}</option>
        </select>
      </div>
    </div>
  )
}
