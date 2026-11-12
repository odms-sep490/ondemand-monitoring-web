import { useI18n } from '../../../../../shared/i18n'
import { busyScheduleMessages } from '../../../../busy-schedule/busySchedule.messages'
import {
  BUSY_SESSIONS,
  cellKey,
  isSessionPast,
} from '../../../../busy-schedule/lib/busySessions'
import type { BusySchedule, BusySession } from '../../../../busy-schedule/types'
import { availabilityPageMessages } from '../AvailabilityPage.messages'
import './BusyScheduleGrid.css'

export function BusyScheduleGrid({
  days,
  busyByCell,
  pendingKeys,
  canAddMore,
  now,
  onToggle,
}: {
  days: string[]
  busyByCell: Map<string, BusySchedule>
  pendingKeys: Set<string>
  canAddMore: boolean
  now: number
  onToggle: (date: string, session: BusySession) => void
}) {
  const { t } = useI18n(busyScheduleMessages)
  const { t: p } = useI18n(availabilityPageMessages)
  return (
    <div className="odm-card odm-busy-grid-wrap">
      <table className="odm-busy-grid">
        <thead>
          <tr>
            <th />
            {days.map((day, index) => (
              <th key={day} scope="col">
                {t.weekdayShort[index]} {day.slice(8)}/{day.slice(5, 7)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {BUSY_SESSIONS.map(({ session }) => (
            <tr key={session}>
              <th scope="row">{t.sessions[session]}</th>
              {days.map((day) => {
                const key = cellKey(day, session)
                const busy = busyByCell.get(key)
                const past = isSessionPast(day, session, now)
                const disabled =
                  past || pendingKeys.has(key) || (!busy && !canAddMore)
                return (
                  <td key={key}>
                    <button
                      type="button"
                      data-testid={`cell-${key}`}
                      className={`odm-busy-cell ${busy ? 'is-busy' : 'is-free'}${past ? ' is-past' : ''}`}
                      aria-pressed={Boolean(busy)}
                      disabled={disabled}
                      onClick={() => onToggle(day, session)}
                    >
                      {busy ? p.busyLabel : past ? '' : p.freeLabel}
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
