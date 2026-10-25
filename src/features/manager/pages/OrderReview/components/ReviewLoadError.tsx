import { ReviewBreadcrumbHeader } from './ReviewBreadcrumbHeader'
import { managerHref } from '../../../routes'
import { orderReviewPageMessages } from '../OrderReviewPage.messages'
import { useI18n } from '../../../../../shared/i18n'

export function ReviewLoadError({
  orderId,
  is409,
}: {
  orderId: string
  is409: boolean
}) {
  const { t } = useI18n(orderReviewPageMessages)
  return (
    <div className="odm-mgr-dash">
      <ReviewBreadcrumbHeader orderId={orderId} t={t} />
      <div className="odm-card">
        <div className="odm-mgr-review-error">
          <div className="odm-mgr-review-error-icon" aria-hidden="true">
            !
          </div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{t.loadError}</div>
          <div style={{ color: 'var(--tx3)', maxWidth: 420, lineHeight: 1.5 }}>
            {is409 ? t.error409 : t.errorGeneric}
          </div>
          <a
            className="odm-btn odm-btn-p"
            href={managerHref({ screen: 'orderQueue' })}
          >
            {t.backToQueue}
          </a>
        </div>
      </div>
    </div>
  )
}
