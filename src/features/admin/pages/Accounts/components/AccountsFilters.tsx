import { useI18n } from '../../../../../shared/i18n'
import { Icon } from '../../../../../shared/components/Icon'
import { Button } from '../../../../../shared/components/ui'
import { BE_USER_ROLES, type ManagedUserRole } from '../../../api/adminUsersApi'
import { roleBadgeMessages } from '../../../components/common/RoleBadge.messages'
import type { AccountsFilterState, StatusFilter } from '../listParams'
import { accountsFiltersMessages } from './AccountsFilters.messages'

export function AccountsFilters({
  value,
  onChange,
  onClear,
}: {
  value: AccountsFilterState
  onChange: (next: AccountsFilterState) => void
  onClear: () => void
}) {
  const { t } = useI18n(accountsFiltersMessages)
  const { t: roles } = useI18n(roleBadgeMessages)

  return (
    <div className="accounts-filters">
      <label className="accounts-filter accounts-filter-search">
        <span>{t.searchLabel}</span>
        <span className="accounts-search-input">
          <Icon name="search" width={18} height={18} aria-hidden="true" />
          <input
            className="odm-inp"
            type="search"
            value={value.search}
            onChange={(e) => onChange({ ...value, search: e.target.value })}
            placeholder={t.searchPlaceholder}
            aria-label={t.searchAria}
          />
        </span>
      </label>
      <label className="accounts-filter">
        <span>{t.roleAria}</span>
        <select
          className="odm-inp"
          aria-label={t.roleAria}
          value={value.role}
          onChange={(e) =>
            onChange({ ...value, role: e.target.value as ManagedUserRole | '' })
          }
        >
          <option value="">{t.allRoles}</option>
          {BE_USER_ROLES.map((r) => (
            <option key={r} value={r}>
              {roles.labels[r]}
            </option>
          ))}
        </select>
      </label>
      <label className="accounts-filter">
        <span>{t.statusAria}</span>
        <select
          className="odm-inp"
          aria-label={t.statusAria}
          value={value.status}
          onChange={(e) =>
            onChange({ ...value, status: e.target.value as StatusFilter })
          }
        >
          <option value="">{t.allStatuses}</option>
          <option value="active">{t.active}</option>
          <option value="locked">{t.locked}</option>
          <option value="unverified">{t.unverified}</option>
        </select>
      </label>
      <Button
        variant="ghost"
        icon="x"
        className="accounts-clear-filters"
        onClick={onClear}
        disabled={!value.search && !value.role && !value.status}
      >
        {t.clearFilters}
      </Button>
    </div>
  )
}
