import { Select } from 'antd'

import { useI18n } from '../../../../shared/i18n'
import { FilterBar } from '../../../manager/components/common/FilterBar'
import { staffSupportMessages } from './StaffSupportDashboard.messages'

const STATUS_FILTERS = [
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
}

export function SupportFilters({
  search,
  onSearch,
  status,
  onStatus,
  category,
  onCategory,
}: Props) {
  const { t } = useI18n(staffSupportMessages)
  return (
    <FilterBar
      search={{
        value: search,
        onChange: onSearch,
        placeholder: t.filter.searchPlaceholder,
        ariaLabel: t.filter.searchAria,
      }}
      end={
        <>
          <Select
            aria-label={t.filter.statusAria}
            value={status}
            onChange={onStatus}
            popupMatchSelectWidth={false}
            className="sd-select"
            options={[
              { value: 'ALL', label: t.filter.statusAll },
              ...STATUS_FILTERS.map((value) => ({
                value,
                label: t.status[value],
              })),
            ]}
          />
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
        </>
      }
    />
  )
}
