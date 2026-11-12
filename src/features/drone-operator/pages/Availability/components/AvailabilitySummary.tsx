import { CardComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { busyScheduleMessages } from '../../../../busy-schedule/busySchedule.messages'
import { isSessionPast } from '../../../../busy-schedule/lib/busySessions'
import type { BusySchedule, BusySession, WeeklyBusySchedule } from '../../../../busy-schedule/types'
import { availabilityPageMessages } from '../AvailabilityPage.messages'
import { dayShort } from './BusyScheduleGrid'

/** Quota progress, legend, this week's busy sessions (with cancel) and the one-line hint. */
export function AvailabilitySummary({
  week,
  pendingKeys,
  now,
  onCancel,
}: {
  week: WeeklyBusySchedule
  pendingKeys: Set<string>
  now: number
  onCancel: (date: string, session: BusySession) => void
}) {
  const { t } = useI18n(busyScheduleMessages)
  const { t: p } = useI18n(availabilityPageMessages)
  const full = week.remainingSessions <= 0
  const percent = Math.min(100, (week.usedSessions / Math.max(1, week.maxSessionsPerWeek)) * 100)
  const items: BusySchedule[] = [...week.items].sort((a, b) =>
    `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`),
  )
  return (
    <CardComponent title={p.summaryTitle} className="odm-avail-summary">
      <div className="odm-avail-quota">
        <div className="odm-avail-quota-text">
          <span>{p.quota(week.usedSessions, week.maxSessionsPerWeek)}</span>
        </div>
        <div
          className={`odm-avail-bar${full ? ' is-full' : ''}`}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={week.maxSessionsPerWeek}
          aria-valuenow={week.usedSessions}
        >
          <span style={{ width: `${percent}%` }} />
        </div>
        {full ? <p className="odm-avail-full">{p.quotaFull}</p> : null}
      </div>

      <ul className="odm-avail-legend" aria-label={p.legendTitle}>
        <li><i className="is-free" />{p.freeLabel}</li>
        <li><i className="is-busy" />{p.busyLabel}</li>
        <li><i className="is-past" />{p.pastLabel}</li>
      </ul>

      <h4 className="odm-avail-sub">{p.busyListTitle}</h4>
      {items.length === 0 ? (
        <p className="odm-avail-empty">{p.emptyWeek}</p>
      ) : (
        <ul className="odm-avail-list">
          {items.map((item) => {
            const past = isSessionPast(item.date, item.session, now)
            const pending = pendingKeys.has(`${item.date}|${item.session}`)
            return (
              <li key={item.id}>
                <div className="odm-avail-item-main">
                  <strong>{dayShort(item.date)}</strong>
                  <span>{t.sessions[item.session]}</span>
                  {item.notes ? <em>{item.notes}</em> : null}
                </div>
                <button
                  type="button"
                  className="odm-btn odm-btn-sm"
                  disabled={past || pending}
                  aria-label={p.cancelBusy(`${dayShort(item.date)} ${t.sessionsShort[item.session]}`)}
                  onClick={() => onCancel(item.date, item.session)}
                >
                  {p.cancel}
                </button>
              </li>
            )
          })}
        </ul>
      )}
      <p className="odm-avail-hint">{p.hint}</p>
    </CardComponent>
  )
}
