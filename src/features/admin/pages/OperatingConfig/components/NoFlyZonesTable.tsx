import { Button, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'

import { StatusTag, TableComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import type { NoFlyZone } from '../../../types/operatingConfig'
import { noFlyZonesTableMessages } from './NoFlyZonesTable.messages'
import { ZONE_TYPE_TONE, zoneTypeMessages } from './zoneTypes'

type Props = {
  items: NoFlyZone[]
  onEdit: (zone: NoFlyZone) => void
  onToggle: (zone: NoFlyZone) => void
}

export function NoFlyZonesTable({ items, onEdit, onToggle }: Props) {
  const { t } = useI18n(noFlyZonesTableMessages)
  const { t: zt } = useI18n(zoneTypeMessages)
  const columns: ColumnsType<NoFlyZone> = [
    {
      title: t.columnName,
      key: 'name',
      render: (_, zone) => <strong className="adm-wrap">{zone.name}</strong>,
    },
    {
      title: t.columnType,
      key: 'type',
      render: (_, zone) => (
        <StatusTag tone={ZONE_TYPE_TONE[zone.zoneType]}>{zt[zone.zoneType]}</StatusTag>
      ),
    },
    {
      title: t.columnSource,
      key: 'source',
      responsive: ['lg'],
      render: (_, zone) => <span className="mgr-cell-sub adm-wrap">{zone.source}</span>,
    },
    {
      title: t.columnRadius,
      key: 'radius',
      responsive: ['md'],
      render: (_, zone) => <span className="mgr-nowrap">{(zone.radiusM / 1000).toFixed(1)} km</span>,
    },
    {
      title: t.columnCeiling,
      key: 'ceiling',
      responsive: ['md'],
      render: (_, zone) => (zone.maxAltitudeM != null ? `${zone.maxAltitudeM}m` : t.unlimited),
    },
    {
      title: t.columnStatus,
      key: 'status',
      render: (_, zone) => (
        <StatusTag tone={zone.isActive ? 'success' : 'neutral'}>
          {zone.isActive ? t.active : t.off}
        </StatusTag>
      ),
    },
    {
      title: t.columnActions,
      key: 'actions',
      align: 'right',
      render: (_, zone) => (
        <Space size={4} className="adm-row-actions">
          <Button size="small" aria-label={`${t.edit} ${zone.name}`} onClick={() => onEdit(zone)}>
            {t.edit}
          </Button>
          <Button
            size="small"
            aria-label={`${zone.isActive ? t.off : t.on} ${zone.name}`}
            onClick={() => onToggle(zone)}
          >
            {zone.isActive ? t.off : t.on}
          </Button>
        </Space>
      ),
    },
  ]
  return <TableComponent<NoFlyZone> rowKey="id" columns={columns} dataSource={items} />
}
