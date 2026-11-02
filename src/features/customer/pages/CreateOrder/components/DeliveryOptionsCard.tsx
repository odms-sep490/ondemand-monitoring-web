import { Checkbox } from 'antd'
import { SendOutlined } from '@ant-design/icons'
import type { ReactNode } from 'react'
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
import { AgreementSection } from './AgreementSection'
import { deliveryOptionsCardMessages } from './DeliveryOptionsCard.messages'

type Props = {
  form: FormState
  errors: FormErrors
  update: UpdateField
  /** Images and videos requested in the checklists; they decide the PHOTO and VIDEO result formats. */
  mediaTotals: { images: number; videos: number }
  /** The compact review uses the media summary as a slot and separates consent. */
  variant?: 'default' | 'review'
  children?: ReactNode
}

/** Result formats, delivery method and retention period. */
export function DeliveryOptionsCard({
  form,
  errors,
  update,
  mediaTotals,
  variant = 'default',
  children,
}: Props) {
  const { t } = useI18n(deliveryOptionsCardMessages)
  const isReview = variant === 'review'
  const derived = (format: (typeof RESULT_FORMATS)[number]) =>
    format === 'PHOTO'
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
      className={`co-delivery-options-card${isReview ? ' is-review' : ''}`}
      icon={<SendOutlined />}
      title={isReview ? t.reviewTitle : t.cardTitle}
    >
      {!isReview && <p className="co-hint co-card-sub">{t.cardSubtitle}</p>}
      {children}

      <div
        className={isReview ? 'co-review-delivery-field is-format' : undefined}
      >
        <FormField
          id="co-result-formats"
          label={isReview ? t.optionalFormatLabel : t.formatsLabel}
          required={!isReview}
          error={errors.resultFormats}
        >
          <div
            className="co-chip-group"
            role="group"
            aria-label={t.formatsLabel}
          >
            {RESULT_FORMATS.filter(
              (format) => !isReview || format === 'PDF_REPORT',
            ).map((format) => (
              <Checkbox
                key={format}
                className={`co-chip-option${form.resultFormats.includes(format) ? ' is-on' : ''}`}
                name="resultFormats"
                checked={form.resultFormats.includes(format)}
                disabled={!isReview && derived(format) !== undefined}
                aria-invalid={Boolean(errors.resultFormats)}
                onChange={() =>
                  update('resultFormats', toggle(form.resultFormats, format))
                }
              >
                {t.formats[format]}
              </Checkbox>
            ))}
          </div>
          {!isReview && <p className="co-hint">{t.formatsHint}</p>}
        </FormField>
      </div>

      <div
        className={isReview ? 'co-review-delivery-field is-method' : undefined}
      >
        <FormField
          id="co-delivery-methods"
          label={t.methodsLabel}
          required
          error={errors.deliveryMethods}
        >
          <div
            className="co-chip-group"
            role="group"
            aria-label={t.methodsLabel}
          >
            {DELIVERY_METHODS.map((method) => (
              <Checkbox
                key={method}
                className={`co-chip-option${form.deliveryMethods.includes(method) ? ' is-on' : ''}`}
                name="deliveryMethods"
                checked={form.deliveryMethods.includes(method)}
                aria-invalid={Boolean(errors.deliveryMethods)}
                onChange={() =>
                  update(
                    'deliveryMethods',
                    toggle(form.deliveryMethods, method),
                  )
                }
              >
                {t.methods[method]}
              </Checkbox>
            ))}
          </div>
        </FormField>
      </div>

      <div
        className={
          isReview ? 'co-review-delivery-field is-retention' : undefined
        }
      >
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
          {!isReview && <p className="co-hint">{t.retentionHint}</p>}
        </FormField>
      </div>

      {!isReview && (
        <AgreementSection form={form} errors={errors} update={update} />
      )}
    </Card>
  )
}
