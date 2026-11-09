import { CameraOutlined, AimOutlined } from '@ant-design/icons'
import { Button } from 'antd'

import { useI18n } from '../../../../../shared/i18n'
import type { OrderDetailView } from '../../../lib/orders/types'
import { customerHref } from '../../../routes'
import { orderActionsMessages } from './OrderActions.messages'

export function OrderActions({ order }: { order: OrderDetailView }) {
  const { t } = useI18n(orderActionsMessages)
  const active = order.status === 'IN_PROGRESS'
  const hasMedia = active || order.status === 'COMPLETED'
  if (!hasMedia) return null

  return (
    <>
      {active && (
        <Button
          type="primary"
          icon={<AimOutlined aria-hidden="true" aria-label={undefined} />}
          href={customerHref({ screen: 'live', orderId: order.id })}
        >
          {t.live}
        </Button>
      )}
      {hasMedia && (
        <Button
          icon={<CameraOutlined aria-hidden="true" aria-label={undefined} />}
          href={customerHref({ screen: 'media', orderId: order.id })}
        >
          {t.media}
        </Button>
      )}
    </>
  )
}
