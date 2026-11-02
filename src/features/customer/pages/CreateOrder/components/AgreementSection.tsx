import { Checkbox } from 'antd'
import { InnerCollapse } from '../../../components/common/InnerCollapse'
import { useI18n } from '../../../../../shared/i18n'
import type {
  FormErrors,
  FormState,
  UpdateField,
} from '../../../lib/createOrder/types'
import { deliveryOptionsCardMessages } from './DeliveryOptionsCard.messages'

type Props = {
  form: FormState
  errors: FormErrors
  update: UpdateField
  variant?: 'default' | 'review'
}

/** Required privacy and data-use agreement shared by both request flows. */
export function AgreementSection({
  form,
  errors,
  update,
  variant = 'default',
}: Props) {
  const { t } = useI18n(deliveryOptionsCardMessages)
  const error = errors.termsAccepted

  return (
    <section
      className={`co-terms co-terms-important${variant === 'review' ? ' co-review-agreement' : ''}`}
      aria-labelledby="co-terms-heading"
    >
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
        <h2 id="co-terms-heading" className="co-terms-title">
          {t.termsHeading}
        </h2>
        <span className="co-terms-badge">{t.termsRequired}</span>
      </div>
      <Checkbox
        className={`co-check co-terms-check${error ? ' has-error' : ''}`}
        name="termsAccepted"
        checked={form.termsAccepted}
        aria-invalid={Boolean(error)}
        aria-describedby={`co-terms-privacy${error ? ' co-terms-error' : ''}`}
        aria-errormessage={error ? 'co-terms-error' : undefined}
        onChange={(event) => update('termsAccepted', event.target.checked)}
      >
        <span className="co-terms-check-copy">
          <strong>{t.termsLabel}</strong>
          <small id="co-terms-privacy">{t.termsPrivacyNotice}</small>
        </span>
      </Checkbox>
      {error && (
        <div id="co-terms-error" className="ui-field-error" role="alert">
          {error}
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
    </section>
  )
}
