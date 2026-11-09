import { Select } from 'antd'
import type { Dispatch, SetStateAction } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import { getTicketSeverityLabel } from '../../../../../shared/lib/statusTone'
import { FilterBar } from '../../../components/common/FilterBar'
import { mgrPopupContainer } from '../../../components/common/mgrPopupContainer'
import { SEVERITIES } from '../maintenanceHelpers'
import { maintenancePageMessages } from '../MaintenancePage.messages'

type Props = {
  searchQuery: string
  setSearchQuery: Dispatch<SetStateAction<string>>
  priorityFilter: string
  setPriorityFilter: Dispatch<SetStateAction<string>>
  assignedFilter: string
  setAssignedFilter: Dispatch<SetStateAction<string>>
}

/** Search box on the left, labelled priority and assignment selects on the right. */
export function TicketFilterBar({
  searchQuery,
  setSearchQuery,
  priorityFilter,
  setPriorityFilter,
  assignedFilter,
  setAssignedFilter,
}: Props) {
  const { t, lang } = useI18n(maintenancePageMessages)
  return (
    <FilterBar
      search={{
        value: searchQuery,
        onChange: setSearchQuery,
        placeholder: t.page.searchPlaceholder,
        ariaLabel: t.page.searchAria,
      }}
      end={
        <div className="mgr-maint-selects">
          <label className="mgr-maint-select">
            <span className="mgr-maint-select-label">
              {t.page.priorityLabel}
            </span>
            <Select
              aria-label={t.page.priorityAria}
              value={priorityFilter}
              onChange={setPriorityFilter}
              getPopupContainer={mgrPopupContainer}
              popupMatchSelectWidth={false}
              options={[
                { value: 'ALL', label: t.page.priorityAll },
                ...[...SEVERITIES].reverse().map((severity) => ({
                  value: severity,
                  label: getTicketSeverityLabel(severity, lang),
                })),
              ]}
            />
          </label>
          <label className="mgr-maint-select">
            <span className="mgr-maint-select-label">
              {t.page.assignedLabel}
            </span>
            <Select
              aria-label={t.page.assignedAria}
              value={assignedFilter}
              onChange={setAssignedFilter}
              getPopupContainer={mgrPopupContainer}
              popupMatchSelectWidth={false}
              options={[
                { value: 'ALL', label: t.page.assignedAll },
                { value: 'UNASSIGNED', label: t.page.assignedUnassigned },
                { value: 'ASSIGNED', label: t.page.assignedAssigned },
              ]}
            />
          </label>
        </div>
      }
    />
  )
}
