import { useI18n } from '../../../../../shared/i18n'
import { busyScheduleMessages } from '../../../../busy-schedule/busySchedule.messages'
import { BUSY_SESSIONS } from '../../../../busy-schedule/lib/busySessions'
import { SessionCell, type CellContext } from './SessionCell'
import './BusyScheduleGrid.css'

const pad = (n: number) => String(n).padStart(2, '0')
export const dayShort = (iso: string) => `${iso.slice(8)}/${iso.slice(5, 7)}`

/** Desktop / tablet: compact 7 x 3 table (days as columns, sessions as rows). */
export function BusyScheduleGrid({
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
    <table className="odm-busy-grid" aria-label={label}>
      <thead>
        <tr>
          <td />
          {days.map((day, index) => (
            <th
              key={day}
              scope="col"
              className={day === today ? 'is-today' : undefined}
              aria-current={day === today ? 'date' : undefined}
            >
              <span className="odm-busy-dow">{t.weekdayShort[index]}</span>
              <span className="odm-busy-date">{dayShort(day)}</span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {BUSY_SESSIONS.map(({ session, start, end }) => (
          <tr key={session}>
            <th scope="row" className="odm-busy-rowhead">
              <span className="odm-busy-session">{t.sessionsShort[session]}</span>
              <span className="odm-busy-range">
                {pad(start)}–{pad(end)}h
              </span>
            </th>
            {days.map((day, index) => (
              <td key={day} className={day === today ? 'is-today' : undefined}>
                <SessionCell
                  date={day}
                  session={session}
                  dayLabel={`${t.weekdayShort[index]} ${dayShort(day)}`}
                  ctx={ctx}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
