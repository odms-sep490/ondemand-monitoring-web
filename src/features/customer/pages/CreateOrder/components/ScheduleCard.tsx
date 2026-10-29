import { CalendarOutlined } from '@ant-design/icons'
import { Card, FormField } from '../../../components/common/ui'
import { useI18n } from '../../../../../shared/i18n'
import type { PreferredTimeOption } from '../../../api/customerApi'
import { localizeTimeslot } from '../../../lib/i18n/timeslots'
import type { FormErrors, FormState, UpdateField } from '../../../lib/createOrder/types'
import { DateEcho } from './DateEcho'
import { scheduleCardMessages } from './ScheduleCard.messages'
import { todayPlus } from '../../../lib/createOrder/format'

type Props = {
  form: FormState
  errors: FormErrors
  update: UpdateField
  preferredTimes: PreferredTimeOption[]
}

export function ScheduleCard({ form, errors, update, preferredTimes }: Props) {
  const { t, lang } = useI18n(scheduleCardMessages)
  const earliestFlightDate = todayPlus(7)
  return (
    <Card icon={<CalendarOutlined />} title={t.cardTitle}>
      <p className="co-hint">{t.dateRangeHint}</p>
      <div className="co-notice is-info co-mt" role="note">
        <strong>{t.advanceNoticeTitle}</strong>
        <span>{t.advanceNoticeBody}</span>
      </div>
      <div className="co-two co-mt">
        <FormField id="co-from" label={t.startDate} required error={errors.preferredDateFrom}>
          <input
            id="co-from"
            type="date"
            className="co-input"
            min={earliestFlightDate}
            value={form.preferredDateFrom}
            onChange={(e) => update('preferredDateFrom', e.target.value)}
          />
          <DateEcho value={form.preferredDateFrom} />
        </FormField>
        <FormField id="co-to" label={t.endDate} required error={errors.preferredDateTo}>
          <input
            id="co-to"
            type="date"
            className="co-input"
            min={form.preferredDateFrom || earliestFlightDate}
            value={form.preferredDateTo}
            onChange={(e) => update('preferredDateTo', e.target.value)}
          />
          <DateEcho value={form.preferredDateTo} />
        </FormField>
      </div>
      <FormField id="co-time" label={t.timeWindow} required error={errors.preferredTimeId}>
        <select
          id="co-time"
          className={`co-input${errors.preferredTimeId ? ' is-error' : ''}`}
          aria-invalid={Boolean(errors.preferredTimeId)}
          value={form.preferredTimeId}
          onChange={(e) => update('preferredTimeId', e.target.value)}
        >
          <option value="">{preferredTimes.length ? t.selectTimeWindow : t.noTimes}</option>
          {preferredTimes.map((time) => (
            <option key={time.id} value={time.id}>
              {localizeTimeslot(time, lang)}
            </option>
          ))}
        </select>
      </FormField>
    </Card>
  )
}
