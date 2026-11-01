import { Avatar } from 'antd'
import type { ColumnsType } from 'antd/es/table'

import {
  StatusTag,
  TableComponent,
} from '../../../../../shared/components/antd'
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

type Props = {
  items: AdminAccountItem[]
  loading?: boolean
  pagination: {
    current: number
    pageSize: number
    total: number
    onChange: (page: number) => void
  }
  onEdit: (a: AdminAccountItem) => void
  onLock: (a: AdminAccountItem) => void
  onResetPassword: (a: AdminAccountItem) => void
}

export function AccountsTable({
  items,
  loading,
  pagination,
  onEdit,
  onLock,
  onResetPassword,
}: Props) {
  const { t, lang } = useI18n(accountsTableMessages)

  const columns: ColumnsType<AdminAccountItem> = [
    {
      title: t.columnUser,
      key: 'user',
      render: (_, acc) => (
        <div className="adm-cell-user">
          <Avatar className="mgr-cust-avatar" aria-hidden="true">
            {initials(acc.fullName)}
          </Avatar>
          <div className="mgr-cell-stack">
            <button
              type="button"
              className="adm-list-link"
              onClick={() => onEdit(acc)}
            >
              {acc.fullName}
            </button>
            <span className="mgr-cell-sub">{acc.email}</span>
          </div>
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
          <div className="mgr-cell-stack">
            <StatusTag tone={meta.tone}>{meta.label}</StatusTag>
            {!acc.emailVerified && (
              <span className="mgr-cell-sub adm-warn">{t.unverifiedEmail}</span>
            )}
          </div>
        )
      },
    },
    {
      title: t.columnLastLogin,
      key: 'lastLogin',
      className: 'mgr-nowrap',
      render: (_, acc) => (
        <span className="adm-mono">
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
      className="adm-wide-table"
      columns={columns}
      dataSource={items}
      loading={loading}
      pagination={{
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: pagination.total,
        showSizeChanger: false,
        hideOnSinglePage: true,
        onChange: pagination.onChange,
      }}
    />
  )
}
