import { useI18n } from '../../../../../shared/i18n'
import { busyScheduleMessages } from '../../../../busy-schedule/busySchedule.messages'
import { cellKey } from '../../../../busy-schedule/lib/busySessions'
import type { BusySchedule, BusySession } from '../../../../busy-schedule/types'
import { availabilityPageMessages } from '../AvailabilityPage.messages'

export type CellContext = {
  busyByCell: Map<string, BusySchedule>
  pendingKeys: Set<string>
  canAddMore: boolean
  isPast: (date: string, session: BusySession) => boolean
  onToggle: (date: string, session: BusySession) => void
}

/** One day x session toggle button, shared by the desktop grid and the mobile day list. */
export function SessionCell({
  date,
  session,
  dayLabel,
  withSessionName,
  ctx,
}: {
  date: string
  session: BusySession
  dayLabel: string
  withSessionName?: boolean
  ctx: CellContext
}) {
  const { t } = useI18n(busyScheduleMessages)
  const { t: p } = useI18n(availabilityPageMessages)
  const key = cellKey(date, session)
  const busy = ctx.busyByCell.get(key)
  const past = ctx.isPast(date, session)
  const disabled = past || ctx.pendingKeys.has(key) || (!busy && !ctx.canAddMore)
  const state = busy ? p.busyLabel : past ? p.pastLabel : p.freeLabel
  return (
    <button
      type="button"
      data-testid={`cell-${key}`}
      className={`odm-busy-cell ${busy ? 'is-busy' : 'is-free'}${past ? ' is-past' : ''}`}
      aria-pressed={Boolean(busy)}
      aria-label={p.cellLabel(dayLabel, t.sessionsShort[session], state)}
      disabled={disabled}
      onClick={() => ctx.onToggle(date, session)}
    >
      {withSessionName ? (
        <span className="odm-busy-cell-name">{t.sessionsShort[session]}</span>
      ) : null}
      <span>{busy ? p.busyLabel : past ? '–' : p.freeLabel}</span>
    </button>
  )
}
