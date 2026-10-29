import { Avatar, Button } from 'antd'
import type { TablePaginationConfig } from 'antd'
import type { ColumnsType } from 'antd/es/table'

import { StatusTag, TableComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { fmtDateTime } from '../../../lib/accountStatus'
import type { AuditEntry } from '../../../types/auditLog'
import { ACTION_TONE, auditActionMessages } from '../auditActions'
import { auditTableMessages } from './AuditTable.messages'

function initials(name: string) {
  return name
    .split(' ')
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

type Props = {
  items: AuditEntry[]
  pagination: TablePaginationConfig
  onView: (entry: AuditEntry) => void
}

export function AuditTable({ items, pagination, onView }: Props) {
  const { t, lang } = useI18n(auditTableMessages)
  const { t: actions } = useI18n(auditActionMessages)
  const columns: ColumnsType<AuditEntry> = [
    {
      title: t.createdAt,
      key: 'createdAt',
      render: (_, e) => <span className="mgr-cell-sub mgr-nowrap">{fmtDateTime(e.createdAt, lang)}</span>,
    },
    {
      title: t.actor,
      key: 'actor',
      render: (_, e) => (
        <div className="adm-cell-user">
          <Avatar size={28} aria-hidden="true">
            {initials(e.actorName)}
          </Avatar>
          <span className="adm-wrap">{e.actorName}</span>
        </div>
      ),
    },
    {
      title: t.action,
      key: 'action',
      render: (_, e) => <StatusTag tone={ACTION_TONE[e.action]}>{actions[e.action]}</StatusTag>,
    },
    {
      title: t.entityType,
      key: 'entityType',
      responsive: ['md'],
      render: (_, e) => <span className="adm-wrap">{e.entityType}</span>,
    },
    {
      title: t.entityId,
      key: 'entityId',
      responsive: ['lg'],
      render: (_, e) => (
        <span className="mgr-code adm-wrap" title={e.entityId}>
          {e.entityId.slice(0, 20)}
          {e.entityId.length > 20 ? '...' : ''}
        </span>
      ),
    },
    {
      title: t.ip,
      key: 'ip',
      responsive: ['lg'],
      render: (_, e) => <span className="mgr-code">{e.ip}</span>,
    },
    {
      title: t.actions,
      key: 'actions',
      align: 'right',
      render: (_, e) => (
        <Button
          size="small"
          aria-label={`${t.viewDiff} ${e.entityType} ${e.entityId}`}
          onClick={() => onView(e)}
        >
          {t.viewDiff}
        </Button>
      ),
    },
  ]
  return (
    <TableComponent<AuditEntry>
      rowKey="id"
      columns={columns}
      dataSource={items}
      pagination={pagination}
    />
  )
}
