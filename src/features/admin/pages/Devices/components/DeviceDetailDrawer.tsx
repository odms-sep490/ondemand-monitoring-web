import { Descriptions, Drawer } from 'antd'

import { useI18n } from '../../../../../shared/i18n'
import type { AdminDevice } from '../../../types/devices'
import { devicesPageMessages } from '../DevicesPage.messages'
import { DeviceStatusTag } from './DeviceStatusTag'

export function DeviceDetailDrawer({
  device,
  onClose,
}: {
  device: AdminDevice | null
  onClose: () => void
}) {
  const { t, locale } = useI18n(devicesPageMessages)
  const fmt = (iso: string) => new Date(iso).toLocaleString(locale)

  return (
    <Drawer
      open={device !== null}
      onClose={onClose}
      title={t.detailTitle}
      width={420}
      destroyOnClose
    >
      {device ? (
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label={t.fieldName}>
            {device.name}
          </Descriptions.Item>
          <Descriptions.Item label={t.fieldSerial}>
            <span className="adm-mono">{device.serialNumber}</span>
          </Descriptions.Item>
          <Descriptions.Item label={t.fieldStatus}>
            <DeviceStatusTag status={device.status} />
          </Descriptions.Item>
          <Descriptions.Item label={t.fieldModel}>
            {device.model?.name ?? t.noModel}
          </Descriptions.Item>
          <Descriptions.Item label={t.fieldModelCode}>
            {device.model?.code ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t.fieldManufacturer}>
            {device.model?.manufacturer ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t.fieldId}>
            <span className="adm-mono">{device.id}</span>
          </Descriptions.Item>
          <Descriptions.Item label={t.fieldVersion}>
            v{device.version}
          </Descriptions.Item>
          <Descriptions.Item label={t.fieldCreated}>
            {fmt(device.createdAt)}
          </Descriptions.Item>
          <Descriptions.Item label={t.fieldUpdated}>
            {fmt(device.updatedAt)}
          </Descriptions.Item>
        </Descriptions>
      ) : null}
    </Drawer>
  )
}
