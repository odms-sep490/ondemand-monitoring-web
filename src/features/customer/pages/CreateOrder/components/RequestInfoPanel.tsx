import { Card, FormField } from '../../../components/common/ui'
import { useI18n } from '../../../../../shared/i18n'
import {
  type FlightPurpose,
  type FormErrors,
  type FormState,
  type UpdateField,
  type UsagePurpose,
} from '../../../lib/createOrder/types'
import { AttachmentsField } from './AttachmentsField'
import { requestInfoPanelMessages } from './RequestInfoPanel.messages'

const DESCRIPTION_MAX = 2000
const FLIGHT_PURPOSE_OPTIONS = [
  'SURVEY_MONITORING',
  'CONSTRUCTION_MONITORING',
  'INDUSTRIAL_INSPECTION',
  'AREA_MONITORING',
  'FOREST_MONITORING',
  'OTHER',
] as const satisfies readonly FlightPurpose[]
const PURPOSES = ['INTERNAL', 'LEGAL', 'PARTNER_REPORT', 'OTHER'] as const

type Props = {
  form: FormState
  errors: FormErrors
  update: UpdateField
}

export function RequestInfoPanel({ form, errors, update }: Props) {
  const { t } = useI18n(requestInfoPanelMessages)

  return (
    <Card title={t.cardTitle}>
      <FormField
        id="co-title"
        label={t.titleLabel}
        required
        error={errors.title}
      >
        <input
          id="co-title"
          className="co-input"
          value={form.title}
          placeholder={t.titlePlaceholder}
          onChange={(e) => update('title', e.target.value)}
        />
      </FormField>
      <div className="co-mt">
        <FormField id="co-flight-purpose" label={t.flightPurposeLabel} required>
          <select
            id="co-flight-purpose"
            className="co-input"
            value={form.flightPurpose}
            onChange={(e) =>
              update('flightPurpose', e.target.value as FlightPurpose)
            }
          >
            {FLIGHT_PURPOSE_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {t.flightPurposes[p]}
              </option>
            ))}
          </select>
        </FormField>
        {form.flightPurpose === 'OTHER' ? (
          <div className="co-conditional-field">
            <FormField
              id="co-other-flight-purpose"
              label={t.otherFlightPurposeLabel}
              required
              error={errors.otherFlightPurpose}
            >
              <input
                id="co-other-flight-purpose"
                className="co-input"
                maxLength={200}
                value={form.otherFlightPurpose}
                placeholder={t.otherFlightPurposePlaceholder}
                onChange={(e) => update('otherFlightPurpose', e.target.value)}
              />
            </FormField>
          </div>
        ) : null}
      </div>
      <div className="co-mt">
        <FormField id="co-purpose" label={t.purposeLabel}>
          <select
            id="co-purpose"
            className="co-input"
            value={form.usagePurpose}
            onChange={(e) =>
              update('usagePurpose', e.target.value as UsagePurpose)
            }
          >
            <option value="">{t.purposePlaceholder}</option>
            {PURPOSES.map((p) => (
              <option key={p} value={p}>
                {t.purposes[p]}
              </option>
            ))}
          </select>
        </FormField>
        {form.usagePurpose === 'OTHER' ? (
          <div className="co-conditional-field">
            <FormField
              id="co-other-usage-purpose"
              label={t.otherUsagePurposeLabel}
              required
              error={errors.otherUsagePurpose}
            >
              <input
                id="co-other-usage-purpose"
                className="co-input"
                maxLength={200}
                value={form.otherUsagePurpose}
                placeholder={t.otherUsagePurposePlaceholder}
                onChange={(e) => update('otherUsagePurpose', e.target.value)}
              />
            </FormField>
          </div>
        ) : null}
      </div>
      <details className="co-optional-details">
        <summary>{t.optionalDetails}</summary>
        <div className="co-optional-details-body">
          <FormField id="co-desc" label={t.descriptionLabel}>
            <textarea
              id="co-desc"
              className="co-input"
              rows={3}
              maxLength={DESCRIPTION_MAX}
              value={form.description}
              placeholder={t.descriptionPlaceholder}
              onChange={(e) => update('description', e.target.value)}
            />
          </FormField>
          <div className="co-counter">
            {form.description.length} / {DESCRIPTION_MAX}
          </div>
          <AttachmentsField attachments={form.attachments} update={update} />
        </div>
      </details>
    </Card>
  )
}
