import './CreatedSuccess.css'
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
  const { t, lang } = useI18n(createdSuccessMessages)
  return (
    <div className="co-success-page"><section className="co-success co-success-card" role="status">
      <div className="co-success-icon" aria-hidden="true">
        <Icon name="check" width={28} height={28} />
      </div>
      <h2>{t.title}</h2>
      <p className="co-hint">{t.description}</p>
      <div className="co-success-reference"><span>{t.orderCode}</span><strong>{orderCode ?? orderId}</strong></div>
      <Button href={customerHref({ screen: 'orderDetail', orderId })} type="primary">
        {lang === 'vi' ? 'Xem yêu cầu vừa tạo' : 'View your request'}
      </Button>
    </section></div>
  )
}
