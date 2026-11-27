import { useI18n } from '../../../../../shared/i18n'
import { RoleBadge } from '../../../components/common/RoleBadge'
import { StatusBadge, toUiTone } from '../../../../../shared/components/ui'
import {
  fmtDate,
  fmtDateTime,
  getAccountStatusMeta,
} from '../../../lib/accountStatus'
import { Icon } from '../../../../../shared/components/Icon'
import type { AdminAccountItem } from '../../../types/accounts'
import { AccountActions } from './AccountActions'
import { accountsTableMessages } from './AccountsTable.messages'

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

export function AccountsTable({
  items,
  onEdit,
  onLock,
}: {
  items: AdminAccountItem[]
  onEdit: (a: AdminAccountItem) => void
  onLock: (a: AdminAccountItem) => void
}) {
  const { t, lang } = useI18n(accountsTableMessages)
  return (
    <table className="odm-adm-table accounts-table" aria-label={t.tableLabel}>
      <thead>
        <tr>
          <th scope="col">{t.columnUser}</th>
          <th scope="col">{t.columnRole}</th>
          <th scope="col">{t.columnStatus}</th>
          <th scope="col">{t.columnLastLogin}</th>
          <th scope="col" className="adm-text-right">
            {t.columnActions}
          </th>
        </tr>
      </thead>
      <tbody>
        {items.map((acc) => {
          const meta = getAccountStatusMeta(acc.status, lang)
          return (
            <tr key={acc.id}>
              <td>
                <div className="adm-cell-user">
                  <span
                    className={`accounts-avatar is-${acc.role.toLowerCase()}`}
                    aria-hidden="true"
                  >
                    {initials(acc.fullName)}
                  </span>
                  <div className="accounts-identity">
                    <button
                      type="button"
                      className="adm-list-link"
                      onClick={() => onEdit(acc)}
                    >
                      {acc.fullName}
                    </button>
                    <div className="adm-cell-email">{acc.email}</div>
                  </div>
                </div>
              </td>
              <td>
                <RoleBadge role={acc.role} />
              </td>
              <td>
                <StatusBadge tone={toUiTone(meta.tone)}>
                  {meta.label}
                </StatusBadge>
                <div
                  className={`accounts-verification ${acc.emailVerified ? 'is-verified' : 'is-unverified'}`}
                >
                  <Icon
                    name={acc.emailVerified ? 'check' : 'mail'}
                    width={13}
                    height={13}
                    aria-hidden="true"
                  />
                  {acc.emailVerified ? t.verifiedEmail : t.unverifiedEmail}
                </div>
              </td>
              <td className="adm-cell-mono">
                <span
                  className={
                    acc.lastLoginAt
                      ? 'accounts-last-login'
                      : 'accounts-never-login'
                  }
                >
                  {acc.lastLoginAt
                    ? fmtDateTime(acc.lastLoginAt, lang)
                    : t.neverLoggedIn}
                </span>
                <div className="accounts-created-at">
                  {t.createdAt(fmtDate(acc.createdAt, lang))}
                </div>
              </td>
              <td>
                <AccountActions
                  account={acc}
                  onEdit={() => onEdit(acc)}
                  onLock={() => onLock(acc)}
                />
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
