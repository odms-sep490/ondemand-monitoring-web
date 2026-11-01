import { Tag } from 'antd'

import { useI18n } from '../../../../../shared/i18n'
import { DEVICE_STATUS_COLOR } from '../../../lib/deviceStatus'
import type { DeviceStatus } from '../../../types/devices'
import { devicesPageMessages } from '../DevicesPage.messages'

export function DeviceStatusTag({ status }: { status: DeviceStatus }) {
  const { t } = useI18n(devicesPageMessages)
  return (
    <Tag
      bordered={false}
      color={DEVICE_STATUS_COLOR[status]}
      className="mgr-status-tag"
    >
      <span className="mgr-dot" aria-hidden="true" />
      {t.statuses[status]}
    </Tag>
  )
}
