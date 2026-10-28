import { Button } from 'antd'
import type { ColumnsType } from 'antd/es/table'

import { CardComponent, TableComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import type { DeviceResponse } from '../../../types/drones'
import { MANUAL_TRANSITIONS } from '../droneHelpers'
import { dronesPageMessages } from '../DronesPage.messages'
import { DroneStatusTag } from './DroneStatusTag'

type Props = {
  visible: DeviceResponse[]
  total: number
  onChangeStatus: (drone: DeviceResponse) => void
}

export function DronesTable({ visible, total, onChangeStatus }: Props) {
  const { t, locale } = useI18n(dronesPageMessages)
  const columns: ColumnsType<DeviceResponse> = [
    {
      title: t.columns.device,
      key: 'device',
      render: (_, drone) => (
        <span className="mgr-cell-stack">
          <span className="mgr-code">{drone.serialNumber}</span>
          {drone.name ? <span className="mgr-cell-sub">{drone.name}</span> : null}
        </span>
      ),
    },
    {
      title: t.columns.model,
      key: 'model',
      responsive: ['md'],
      render: (_, drone) => (
        <span className="mgr-cell-stack">
          <span>{drone.deviceModel?.modelName ?? drone.deviceModel?.code ?? '—'}</span>
          {drone.deviceModel?.manufacturer ? (
            <span className="mgr-cell-sub">{drone.deviceModel.manufacturer}</span>
          ) : null}
        </span>
      ),
    },
    {
      title: t.columns.status,
      key: 'status',
      render: (_, drone) => <DroneStatusTag status={drone.status} />,
    },
    {
      title: t.columns.updated,
      key: 'updated',
      responsive: ['lg'],
      render: (_, drone) => (
        <span className="mgr-cell-sub mgr-nowrap">
          {drone.updatedAt ? new Date(drone.updatedAt).toLocaleString(locale) : '—'}
        </span>
      ),
    },
    {
      title: t.columns.actions,
      key: 'actions',
      align: 'right',
      render: (_, drone) =>
        (MANUAL_TRANSITIONS[drone.status]?.length ?? 0) > 0 ? (
          <Button size="small" onClick={() => onChangeStatus(drone)}>
            {t.changeStatus}
          </Button>
        ) : null,
    },
  ]
  return (
    <CardComponent styles={{ body: { padding: 0 } }}>
      <TableComponent<DeviceResponse> rowKey="id" columns={columns} dataSource={visible} />
      <div className="mgr-table-foot">{t.resultCount(visible.length, total)}</div>
    </CardComponent>
  )
}
