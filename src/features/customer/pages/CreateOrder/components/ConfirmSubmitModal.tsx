import { Modal } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import type {
  PreferredTimeOption,
  ServiceOption,
  ServicePricingEstimate,
} from '../../../api/customerApi'
import { formatMoney } from '../../../lib/createOrder/format'
import { calcArea } from '../../../lib/createOrder/payload'
import { localizeTimeslot } from '../../../lib/i18n/timeslots'
import { localizeServiceName } from '../../../lib/i18n/serviceNames'
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
  aiAnalysisRequested?: boolean
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

  const footer = (
    <>
      <button type="button" className="odm-btn odm-btn-gh" onClick={p.onClose} disabled={p.submitting}>
        {t.back}
      </button>
      <button type="button" className="odm-btn odm-btn-p" onClick={p.onConfirm} disabled={p.submitting}>
        {p.submitting ? t.submitting : t.confirm}
      </button>
    </>
  )

  return (
    <Modal
      title={t.title}
      subtitle={t.subtitle}
      icon="check"
      tone="primary"
      width={560}
      onClose={p.onClose}
      footer={footer}
    >
      <p className="co-hint"><strong>{form.title}</strong></p>
      <dl className="co-rows co-mt">
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
        <dd className="co-mono">{`${form.preferredDateFrom} → ${form.preferredDateTo}`}</dd>
        {p.time && (
          <>
            <dt>{t.timeWindow}</dt>
            <dd>{localizeTimeslot(p.time, lang)}</dd>
          </>
        )}
        <dt>{t.location}</dt>
        <dd>{form.address || '—'}</dd>
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
        <dd>{form.resultFormats.map((format) => d.formats[format]).join(', ') || '—'}</dd>
        <dt>{t.deliveryMethods}</dt>
        <dd>{form.deliveryMethods.map((method) => d.methods[method]).join(', ') || '—'}</dd>
        <dt>{t.retention}</dt>
        <dd>{t.retentionDays(form.dataRetentionDays)}</dd>
        {p.aiAnalysisRequested && (
          <>
            <dt>{t.aiAnalysis}</dt>
            <dd>{t.aiYes}</dd>
          </>
        )}
      </dl>
      <div className="co-confirm-total co-row-between">
        <span>{t.total}</span>
        <span>
          {p.pricingEstimate ? formatMoney(p.pricingEstimate.totalPrice, locale) : t.totalUnknown}
        </span>
      </div>
      <p className="co-hint co-mt">
        {p.pricingEstimate?.quotePending ? t.priceNotePending : t.priceNote}
      </p>
      <p className="co-hint">{t.note}</p>
      {p.error && <div className="co-notice is-danger co-mt" role="alert">{p.error}</div>}
    </Modal>
  )
}
