import { Card, FormField } from '../../../components/common/ui'
import { useI18n } from '../../../../../shared/i18n'
import type {
  FormErrors,
  FormState,
  RecurrenceType,
  UpdateField,
  WeatherFallback,
} from '../../../lib/createOrder/types'
import { DateEcho } from './DateEcho'
import { scheduleOptionsCardMessages } from './ScheduleOptionsCard.messages'

type Props = {
  form: FormState
  errors: FormErrors
  update: UpdateField
}

const RECURRENCE: RecurrenceType[] = ['NONE', 'WEEKLY', 'MONTHLY']
const WEATHER: WeatherFallback[] = ['AUTO_RESCHEDULE', 'CONTACT_CUSTOMER', 'CANCEL_ORDER']

/** Recurrence, flight-incident fallback and result deadline for the schedule. */
export function ScheduleOptionsCard({ form, errors, update }: Props) {
  const { t } = useI18n(scheduleOptionsCardMessages)
  const repeating = form.recurrenceType !== 'NONE'
  return (
    <Card title={t.cardTitle}>
      <p className="co-hint co-card-sub">{t.cardHint}</p>

      <fieldset className="co-opt-group">
        <legend>{t.repeatLegend}</legend>
        <div className="co-segmented">
          {RECURRENCE.map((value) => (
            <label key={value} className={form.recurrenceType === value ? 'is-on' : ''}>
              <input
                type="radio"
                name="co-recurrence"
                value={value}
                checked={form.recurrenceType === value}
                onChange={() => update('recurrenceType', value)}
              />
              {t.repeat[value]}
            </label>
          ))}
        </div>
        {repeating && (
          <div className="co-mt">
            <FormField
              id="co-occurrences"
              label={t.occurrences}
              error={errors.recurrenceOccurrences}
            >
              <input
                id="co-occurrences"
                type="number"
                min={2}
                max={52}
                className="co-input co-input-narrow"
                value={form.recurrenceOccurrences}
                onChange={(e) => update('recurrenceOccurrences', Number(e.target.value))}
              />
            </FormField>
            <p className="co-hint">
              {t.occurrencesHint(
                form.recurrenceType as 'WEEKLY' | 'MONTHLY',
                form.recurrenceOccurrences || 0,
              )}
            </p>
          </div>
        )}
      </fieldset>

      <fieldset className="co-opt-group">
        <legend>{t.weatherLegend}</legend>
        <p className="co-help">{t.weatherHint}</p>
        <div className="co-choice-list">
          {WEATHER.map((value) => (
            <label
              key={value}
              className={`co-choice${form.weatherFallback === value ? ' is-on' : ''}`}
            >
              <input
                type="radio"
                name="co-weather"
                value={value}
                checked={form.weatherFallback === value}
                onChange={() => update('weatherFallback', value)}
              />
              <span>
                <strong>{t.weather[value].title}</strong>
                <small>{t.weather[value].desc}</small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="co-opt-group">
        <FormField
          id="co-deadline"
          label={`${t.deadline} ${t.deadlineOptional}`}
          error={errors.resultDeadline}
        >
          <input
            id="co-deadline"
            type="date"
            className="co-input co-input-narrow"
            min={form.preferredDateTo || undefined}
            value={form.resultDeadline}
            onChange={(e) => update('resultDeadline', e.target.value)}
          />
          {form.resultDeadline && (
            <DateEcho value={form.resultDeadline} />
          )}
        </FormField>
        <p className="co-hint">{t.deadlineHint}</p>
      </div>
    </Card>
  )
}
