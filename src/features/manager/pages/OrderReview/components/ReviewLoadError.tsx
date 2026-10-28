import { ArrowLeftOutlined } from '@ant-design/icons'
import { Button } from 'antd'

import { useI18n } from '../../../../../shared/i18n'
import { displayOrderCode } from '../../../../../shared/lib/orderCode'
import { ErrorState } from '../../../components/common/ErrorState'
import { PageHeader } from '../../../components/common/PageHeader'
import { managerHref } from '../../../routes'
import { orderReviewPageMessages } from '../OrderReviewPage.messages'

export function ReviewLoadError({
  orderId,
  is409,
}: {
  orderId: string
  is409: boolean
}) {
  const { t } = useI18n(orderReviewPageMessages)
  return (
    <div className="mgr-view">
      <PageHeader
        crumb={
          <a href={managerHref({ screen: 'orderQueue' })}>
            <ArrowLeftOutlined aria-hidden="true" /> {t.backToOrders}
          </a>
        }
        title={t.pageTitle}
        description={displayOrderCode(null, orderId)}
      />
      <ErrorState
        title={t.loadError}
        description={is409 ? t.error409 : t.errorGeneric}
        action={
          <Button type="primary" href={managerHref({ screen: 'orderQueue' })}>
            {t.backToQueue}
          </Button>
        }
      />
    </div>
  )
}
