import { DollarOutlined } from '@ant-design/icons'
import { Card } from '../../../components/common/ui'
import { useI18n } from '../../../../../shared/i18n'
import type { ServicePricingEstimate } from '../../../api/customerApi'
import { formatMoney } from '../../../lib/createOrder/format'
import { usesMedia, type ChecklistRow } from '../../../lib/checklist/types'
import { pricingEstimateMessages } from './PricingEstimateCard.messages'

type Props = {
  checklistOnly?: boolean
  variant?: 'default' | 'review'
  estimate: ServicePricingEstimate | null
  loading: boolean
  hasService: boolean
  additionalChecklists?: ChecklistRow[]
}

function requestedMedia(row: ChecklistRow) {
  if (usesMedia(row))
    return { images: row.requestedImageCount, videos: row.requestedVideoCount }
  return row.requiredEvidenceType === 'VIDEO'
    ? { images: 0, videos: row.minimumEvidenceCount }
    : { images: row.minimumEvidenceCount, videos: 0 }
}

function contextualFeeLabel(
  type: string,
  t: typeof pricingEstimateMessages.vi,
) {
  switch (type) {
    case 'CONTEXT_AREA':
    case 'CONTEXT_EXTRA_AREA':
      return t.areaSurcharge
    case 'CONTEXT_DISTANCE':
      return t.distanceSurcharge
    case 'CONTEXT_ALTITUDE':
      return t.altitudeSurcharge
    case 'CONTEXT_EXTRA_IMAGE':
      return t.extraImages
    case 'CONTEXT_EXTRA_VIDEO':
      return t.extraVideos
    default:
      return t.contextSurcharge
  }
}

/** Pricing estimate from `GET /api/services/pricing-estimate`. */
export function PricingEstimateCard({
  checklistOnly = false,
  variant = 'default',
  estimate,
  loading,
  hasService,
  additionalChecklists = [],
}: Props) {
  const { t, locale, lang } = useI18n(pricingEstimateMessages)

  let body
  if (!hasService) body = <p className="co-hint">{t.pickService}</p>
  else if (loading && !estimate) body = <p className="co-hint">{t.loading}</p>
  else if (!estimate) body = <p className="co-hint">{t.unavailable}</p>
  else if (checklistOnly) {
    const outputFees = estimate.additionalRequirements.filter((item) => item.type.startsWith('OUTPUT_'))
    const checklistSubtotal = estimate.servicePrice + outputFees.reduce((sum, fee) => sum + fee.additionalPrice, 0)
    body = <div className="co-checklist-cost">
      <p className="co-hint">{lang === 'vi' ? 'Chi phí các nội dung giám sát đã chọn.' : 'Cost of your selected monitoring items.'}</p>
      <div className="co-money-row"><span>{t.servicePrice}</span><strong>{formatMoney(estimate.servicePrice, locale)}</strong></div>
      {outputFees.map((fee) => <div className="co-money-row" key={fee.type}><span>{fee.description}</span><strong>+{formatMoney(fee.additionalPrice, locale)}</strong></div>)}
      {additionalChecklists.length > 0 && <div className="co-money-row"><span>{t.additionalServiceRow}</span><strong>{t.additionalPending(additionalChecklists.length)}</strong></div>}
      <div className="co-money-row co-money-total"><span>{lang === 'vi' ? 'Tạm tính checklist' : 'Checklist subtotal'}</span><strong>{formatMoney(checklistSubtotal, locale)}</strong></div>
      <p className="co-estimate-notice">{lang === 'vi' ? 'Gồm nội dung giám sát và sản phẩm bàn giao. Quản lý sẽ xác nhận báo giá chính thức.' : 'Includes monitoring items and deliverables. The manager will confirm the final quote.'}</p>
    </div>
  }
  else {
    const deliverableFees = estimate.additionalRequirements.filter((item) =>
      item.type.startsWith('OUTPUT_'),
    )
    const contextualFees = estimate.additionalRequirements.filter((item) =>
      item.type.startsWith('CONTEXT_'),
    )
    const hasAdditionalServices =
      additionalChecklists.length > 0 || Boolean(estimate.quotePending)
    body = (
      <div className="co-money">
        <div className="co-money-row">
          <span>{t.servicePrice}</span>
          <strong>{formatMoney(estimate.servicePrice, locale)}</strong>
        </div>
        {contextualFees.map((fee) => (
          <div className="co-money-row" key={fee.type}>
            <span>{contextualFeeLabel(fee.type, t)}</span>
            <strong>+{formatMoney(fee.additionalPrice, locale)}</strong>
          </div>
        ))}
        {deliverableFees.length > 0 && (
          <section className="co-price-section" aria-label={t.deliverables}>
            <h3>{t.deliverables}</h3>
            {deliverableFees.map((fee) => (
              <div className="co-money-row" key={fee.type}>
                <span>{fee.description}</span>
                <strong>+{formatMoney(fee.additionalPrice, locale)}</strong>
              </div>
            ))}
          </section>
        )}
        {additionalChecklists.length > 0 && (
          <div className="co-money-row co-money-pending">
            <span>{t.additionalServiceRow}</span>
            <strong>{t.additionalPending(additionalChecklists.length)}</strong>
          </div>
        )}
        {(estimate.occurrences ?? 1) > 1 && (
          <p className="co-hint">{t.occurrences(estimate.occurrences ?? 1)}</p>
        )}
        <div className="co-money-row co-money-total">
          <span>{t.total}</span>
          <span>{formatMoney(estimate.totalPrice, locale)}</span>
        </div>
        <p className="co-estimate-notice">{t.estimateNotice}</p>
        {additionalChecklists.length > 0 && (
          <section
            className="co-additional-services"
            aria-labelledby="additional-services-title"
          >
            <h3 id="additional-services-title">{t.additionalServices}</h3>
            <ul>
              {additionalChecklists.map((item) => {
                const media = requestedMedia(item)
                return (
                  <li key={item.key}>
                    <strong>{item.content}</strong>
                    <span>{t.mediaCounts(media.images, media.videos)}</span>
                    <span className="co-additional-status">
                      {t.awaitingManagerQuote}
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>
        )}
        {hasAdditionalServices && (
          <p className="co-notice" role="status">
            {t.quotePending}
          </p>
        )}
      </div>
    )
  }
  return (
    <Card
      className={`co-pricing-estimate-card${variant === 'review' ? ' is-review' : ''}`}
      icon={<DollarOutlined />}
      title={checklistOnly ? (lang === 'vi' ? 'Chi phí checklist' : 'Checklist cost') : t.title}
    >
      {body}
    </Card>
  )
}
