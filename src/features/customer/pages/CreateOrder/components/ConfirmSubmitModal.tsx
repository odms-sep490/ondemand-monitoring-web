import './ConfirmSubmitModal.css'
import { Button } from 'antd'
import { Modal } from '../../../components/common/ui'
import { useI18n } from '../../../../../shared/i18n'
import type {
  PreferredTimeOption,
  ServiceOption,
  ServicePricingEstimate,
} from '../../../api/customerApi'
import { formatIsoDate } from '../../../lib/createOrder/dateFormat'
import { formatMoney } from '../../../lib/createOrder/format'
import { calcArea } from '../../../lib/createOrder/payload'
import { localizeTimeslot } from '../../../lib/i18n/timeslots'
import { localizeServiceName } from '../../../lib/i18n/serviceNames'
import { resultFormatsFromMediaTotals } from '../../../lib/checklist/types'
import type { FormState } from '../../../lib/createOrder/types'
import { confirmSubmitModalMessages } from './ConfirmSubmitModal.messages'
import { deliveryOptionsCardMessages } from './DeliveryOptionsCard.messages'

type Props = {
  form: FormState
  service?: ServiceOption
  pricingEstimate: ServicePricingEstimate | null
  /** Number of checklists selected and the photos/videos they ask for. */
  checklistCount?: number
  mediaTotals?: { images: number; videos: number }
  time?: PreferredTimeOption
  submitting: boolean
  error: string | null
  onConfirm: () => void
  onClose: () => void
}

/** Prominent final confirmation before `POST /api/orders`. */
export function ConfirmSubmitModal(p: Props) {
  const { t, locale, lang } = useI18n(confirmSubmitModalMessages)
  const { t: d } = useI18n(deliveryOptionsCardMessages)
  const media = p.mediaTotals
  const { form } = p
  const resultFormats = media
    ? resultFormatsFromMediaTotals(media)
    : form.resultFormats
  const dateFrom = formatIsoDate(form.preferredDateFrom, lang)
  const dateTo = formatIsoDate(form.preferredDateTo, lang)
  const preferredDates =
    dateFrom && dateTo
      ? dateFrom === dateTo
        ? dateFrom
        : `${dateFrom} → ${dateTo}`
      : dateFrom || dateTo || '—'

  const footer = (
    <>
      <Button onClick={p.onClose} disabled={p.submitting}>
        {t.back}
      </Button>
      <Button
        type="primary"
        onClick={p.onConfirm}
        disabled={p.submitting}
        loading={p.submitting}
      >
        {p.submitting ? t.submitting : t.confirm}
      </Button>
    </>
  )

  return (
    <Modal
      title={t.title}
      subtitle={t.subtitle}
      icon="check"
      tone="primary"
      width={600}
      onClose={p.onClose}
      footer={footer}
    >
      <div
        className="co-confirm-body"
        role="region"
        aria-label={t.requestDetails}
        tabIndex={0}
      >
        <div className="co-confirm-request">
          <span className="co-confirm-request__label">{t.requestName}</span>
          <strong className="co-confirm-request__value">{form.title || '—'}</strong>
        </div>
        <dl className="co-confirm-primary">
          <dt>{t.service}</dt>
          <dd>{p.service ? localizeServiceName(p.service.id, lang, p.service.name) : '—'}</dd>
          {p.checklistCount !== undefined && (
            <>
              <dt>{t.checklists}</dt>
              <dd>
                {t.checklistCount(p.checklistCount)}
                {media ? ` · ${t.mediaValue(media.images, media.videos)}` : ''}
              </dd>
            </>
          )}
          <dt>{t.dates}</dt>
          <dd>{preferredDates}</dd>
          {p.time && (
            <>
              <dt>{t.timeWindow}</dt>
              <dd>{localizeTimeslot(p.time, lang)}</dd>
            </>
          )}
          <dt>{t.location}</dt>
          <dd>{form.address || '—'}</dd>
        </dl>
        <details className="co-confirm-more">
          <summary>{lang === 'vi' ? 'Thông tin hiện trường & bàn giao' : 'Site & delivery details'}</summary>
          <dl className="co-confirm-secondary">
          <dt>{t.area}</dt>
          <dd>{t.areaValue(form.radiusM, calcArea(form.radiusM))}</dd>
          <dt>{t.altitude}</dt>
          <dd>{`${form.altitudeM} m`}</dd>
          {(form.siteContactName.trim() || form.siteContactPhone.trim()) && (
            <>
              <dt>{t.contact}</dt>
              <dd>{[form.siteContactName.trim(), form.siteContactPhone.trim()].filter(Boolean).join(' · ')}</dd>
            </>
          )}
          {form.permitStatus !== 'NONE' && (
            <>
              <dt>{t.permit}</dt>
              <dd>
                {form.permitStatus === 'HAVE_PERMIT'
                  ? t.permitHave(form.permitNumber.trim())
                  : t.permitSupport}
              </dd>
            </>
          )}
          <dt>{t.resultFormats}</dt>
          <dd>{resultFormats.map((format) => d.formats[format]).join(', ') || '—'}</dd>
          <dt>{t.deliveryMethods}</dt>
          <dd>{form.deliveryMethods.map((method) => d.methods[method]).join(', ') || '—'}</dd>
          <dt>{t.retention}</dt>
          <dd>{t.retentionDays(form.dataRetentionDays)}</dd>
          </dl>
        </details>
        <div className="co-confirm-total co-row-between">
          <span>{t.total}</span>
          <span>
            {p.pricingEstimate ? formatMoney(p.pricingEstimate.totalPrice, locale) : t.totalUnknown}
          </span>
        </div>
        <p className="co-hint co-mt">
          {p.pricingEstimate?.quotePending ? t.priceNotePending : t.priceNote}
        </p>

        {p.error && <div className="co-notice is-danger co-mt" role="alert">{p.error}</div>}
      </div>
    </Modal>
  )
}
