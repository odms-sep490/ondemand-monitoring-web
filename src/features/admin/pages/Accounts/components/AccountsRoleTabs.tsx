import { Segmented } from 'antd'

import { useI18n } from '../../../../../shared/i18n'
import { BE_USER_ROLES, type ManagedUserRole } from '../../../api/adminUsersApi'
import { roleBadgeMessages } from '../../../components/common/RoleBadge.messages'
import type { AccountStats } from '../../../lib/accountStats'
import { accountsRoleTabsMessages } from './AccountsRoleTabs.messages'

type Props = {
  value: ManagedUserRole | ''
  /** Counts per role; `undefined` while loading or when the request failed. */
  stats: AccountStats | undefined
  onChange: (role: ManagedUserRole | '') => void
}

/** Role chips with live counts; the colour of each chip is the role token. */
export function AccountsRoleTabs({ value, stats, onChange }: Props) {
  const { t } = useI18n(accountsRoleTabsMessages)
  const { t: roles } = useI18n(roleBadgeMessages)

  const chip = (tone: string, label: string, count: number | undefined) => (
    <span className={`adm-role-tab is-${tone}`}>
      <span className="adm-role-tab-label">{label}</span>
      <span
        className="adm-role-tab-count"
        data-testid={`role-tab-count-${tone}`}
      >
        {count ?? '–'}
      </span>
    </span>
  )

  return (
    <div className="adm-role-tabs">
      <Segmented<ManagedUserRole | ''>
        aria-label={t.aria}
        value={value}
        onChange={onChange}
        options={[
          { value: '', label: chip('all', t.all, stats?.total) },
          ...BE_USER_ROLES.map((role) => ({
            value: role,
            label: chip(
              role.toLowerCase(),
              roles.labels[role],
              stats?.byRole[role],
            ),
          })),
        ]}
      />
    </div>
  )
}
