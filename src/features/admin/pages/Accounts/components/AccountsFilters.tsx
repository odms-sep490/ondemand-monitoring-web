import { Select } from 'antd'

import { FilterBar } from '../../../../../shared/components/antd'
import { mgrPopupContainer } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { BE_USER_ROLES, type ManagedUserRole } from '../../../api/adminUsersApi'
import { roleBadgeMessages } from '../../../components/common/RoleBadge.messages'
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
  const { t: roles } = useI18n(roleBadgeMessages)

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
          <Select<ManagedUserRole | ''>
            className="adm-filter-select"
            aria-label={t.roleAria}
            value={value.role}
            onChange={(role) => onChange({ ...value, role })}
            getPopupContainer={mgrPopupContainer}
            options={[
              { value: '', label: t.allRoles },
              ...BE_USER_ROLES.map((r) => ({ value: r, label: roles.labels[r] })),
            ]}
          />
          <Select<StatusFilter>
            className="adm-filter-select"
            aria-label={t.statusAria}
            value={value.status}
            onChange={(status) => onChange({ ...value, status })}
            getPopupContainer={mgrPopupContainer}
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
