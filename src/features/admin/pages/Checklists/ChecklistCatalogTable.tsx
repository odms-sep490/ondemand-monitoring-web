import { EditOutlined } from '@ant-design/icons'
import { Button, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'

import { StatusTag, TableComponent } from '../../../../shared/components/antd'
import { useI18n } from '../../../../shared/i18n'
import { formatVnd } from '../../../../shared/lib/formatVnd'
import type { ChecklistDefinition } from '../../api/checklistsApi'
import { checklistMessages } from './checklists.messages'

export function ChecklistCatalogTable({
  rows,
  busy,
  onUsage,
  onEdit,
  onToggle,
}: {
  rows: ChecklistDefinition[]
  busy: boolean
  onUsage: (id: string) => void
  onEdit: (row: ChecklistDefinition) => void
  onToggle: (row: ChecklistDefinition) => void
}) {
  const { t, lang } = useI18n(checklistMessages)

  const columns: ColumnsType<ChecklistDefinition> = [
    {
      title: t.content,
      key: 'content',
      render: (_, row) => (
        <span className="adm-wrap checklist-content-cell">{row.content}</span>
      ),
    },
    {
      title: t.filter,
      key: 'status',
      render: (_, row) => (
        <StatusTag tone={row.isActive ? 'success' : 'neutral'}>
          {row.isActive ? t.active : t.inactive}
        </StatusTag>
      ),
    },
    {
      title: t.priceColumn,
      key: 'price',
      render: (_, row) => (
        <div className="mgr-cell-stack adm-mono">
          <strong>{formatVnd(row.basePrice ?? 0)}</strong>
          <span className="mgr-cell-sub">
            {row.includedImageCount ?? 0} {t.imagesShort} ·{' '}
            {row.includedVideoCount ?? 0} {t.videosShort}
            {row.pricingProfile ? ` · ${row.pricingProfile}` : ''}
          </span>
        </div>
      ),
    },
    {
      title: t.usage,
      key: 'usage',
      render: (_, row) => (
        <Button size="small" type="link" onClick={() => onUsage(row.id)}>
          {t.usedBy(row.usedByServiceCount ?? 0, row.usedByOrderCount ?? 0)}
        </Button>
      ),
    },
    {
      title: t.updated,
      key: 'updated',
      className: 'mgr-nowrap',
      render: (_, row) => (
        <span className="adm-mono">
          {new Date(row.updatedAt ?? row.createdAt).toLocaleString(
            lang === 'vi' ? 'vi-VN' : 'en-US',
          )}
        </span>
      ),
    },
    {
      title: t.actions,
      key: 'actions',
      align: 'right',
      render: (_, row) => (
        <Space size={4}>
          <Button
            size="small"
            icon={<EditOutlined aria-hidden="true" aria-label={undefined} />}
            disabled={busy}
            onClick={() => onEdit(row)}
          >
            {t.edit}
          </Button>
          <Button
            size="small"
            danger={row.isActive}
            disabled={busy}
            onClick={() => onToggle(row)}
          >
            {row.isActive ? t.deactivate : t.reactivate}
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <TableComponent<ChecklistDefinition>
      rowKey="id"
      className="adm-wide-table checklist-table"
      columns={columns}
      dataSource={rows}
      pagination={false}
      locale={{ emptyText: <span>{t.empty}</span> }}
    />
  )
}
