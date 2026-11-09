import { Button } from 'antd'
import { Icon } from '../../../../../shared/components/Icon'
import { useI18n } from '../../../../../shared/i18n'
import { customerHref } from '../../../routes'
import { createdSuccessMessages } from './CreatedSuccess.messages'

export function CreatedSuccess({
  orderId,
  orderCode,
}: {
  orderId: string
  orderCode?: string | null
}) {
  const { t } = useI18n(createdSuccessMessages)
  return (
    <div className="co-success">
      <div className="co-success-icon" aria-hidden="true">
        <Icon name="check" width={28} height={28} />
      </div>
      <h2>{t.title}</h2>
      <p className="co-hint">{t.description}</p>
      <p className="co-hint">
        {t.orderCode}: <span className="co-mono">{orderCode ?? orderId}</span>
      </p>
      <Button href={customerHref({ screen: 'orders' })} type="primary">
        {t.viewMyOrders}
      </Button>
    </div>
  )
}
