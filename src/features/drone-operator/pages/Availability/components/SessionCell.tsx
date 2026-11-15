import { useI18n } from '../../../../../shared/i18n'
import { busyScheduleMessages } from '../../../../busy-schedule/busySchedule.messages'
import { BUSY_SESSIONS, cellKey } from '../../../../busy-schedule/lib/busySessions'
import type { BusySchedule, BusySession } from '../../../../busy-schedule/types'
import { availabilityPageMessages } from '../AvailabilityPage.messages'

export type CellContext = {
  busyByCell: Map<string, BusySchedule>
  pendingKeys: Set<string>
  canAddMore: boolean
  isPast: (date: string, session: BusySession) => boolean
  onToggle: (date: string, session: BusySession) => void
}

const pad = (n: number) => String(n).padStart(2, '0')

function StateIcon({ kind }: { kind: 'free' | 'busy' | 'past' }) {
  const path =
    kind === 'free'
      ? 'M5 12.5l4.5 4.5L19 7.5'
      : kind === 'busy'
        ? 'M6 6l12 12M18 6L6 18'
        : 'M12 7v5l3 2'
  return (
    <svg
      className="odm-busy-cell-icon"
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {kind === 'past' ? <circle cx="12" cy="12" r="9" /> : null}
      <path d={path} />
    </svg>
  )
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
  const kind = busy ? 'busy' : past ? 'past' : 'free'
  const spec = BUSY_SESSIONS.find((s) => s.session === session)
  const note = busy?.notes?.trim()
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
      ) : (
        <span className="odm-busy-cell-meta">
          <span>{t.sessionsShort[session]}</span>
          {spec ? <span>{`${pad(spec.start)}–${pad(spec.end)}h`}</span> : null}
        </span>
      )}
      <span className="odm-busy-cell-state">
        <StateIcon kind={kind} />
        {busy ? p.busyLabel : past ? (withSessionName ? '–' : p.pastLabel) : p.freeLabel}
      </span>
      {note && !withSessionName ? <span className="odm-busy-cell-note">{note}</span> : null}
    </button>
  )
}
