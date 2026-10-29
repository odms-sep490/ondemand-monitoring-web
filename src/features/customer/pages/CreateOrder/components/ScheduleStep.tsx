import { FileTextOutlined } from '@ant-design/icons'
import { Card } from '../../../components/common/ui'
import { useI18n } from '../../../../../shared/i18n'
import type {
  PreferredTimeOption,
  ServiceOption,
} from '../../../api/customerApi'
import { calcArea } from '../../../lib/createOrder/payload'
import type {
  FormErrors,
  FormState,
  UpdateField,
} from '../../../lib/createOrder/types'
import { localizeServiceName } from '../../../lib/i18n/serviceNames'
import { localizeTimeslot } from '../../../lib/i18n/timeslots'
import { ScheduleCard } from './ScheduleCard'
import { ScheduleOptionsCard } from './ScheduleOptionsCard'
import { scheduleStepMessages } from './ScheduleStep.messages'

type Props = {
  form: FormState
  errors: FormErrors
  update: UpdateField
  preferredTimes: PreferredTimeOption[]
  service?: ServiceOption
  time?: PreferredTimeOption
}

/** `2026-10-07` → `07/10/2026` for Vietnamese; other values pass through. */
function formatDate(value: string, lang: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return value
  return lang === 'vi'
    ? `${match[3]}/${match[2]}/${match[1]}`
    : `${match[2]}/${match[3]}/${match[1]}`
}

/** Whole days between two ISO dates, inclusive; null when either is missing/invalid. */
function inclusiveDays(from: string, to: string) {
  const start = Date.parse(from)
  const end = Date.parse(to)
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null
  return Math.round((end - start) / 86_400_000) + 1
}

/** Step 5: preferred dates and time window, with a compact schedule context on the side. */
export function ScheduleStep(p: Props) {
  const { t, lang } = useI18n(scheduleStepMessages)
  const { form } = p
  const from = formatDate(form.preferredDateFrom, lang)
  const to = formatDate(form.preferredDateTo, lang)
  const dates = !from
    ? t.notSelected
    : to && to !== from
      ? `${from} → ${to}`
      : from
  const days = inclusiveDays(form.preferredDateFrom, form.preferredDateTo)

  return (
    <>
      <div className="co-grid is-service is-schedule">
        <div className="co-stack">
          <ScheduleCard
            form={form}
            errors={p.errors}
            update={p.update}
            preferredTimes={p.preferredTimes}
          />
          <ScheduleOptionsCard
            form={form}
            errors={p.errors}
            update={p.update}
          />
        </div>
        <aside className="co-stack co-summary is-tall">
          <Card icon={<FileTextOutlined />} title={t.summaryTitle}>
            <dl className="co-sum-list">
              <div className="co-sum-item">
                <span className="co-sum-icon" aria-hidden="true" />
                <div className="co-sum-body">
                  <dt>{t.service}</dt>
                  <dd>
                    {p.service
                      ? localizeServiceName(p.service.id, lang, p.service.name)
                      : t.notSelected}
                  </dd>
                </div>
              </div>
              <div className="co-sum-item">
                <span className="co-sum-icon" aria-hidden="true" />
                <div className="co-sum-body">
                  <dt>{t.location}</dt>
                  <dd className="is-clamp" title={form.address || undefined}>
                    {form.address || t.noAddress}
                  </dd>
                  <dd className="is-sub">
                    {t.radius(form.radiusM, calcArea(form.radiusM))}
                  </dd>
                </div>
              </div>
              <div className="co-sum-item">
                <span className="co-sum-icon" aria-hidden="true" />
                <div className="co-sum-body">
                  <dt>{t.dates}</dt>
                  <dd>{dates}</dd>
                  {days !== null && <dd className="is-sub">{t.days(days)}</dd>}
                </div>
              </div>
              <div className="co-sum-item">
                <span className="co-sum-icon" aria-hidden="true" />
                <div className="co-sum-body">
                  <dt>{t.timeWindow}</dt>
                  <dd>
                    {p.time ? localizeTimeslot(p.time, lang) : t.notSelected}
                  </dd>
                </div>
              </div>
              <div className="co-sum-item">
                <span className="co-sum-icon" aria-hidden="true" />
                <div className="co-sum-body">
                  <dt>{t.repeat}</dt>
                  <dd>
                    {form.recurrenceType === 'WEEKLY'
                      ? t.repeatWeekly(form.recurrenceOccurrences)
                      : form.recurrenceType === 'MONTHLY'
                        ? t.repeatMonthly(form.recurrenceOccurrences)
                        : t.repeatNone}
                  </dd>
                </div>
              </div>
              <div className="co-sum-item">
                <span className="co-sum-icon" aria-hidden="true" />
                <div className="co-sum-body">
                  <dt>{t.weather}</dt>
                  <dd>{t.weatherValues[form.weatherFallback]}</dd>
                </div>
              </div>
              <div className="co-sum-item">
                <span className="co-sum-icon" aria-hidden="true" />
                <div className="co-sum-body">
                  <dt>{t.deadline}</dt>
                  <dd>
                    {form.resultDeadline
                      ? formatDate(form.resultDeadline, lang)
                      : t.noDeadline}
                  </dd>
                </div>
              </div>
            </dl>
          </Card>
        </aside>
      </div>
    </>
  )
}
