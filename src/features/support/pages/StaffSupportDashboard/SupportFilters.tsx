import { Select } from 'antd'

import { useI18n } from '../../../../shared/i18n'
import { FilterBar, FilterSegments } from '../../../manager/components/common/FilterBar'
import { staffSupportMessages } from './StaffSupportDashboard.messages'

export const SUPPORT_STATUS_FILTERS = [
  'OPEN',
  'ASSIGNED',
  'IN_PROGRESS',
  'WAITING_FOR_CUSTOMER',
  'WAITING_FOR_STAFF',
  'RESOLVED',
] as const
const CATEGORY_FILTERS = [
  'ORDERS',
  'MISSIONS',
  'RESULTS',
  'MEDIA',
  'SCHEDULING',
  'ACCOUNT',
] as const

type Props = {
  search: string
  onSearch: (value: string) => void
  status: string
  onStatus: (value: string) => void
  category: string
  onCategory: (value: string) => void
  /** Ticket count per status (after search + category), 'ALL' = every ticket. */
  statusCounts: Record<string, number>
}

export function SupportFilters({
  search,
  onSearch,
  status,
  onStatus,
  category,
  onCategory,
  statusCounts,
}: Props) {
  const { t } = useI18n(staffSupportMessages)
  // Hide statuses nobody is in, so the segment row stays short.
  const statusOptions = [
    { value: 'ALL', label: t.filter.statusAll },
    ...SUPPORT_STATUS_FILTERS.filter(
      (value) => value === status || (statusCounts[value] ?? 0) > 0,
    ).map((value) => ({
      value: value as string,
      label: t.status[value],
    })),
  ]
  return (
    <FilterBar
      start={
        <FilterSegments<string>
          ariaLabel={t.filter.statusAria}
          value={status}
          onChange={onStatus}
          options={statusOptions}
        />
      }
      search={{
        value: search,
        onChange: onSearch,
        placeholder: t.filter.searchPlaceholder,
        ariaLabel: t.filter.searchAria,
      }}
      end={
        <Select
          aria-label={t.filter.categoryAria}
          value={category}
          onChange={onCategory}
          popupMatchSelectWidth={false}
          className="sd-select"
          options={[
            { value: 'ALL', label: t.filter.categoryAll },
            ...CATEGORY_FILTERS.map((value) => ({
              value,
              label: t.category[value],
            })),
          ]}
        />
      }
    />
  )
}
