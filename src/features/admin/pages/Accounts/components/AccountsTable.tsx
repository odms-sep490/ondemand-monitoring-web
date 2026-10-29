import { Avatar } from 'antd'
import type { TablePaginationConfig } from 'antd'
import type { ColumnsType } from 'antd/es/table'

import { StatusTag, TableComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { RoleBadge } from '../../../components/common/RoleBadge'
import { fmtDateTime, getAccountStatusMeta } from '../../../lib/accountStatus'
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
  pagination,
  onEdit,
  onLock,
  onResetPassword,
}: {
  items: AdminAccountItem[]
  pagination: TablePaginationConfig
  onEdit: (a: AdminAccountItem) => void
  onLock: (a: AdminAccountItem) => void
  onResetPassword: (a: AdminAccountItem) => void
}) {
  const { t, lang } = useI18n(accountsTableMessages)
  const columns: ColumnsType<AdminAccountItem> = [
    {
      title: t.columnUser,
      key: 'user',
      render: (_, acc) => (
        <div className="adm-cell-user">
          <Avatar aria-hidden="true">{initials(acc.fullName)}</Avatar>
          <span className="mgr-cell-stack">
            <button type="button" className="adm-list-link" onClick={() => onEdit(acc)}>
              {acc.fullName}
            </button>
            <span className="mgr-cell-sub">{acc.email}</span>
          </span>
        </div>
      ),
    },
    {
      title: t.columnRole,
      key: 'role',
      render: (_, acc) => <RoleBadge role={acc.role} />,
    },
    {
      title: t.columnStatus,
      key: 'status',
      render: (_, acc) => {
        const meta = getAccountStatusMeta(acc.status, lang)
        return (
          <span className="adm-tag-stack">
            <StatusTag tone={meta.tone}>{meta.label}</StatusTag>
            {!acc.emailVerified && <StatusTag tone="warning">{t.unverifiedEmail}</StatusTag>}
          </span>
        )
      },
    },
    {
      title: t.columnLastLogin,
      key: 'lastLogin',
      responsive: ['lg'],
      render: (_, acc) => (
        <span className="mgr-cell-sub mgr-nowrap">
          {acc.lastLoginAt ? fmtDateTime(acc.lastLoginAt, lang) : '—'}
        </span>
      ),
    },
    {
      title: t.columnActions,
      key: 'actions',
      align: 'right',
      render: (_, acc) => (
        <AccountActions
          account={acc}
          onEdit={() => onEdit(acc)}
          onLock={() => onLock(acc)}
          onResetPassword={() => onResetPassword(acc)}
        />
      ),
    },
  ]
  return (
    <TableComponent<AdminAccountItem>
      rowKey="id"
      columns={columns}
      dataSource={items}
      pagination={pagination}
    />
  )
}
