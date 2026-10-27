import { FileTextOutlined, RocketOutlined } from '@ant-design/icons'
import { Button } from 'antd'

import { managerHref } from '../../../manager/routes'

/** Deep links from a ticket to its order / mission pages (manager-only). */
export function OrderLink({
  orderId,
  label,
  title,
}: {
  orderId: string
  label: string
  title: string
}) {
  return (
    <Button
      type="link"
      size="small"
      className="sd-link"
      icon={<FileTextOutlined />}
      href={managerHref({ screen: 'orderReview', orderId })}
      title={title}
    >
      {label}
    </Button>
  )
}

export function MissionLink({
  missionId,
  label,
  title,
}: {
  missionId: string
  label: string
  title: string
}) {
  return (
    <Button
      type="link"
      size="small"
      className="sd-link"
      icon={<RocketOutlined />}
      href={managerHref({ screen: 'missionDispatch', missionId })}
      title={title}
    >
      {label}
    </Button>
  )
}
