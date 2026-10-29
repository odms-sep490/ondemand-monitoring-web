import type { ColumnsType } from 'antd/es/table'

import { StatusTag, TableComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { formatVnd } from '../../../../../shared/lib/formatVnd'
import { fmtDateTime } from '../../../lib/accountStatus'
import type { AdminService } from '../../../types/catalog'
import { ServiceRowActions } from './ServiceRowActions'
import { servicesTableMessages } from './ServicesTable.messages'

export function ServicesTable({
  items,
  onEdit,
  onDelete,
}: {
  items: AdminService[]
  onEdit: (s: AdminService) => void
  onDelete: (s: AdminService) => void
}) {
  const { t, lang } = useI18n(servicesTableMessages)
  const columns: ColumnsType<AdminService> = [
    {
      title: t.service,
      key: 'service',
      render: (_, s) => (
        <div className="adm-service-cell">
          {s.imageUrl && (
            <img className="adm-service-thumbnail" src={s.imageUrl} alt="" loading="lazy" />
          )}
          <span className="mgr-cell-stack">
            <strong className="adm-wrap">{s.name}</strong>
            {s.description && (
              <span className="mgr-cell-sub adm-wrap adm-service-description">{s.description}</span>
            )}
          </span>
        </div>
      ),
    },
    {
      title: t.basePrice,
      key: 'price',
      render: (_, s) => (
        <strong className="mgr-nowrap">
          {s.priceSource === 'UNPRICED' ? t.unpriced : formatVnd(s.defaultPrice ?? s.basePrice)}
        </strong>
      ),
    },
    {
      title: t.status,
      key: 'status',
      render: (_, s) => (
        <StatusTag tone={s.isActive ? 'success' : 'neutral'}>
          {s.isActive ? t.active : t.inactive}
        </StatusTag>
      ),
    },
    {
      title: t.updated,
      key: 'updated',
      responsive: ['lg'],
      render: (_, s) => (
        <span className="mgr-cell-sub mgr-nowrap">
          {s.updatedAt ? fmtDateTime(s.updatedAt, lang) : '—'}
        </span>
      ),
    },
    {
      title: t.actions,
      key: 'actions',
      align: 'right',
      render: (_, s) => (
        <ServiceRowActions service={s} edit={() => onEdit(s)} remove={() => onDelete(s)} />
      ),
    },
  ]
  return (
    <TableComponent<AdminService>
      rowKey="id"
      columns={columns}
      dataSource={items}
      scroll={{ x: 640 }}
    />
  )
}
