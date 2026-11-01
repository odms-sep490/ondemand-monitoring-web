import { DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons'
import { Button, Popconfirm, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'

import { TableComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import type { AdminDevice } from '../../../types/devices'
import { devicesPageMessages } from '../DevicesPage.messages'
import { DeviceStatusTag } from './DeviceStatusTag'

type Props = {
  devices: AdminDevice[]
  loading?: boolean
  pagination: {
    current: number
    pageSize: number
    total: number
    onChange: (page: number, size: number) => void
  }
  deletingId: string | null
  onView: (device: AdminDevice) => void
  onEdit: (device: AdminDevice) => void
  onDelete: (device: AdminDevice) => void
}

export function DevicesTable({
  devices,
  loading,
  pagination,
  deletingId,
  onView,
  onEdit,
  onDelete,
}: Props) {
  const { t, locale } = useI18n(devicesPageMessages)
  const fmt = (iso: string) => new Date(iso).toLocaleString(locale)

  const columns: ColumnsType<AdminDevice> = [
    {
      title: t.colDevice,
      key: 'device',
      render: (_, d) => (
        <div className="mgr-cell-stack">
          <span className="adm-strong">{d.name}</span>
          <span className="mgr-cell-sub adm-mono">{d.serialNumber}</span>
        </div>
      ),
    },
    {
      title: t.colModel,
      key: 'model',
      render: (_, d) =>
        d.model ? (
          <div className="mgr-cell-stack">
            <span>{d.model.name}</span>
            <span className="mgr-cell-sub">{d.model.manufacturer}</span>
          </div>
        ) : (
          <span className="mgr-cell-sub">{t.noModel}</span>
        ),
    },
    {
      title: t.colStatus,
      key: 'status',
      render: (_, d) => <DeviceStatusTag status={d.status} />,
    },
    {
      title: t.colVersion,
      key: 'version',
      render: (_, d) => <span className="adm-mono">v{d.version}</span>,
    },
    {
      title: t.colUpdated,
      key: 'updated',
      className: 'mgr-nowrap',
      render: (_, d) => fmt(d.updatedAt),
    },
    {
      title: t.colActions,
      key: 'actions',
      align: 'right',
      render: (_, d) => (
        <Space size={4} className="adm-row-actions">
          <Button
            type="text"
            shape="circle"
            className="adm-action-btn is-info"
            icon={<EyeOutlined aria-hidden="true" aria-label={undefined} />}
            aria-label={`${t.view} ${d.serialNumber}`}
            onClick={() => onView(d)}
          />
          <Button
            type="text"
            shape="circle"
            className="adm-action-btn is-warning"
            icon={<EditOutlined aria-hidden="true" aria-label={undefined} />}
            aria-label={`${t.edit} ${d.serialNumber}`}
            onClick={() => onEdit(d)}
          />
          <Popconfirm
            title={t.deleteTitle}
            description={t.deleteDesc}
            okText={t.deleteOk}
            cancelText={t.cancel}
            okButtonProps={{ danger: true }}
            onConfirm={() => onDelete(d)}
          >
            <Button
              type="text"
              shape="circle"
              className="adm-action-btn is-danger"
              icon={
                <DeleteOutlined aria-hidden="true" aria-label={undefined} />
              }
              aria-label={`${t.remove} ${d.serialNumber}`}
              disabled={deletingId === d.id}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <TableComponent<AdminDevice>
      rowKey="id"
      className="adm-wide-table"
      columns={columns}
      dataSource={devices}
      loading={loading}
      pagination={{
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: pagination.total,
        showSizeChanger: true,
        showTotal: (total) => t.total(total),
        onChange: pagination.onChange,
      }}
    />
  )
}
