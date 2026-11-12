import { useI18n } from '../../../../../shared/i18n'
import { busyScheduleMessages } from '../../../../busy-schedule/busySchedule.messages'
import { BUSY_SESSIONS } from '../../../../busy-schedule/lib/busySessions'
import { dayShort } from './BusyScheduleGrid'
import { SessionCell, type CellContext } from './SessionCell'
import './BusyScheduleGrid.css'

/** Phone: one row per day with three session chips (replaces the squeezed 7-column table). */
export function BusyDayList({
  days,
  today,
  ctx,
  label,
}: {
  days: string[]
  today: string
  ctx: CellContext
  label: string
}) {
  const { t } = useI18n(busyScheduleMessages)
  return (
    <ul className="odm-busy-days" aria-label={label}>
      {days.map((day, index) => (
        <li
          key={day}
          className={`odm-busy-day${day === today ? ' is-today' : ''}`}
          aria-current={day === today ? 'date' : undefined}
        >
          <div className="odm-busy-day-head">
            <span className="odm-busy-dow">{t.weekdayShort[index]}</span>
            <span className="odm-busy-date">{dayShort(day)}</span>
          </div>
          <div className="odm-busy-day-cells">
            {BUSY_SESSIONS.map(({ session }) => (
              <SessionCell
                key={session}
                date={day}
                session={session}
                dayLabel={`${t.weekdayShort[index]} ${dayShort(day)}`}
                withSessionName
                ctx={ctx}
              />
            ))}
          </div>
        </li>
      ))}
    </ul>
  )
}
