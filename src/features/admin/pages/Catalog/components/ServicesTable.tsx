import type { ColumnsType } from 'antd/es/table'

import {
  StatusTag,
  TableComponent,
} from '../../../../../shared/components/antd'
import { displayLocalized, useI18n } from '../../../../../shared/i18n'
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
            <img
              className="adm-service-thumbnail"
              src={s.imageUrl}
              alt=""
              loading="lazy"
            />
          )}
          <div className="mgr-cell-stack">
            <span className="adm-wrap adm-strong">{displayLocalized(s.name)}</span>
            {s.description && (
              <span className="mgr-cell-sub adm-wrap adm-service-description">
                {displayLocalized(s.description)}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      title: t.basePrice,
      key: 'price',
      className: 'mgr-nowrap',
      render: (_, s) => (
        <span className="adm-mono adm-strong">
          {s.priceSource === 'UNPRICED'
            ? t.unpriced
            : formatVnd(s.defaultPrice ?? s.basePrice)}
        </span>
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
      className: 'mgr-nowrap',
      render: (_, s) => (
        <span className="adm-mono">
          {s.updatedAt ? fmtDateTime(s.updatedAt, lang) : '—'}
        </span>
      ),
    },
    {
      title: t.actions,
      key: 'actions',
      align: 'right',
      render: (_, s) => (
        <ServiceRowActions
          service={s}
          edit={() => onEdit(s)}
          remove={() => onDelete(s)}
        />
      ),
    },
  ]

  return (
    <TableComponent<AdminService>
      rowKey="id"
      className="adm-wide-table"
      columns={columns}
      dataSource={items}
    />
  )
}
