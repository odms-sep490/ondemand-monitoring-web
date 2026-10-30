import { Checkbox } from 'antd'
import { SendOutlined } from '@ant-design/icons'
import { InnerCollapse } from '../../../components/common/InnerCollapse'
import { useEffect } from 'react'
import { Card, FormField } from '../../../components/common/ui'
import { useI18n } from '../../../../../shared/i18n'
import {
  DELIVERY_METHODS,
  RESULT_FORMATS,
  RETENTION_DAYS,
  type FormErrors,
  type FormState,
  type UpdateField,
} from '../../../lib/createOrder/types'
import { deliveryOptionsCardMessages } from './DeliveryOptionsCard.messages'

type Props = {
  form: FormState
  errors: FormErrors
  update: UpdateField
  /** Images and videos requested in the checklists; they decide the PHOTO and VIDEO result formats. */
  mediaTotals: { images: number; videos: number }
}

/** Step 5: result formats, delivery method, retention period, terms acceptance. */
export function DeliveryOptionsCard({
  form,
  errors,
  update,
  mediaTotals,
}: Props) {
  const { t } = useI18n(deliveryOptionsCardMessages)
  // With no media in the checklists there is nothing to derive from, so every format stays a free choice.
  const hasMedia = mediaTotals.images + mediaTotals.videos > 0
  const derived = (format: (typeof RESULT_FORMATS)[number]) =>
    !hasMedia
      ? undefined
      : format === 'PHOTO'
        ? mediaTotals.images > 0
        : format === 'VIDEO'
          ? mediaTotals.videos > 0
          : undefined

  // Photo and video are not chosen here: they follow what the checklists ask for. Only the PDF report is optional.
  useEffect(() => {
    const wanted = RESULT_FORMATS.filter((format) => {
      const fromMedia = derived(format)
      return fromMedia === undefined
        ? form.resultFormats.includes(format)
        : fromMedia
    })
    if (
      wanted.length !== form.resultFormats.length ||
      wanted.some((format, index) => format !== form.resultFormats[index])
    )
      update('resultFormats', wanted)
  }, [mediaTotals.images, mediaTotals.videos, form.resultFormats])

  function toggle<T extends string>(list: readonly T[], value: T): T[] {
    return list.includes(value)
      ? list.filter((item) => item !== value)
      : [...list, value]
  }

  return (
    <Card
      className="co-delivery-options-card"
      icon={<SendOutlined />}
      title={t.cardTitle}
    >
      <p className="co-hint co-card-sub">{t.cardSubtitle}</p>

      <FormField
        id="co-result-formats"
        label={t.formatsLabel}
        required
        error={errors.resultFormats}
      >
        <div className="co-chip-group" role="group" aria-label={t.formatsLabel}>
          {RESULT_FORMATS.map((format) => (
            <Checkbox
              key={format}
              className={`co-chip-option${form.resultFormats.includes(format) ? ' is-on' : ''}`}
              name="resultFormats"
              checked={form.resultFormats.includes(format)}
              disabled={derived(format) !== undefined}
              aria-invalid={Boolean(errors.resultFormats)}
              onChange={() =>
                update('resultFormats', toggle(form.resultFormats, format))
              }
            >
              {t.formats[format]}
            </Checkbox>
          ))}
        </div>
        <p className="co-hint">{t.formatsHint}</p>
      </FormField>

      <FormField
        id="co-delivery-methods"
        label={t.methodsLabel}
        required
        error={errors.deliveryMethods}
      >
        <div className="co-chip-group" role="group" aria-label={t.methodsLabel}>
          {DELIVERY_METHODS.map((method) => (
            <Checkbox
              key={method}
              className={`co-chip-option${form.deliveryMethods.includes(method) ? ' is-on' : ''}`}
              name="deliveryMethods"
              checked={form.deliveryMethods.includes(method)}
              aria-invalid={Boolean(errors.deliveryMethods)}
              onChange={() =>
                update('deliveryMethods', toggle(form.deliveryMethods, method))
              }
            >
              {t.methods[method]}
            </Checkbox>
          ))}
        </div>
      </FormField>

      <FormField id="co-retention" label={t.retentionLabel}>
        <select
          id="co-retention"
          className="co-input"
          value={form.dataRetentionDays}
          onChange={(event) =>
            update(
              'dataRetentionDays',
              Number(event.target.value) as FormState['dataRetentionDays'],
            )
          }
        >
          {RETENTION_DAYS.map((days) => (
            <option key={days} value={days}>
              {t.days(days)}
            </option>
          ))}
        </select>
        <p className="co-hint">{t.retentionHint}</p>
      </FormField>

      <div className="co-terms co-terms-important">
        <div className="co-terms-head">
          <svg
            className="co-terms-icon"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />
            <path d="M12 8.5v4M12 15.5h.01" />
          </svg>
          <div className="co-terms-title">{t.termsHeading}</div>
          <span className="co-terms-badge">{t.termsRequired}</span>
        </div>
        <Checkbox
          className={`co-check co-terms-check${errors.termsAccepted ? ' has-error' : ''}`}
          name="termsAccepted"
          checked={form.termsAccepted}
          aria-invalid={Boolean(errors.termsAccepted)}
          aria-describedby={
            errors.termsAccepted ? 'co-terms-error' : 'co-terms-privacy'
          }
          onChange={(event) => update('termsAccepted', event.target.checked)}
        >
          <span className="co-terms-check-copy">
            <strong>{t.termsLabel}</strong>
            <small id="co-terms-privacy">{t.termsPrivacyNotice}</small>
          </span>
        </Checkbox>
        {errors.termsAccepted && (
          <div id="co-terms-error" className="ui-field-error" role="alert">
            {errors.termsAccepted}
          </div>
        )}
        <InnerCollapse className="co-terms-details" title={t.commitmentsToggle}>
          <ul className="co-terms-list">
            <li>{t.commitmentUse}</li>
            <li>{t.commitmentRetention}</li>
            <li>{t.commitmentResponsibility}</li>
            <li>{t.commitmentPermit}</li>
            <li className="is-key">{t.commitmentPrivacy}</li>
          </ul>
        </InnerCollapse>
      </div>
    </Card>
  )
}
