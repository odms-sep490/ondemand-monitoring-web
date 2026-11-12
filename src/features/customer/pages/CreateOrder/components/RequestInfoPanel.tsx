import { FormOutlined } from '@ant-design/icons'
import { InnerCollapse } from '../../../components/common/InnerCollapse'
import { Card, FormField } from '../../../components/common/ui'
import { useI18n } from '../../../../../shared/i18n'
import {
  type FlightPurpose,
  type FormErrors,
  type FormState,
  type UpdateField,
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
type Props = {
  form: FormState
  errors: FormErrors
  update: UpdateField
}

export function RequestInfoPanel({ form, errors, update }: Props) {
  const { t } = useI18n(requestInfoPanelMessages)

  return (
    <Card icon={<FormOutlined />} title={t.cardTitle}>
      <FormField
        id="co-title"
        label={t.titleLabel}
        required
        error={errors.title}
      >
        <input
          id="co-title"
          className="co-input"
          required
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? 'co-title-error' : undefined}
          value={form.title}
          placeholder={t.titlePlaceholder}
          onChange={(e) => update('title', e.target.value)}
        />
      </FormField>
      <div className="co-mt">
        <FormField
          id="co-flight-purpose"
          label={t.flightPurposeLabel}
          required
          error={errors.flightPurpose}
        >
          <select
            id="co-flight-purpose"
            className="co-input"
            required
            aria-invalid={Boolean(errors.flightPurpose)}
            aria-describedby={
              errors.flightPurpose ? 'co-flight-purpose-error' : undefined
            }
            value={form.flightPurpose}
            onChange={(e) =>
              update('flightPurpose', e.target.value as FlightPurpose | '')
            }
          >
            <option value="">{t.flightPurposePlaceholder}</option>
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
      </div>
      <InnerCollapse
        className="co-attachment-details"
        title={
          form.attachments.length > 0
            ? `${t.attachmentsTitle} · ${t.attachmentsCount(form.attachments.length)}`
            : t.attachmentsTitle
        }
      >
        <div className="co-attachment-details-body">
          <AttachmentsField attachments={form.attachments} update={update} />
        </div>
      </InnerCollapse>
    </Card>
  )
}
