import type { ColumnsType } from 'antd/es/table'

import { TableComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { AdminToggle } from '../../../components/common/AdminToggle'
import type { AdminStation } from '../../../types/catalog'
import { RowActions } from './RowActions'
import { stationsTableMessages } from './StationsTable.messages'

export function StationsTable({
  items,
  togglingId,
  onEdit,
  onToggle,
}: {
  items: AdminStation[]
  togglingId: string | null
  onEdit: (s: AdminStation) => void
  onToggle: (s: AdminStation) => void
}) {
  const { t } = useI18n(stationsTableMessages)
  const columns: ColumnsType<AdminStation> = [
    {
      title: t.station,
      key: 'station',
      render: (_, s) => (
        <span className="mgr-cell-stack">
          <strong className="adm-wrap">{s.name}</strong>
          <span className="mgr-cell-sub adm-wrap">{s.address}</span>
        </span>
      ),
    },
    {
      title: t.coords,
      key: 'coords',
      responsive: ['md'],
      render: (_, s) => (
        <span className="mgr-code">
          {s.lat.toFixed(4)}, {s.lon.toFixed(4)}
        </span>
      ),
    },
    {
      title: t.radius,
      key: 'radius',
      responsive: ['md'],
      render: (_, s) => <span className="mgr-nowrap">{(s.maxServiceRadiusM / 1000).toFixed(0)} km</span>,
    },
    {
      title: t.active,
      key: 'active',
      render: (_, s) => (
        <AdminToggle
          active={s.isActive}
          label={s.name}
          onToggle={() => onToggle(s)}
          disabled={togglingId === s.id}
        />
      ),
    },
    {
      title: t.actions,
      key: 'actions',
      align: 'right',
      render: (_, s) => <RowActions label={s.name} onEdit={() => onEdit(s)} />,
    },
  ]
  return <TableComponent<AdminStation> rowKey="id" columns={columns} dataSource={items} />
}
