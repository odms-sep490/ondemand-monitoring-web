import { Select } from 'antd'

import { FilterBar } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import type { AccountsFilterState, StatusFilter } from '../listParams'
import { accountsFiltersMessages } from './AccountsFilters.messages'

export function AccountsFilters({
  value,
  onChange,
}: {
  value: AccountsFilterState
  onChange: (next: AccountsFilterState) => void
}) {
  const { t } = useI18n(accountsFiltersMessages)

  return (
    <FilterBar
      search={{
        value: value.search,
        onChange: (search) => onChange({ ...value, search }),
        placeholder: t.searchPlaceholder,
        ariaLabel: t.searchAria,
      }}
      end={
        <>
          <Select<StatusFilter>
            className="adm-filter-select"
            aria-label={t.statusAria}
            value={value.status}
            onChange={(status) => onChange({ ...value, status })}
            options={[
              { value: '', label: t.allStatuses },
              { value: 'active', label: t.active },
              { value: 'locked', label: t.locked },
              { value: 'unverified', label: t.unverified },
            ]}
          />
        </>
      }
    />
  )
}
