import { ReadOnlyScope } from './ReadOnlyScope'
import { OrderServiceInfo } from '../../../components/common/OrderServiceInfo'
import { OrderCustomerRequestDetails } from '../../../components/common/OrderCustomerRequestDetails'
import { OrderStatusCard } from './OrderStatusCard'
import { OrderCustomerCard } from '../../../components/common/OrderCustomerCard'
import { OrderAttachmentsCard } from '../../../components/common/OrderAttachmentsCard'
import { InternalNoteCard } from './InternalNoteCard'
import { ReviewStageActions } from './ReviewStageActions'
import { orderReviewPageMessages } from '../OrderReviewPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { OrderDetail } from '../../../types/orders'
import type { ReviewStep } from '../reviewTypes'

export function ReviewStageRequest({
  readOnly,
  order,
  goToStep,
}: {
  readOnly: boolean
  order: OrderDetail
  goToStep: (step: ReviewStep) => void
}) {
  const { t, locale } = useI18n(orderReviewPageMessages)
  return (
    <div className="odm-or-review-stage" aria-label="Thông tin đơn">
      <ReadOnlyScope on={readOnly}>
        <section className="odm-or-grid odm-or-review-summary">
          <div className="odm-or-col">
            <OrderServiceInfo order={order} t={t} hideService />
            <OrderCustomerRequestDetails order={order} t={t} />
          </div>
          <div className="odm-or-col odm-or-summary-side">
            <OrderStatusCard order={order} t={t} locale={locale} />
            <OrderCustomerCard order={order} t={t} />
          </div>
        </section>
        <section className="odm-or-grid odm-or-review-more">
          <div className="odm-or-col">
            <OrderAttachmentsCard order={order} t={t} />
            <InternalNoteCard orderId={order.id} t={t} locale={locale} />
          </div>
        </section>
      </ReadOnlyScope>
      <ReviewStageActions step={1} onNext={() => goToStep(2)} />
    </div>
  )
}
