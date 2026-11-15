import { CalendarOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { Card } from '../../../components/common/ui'
import { useI18n } from '../../../../../shared/i18n'
import type {
  PreferredTimeOption,
  ServiceOption,
} from '../../../api/customerApi'
import type {
  FormErrors,
  FormState,
  UpdateField,
} from '../../../lib/createOrder/types'
import { localizeTimeslot } from '../../../lib/i18n/timeslots'
import { ScheduleCard } from './ScheduleCard'
import { ScheduleOptionsCard } from './ScheduleOptionsCard'
import { scheduleStepMessages } from './ScheduleStep.messages'
import './ScheduleStep.css'

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
      <div className="co-schedule-layout">
        <div className="co-schedule-form">
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
        <aside className="co-schedule-summary">
          <Card icon={<CalendarOutlined />} title={t.summaryTitle}>
            <div className="co-schedule-calendar" aria-hidden="true"><CalendarOutlined /><span>{lang === 'vi' ? 'Lịch dự kiến' : 'Planned schedule'}</span></div>
            <div className="co-schedule-date">
              <span>{t.dates}</span>
              <strong>{dates}</strong>
              {form.preferredDateFrom && <small>{new Date(`${form.preferredDateFrom}T12:00:00`).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'long' })}</small>}
              {days !== null && days > 1 && <small>{t.days(days)}</small>}
            </div>
            <div className={`co-schedule-time${p.time ? '' : ' is-pending'}`}>
              <ClockCircleOutlined aria-hidden="true" />
              <div><span>{t.timeWindow}</span><strong>{p.time ? localizeTimeslot(p.time, lang) : t.notSelected}</strong></div>
            </div>
            {(form.recurrenceType === 'WEEKLY' || form.recurrenceType === 'MONTHLY' || form.resultDeadline) && <dl className="co-schedule-extras">
              {form.recurrenceType !== 'NONE' && <div><dt>{t.repeat}</dt><dd>{form.recurrenceType === 'WEEKLY' ? t.repeatWeekly(form.recurrenceOccurrences) : t.repeatMonthly(form.recurrenceOccurrences)}</dd></div>}
              {form.resultDeadline && <div><dt>{t.deadline}</dt><dd>{formatDate(form.resultDeadline, lang)}</dd></div>}
            </dl>}
            <div className="co-schedule-next">
              <strong>{lang === 'vi' ? 'Lịch bay được xác nhận thế nào?' : 'How is the schedule confirmed?'}</strong>
              <ol><li>{lang === 'vi' ? 'Bạn chọn ngày và khung giờ phù hợp.' : 'Choose your preferred dates and time.'}</li><li>{lang === 'vi' ? 'Đội vận hành kiểm tra và sắp xếp lịch.' : 'Our operations team reviews availability.'}</li><li>{lang === 'vi' ? 'Bạn nhận thông báo khi lịch được xác nhận.' : 'Receive a notification once confirmed.'}</li></ol>
            </div>
          </Card>
        </aside>
      </div>
    </>
  )
}
